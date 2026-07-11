import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { createGunzip } from "node:zlib";
import { Product } from "../models/Product.js";

const DEFAULT_TARGET = 2000;
const DATASET_BASE_URL =
  "https://mcauleylab.ucsd.edu/public_datasets/data/amazon_2023/raw/meta_categories";

const SOURCES = [
  {
    file: "meta_Electronics.jsonl.gz",
    type: "electronics",
    categoryKey: "electronics",
    categoryLabel: "Electronics",
    icon: "💻",
    quota: 220,
    minPrice: 20,
    maxPrice: 1800,
  },
  {
    file: "meta_Cell_Phones_and_Accessories.jsonl.gz",
    type: "mobile",
    categoryKey: "mobile",
    categoryLabel: "Phones & Accessories",
    icon: "📱",
    quota: 180,
    minPrice: 8,
    maxPrice: 1200,
  },
  {
    file: "meta_Home_and_Kitchen.jsonl.gz",
    type: "home",
    categoryKey: "home",
    categoryLabel: "Home & Kitchen",
    icon: "🏠",
    quota: 250,
    minPrice: 8,
    maxPrice: 1500,
  },
  {
    file: "meta_Clothing_Shoes_and_Jewelry.jsonl.gz",
    type: "fashion",
    categoryKey: "fashion",
    categoryLabel: "Fashion",
    icon: "👕",
    quota: 250,
    minPrice: 8,
    maxPrice: 600,
  },
  {
    file: "meta_Beauty_and_Personal_Care.jsonl.gz",
    type: "beauty",
    categoryKey: "beauty",
    categoryLabel: "Beauty & Personal Care",
    icon: "✨",
    quota: 180,
    minPrice: 5,
    maxPrice: 300,
  },
  {
    file: "meta_Sports_and_Outdoors.jsonl.gz",
    type: "sports",
    categoryKey: "sports",
    categoryLabel: "Sports & Outdoors",
    icon: "🏋️",
    quota: 180,
    minPrice: 10,
    maxPrice: 1200,
  },
  {
    file: "meta_Toys_and_Games.jsonl.gz",
    type: "toys",
    categoryKey: "toys",
    categoryLabel: "Toys & Games",
    icon: "🧸",
    quota: 160,
    minPrice: 5,
    maxPrice: 500,
  },
  {
    file: "meta_Video_Games.jsonl.gz",
    type: "gaming",
    categoryKey: "gaming",
    categoryLabel: "Gaming",
    icon: "🎮",
    quota: 140,
    minPrice: 10,
    maxPrice: 900,
  },
  {
    file: "meta_Office_Products.jsonl.gz",
    type: "office",
    categoryKey: "office",
    categoryLabel: "Office Products",
    icon: "🗂️",
    quota: 140,
    minPrice: 4,
    maxPrice: 500,
  },
  {
    file: "meta_Tools_and_Home_Improvement.jsonl.gz",
    type: "tools",
    categoryKey: "tools",
    categoryLabel: "Tools & Home Improvement",
    icon: "🛠️",
    quota: 140,
    minPrice: 8,
    maxPrice: 1200,
  },
  {
    file: "meta_Appliances.jsonl.gz",
    type: "appliances",
    categoryKey: "appliances",
    categoryLabel: "Appliances",
    icon: "🔌",
    quota: 120,
    minPrice: 20,
    maxPrice: 2200,
  },
  {
    file: "meta_Pet_Supplies.jsonl.gz",
    type: "pets",
    categoryKey: "pets",
    categoryLabel: "Pet Supplies",
    icon: "🐾",
    quota: 120,
    minPrice: 5,
    maxPrice: 500,
  },
  {
    file: "meta_Automotive.jsonl.gz",
    type: "automotive",
    categoryKey: "automotive",
    categoryLabel: "Automotive",
    icon: "🚗",
    quota: 100,
    minPrice: 8,
    maxPrice: 1500,
  },
  {
    file: "meta_Baby_Products.jsonl.gz",
    type: "baby",
    categoryKey: "baby",
    categoryLabel: "Baby Products",
    icon: "🍼",
    quota: 100,
    minPrice: 5,
    maxPrice: 600,
  },
];

const LEGACY_DEMO_KEYS = [
  "macbookPro",
  "smartWatch",
  "smartphonePro",
  "mirrorlessCamera",
  "wirelessHeadphones",
  "tabletPro",
  "bluetoothSpeaker",
  "basicTshirt",
  "runningShoes",
  "classicSunglasses",
  "urbanBackpack",
  "premiumHoodie",
  "leatherJacket",
  "deskLamp",
  "officeChair",
  "modernSofa",
  "coffeeMaker",
  "indoorPlant",
  "woodenTable",
  "gamingHeadset",
  "mechanicalKeyboard",
  "wirelessController",
  "gamingMouse",
  "gamingMonitor",
  "streamingMicrophone",
];

function cleanText(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function hashString(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function deterministicPrice(fingerprint, source) {
  const spread = Math.max(1, source.maxPrice - source.minPrice);
  return Number(`${source.minPrice + (fingerprint % spread)}.99`);
}

function normalizeStringList(value, limit = 8) {
  if (!Array.isArray(value)) return [];

  return value
    .map(cleanText)
    .filter((item) => item.length >= 3)
    .filter((item, index, array) => array.indexOf(item) === index)
    .slice(0, limit);
}

function extractImages(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((image) => cleanText(image?.hi_res || image?.large))
    .filter((url) => /^https:\/\/m\.media-amazon\.com\//i.test(url))
    .filter((url, index, array) => array.indexOf(url) === index)
    .slice(0, 6);
}

function normalizeDetails(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value)
      .map(([key, detailValue]) => [cleanText(key), cleanText(detailValue)])
      .filter(([key, detailValue]) => key && detailValue)
      .slice(0, 12)
  );
}

function normalizeAmazonProduct(record, source, position) {
  const asin = cleanText(record.parent_asin);
  const title = cleanText(record.title);
  const images = extractImages(record.images);
  const features = normalizeStringList(record.features, 8);
  const descriptionParts = normalizeStringList(record.description, 12);
  const details = normalizeDetails(record.details);

  if (!asin || title.length < 8 || images.length < 2) return null;

  const description = cleanText(
    descriptionParts.join(" ") || features.slice(0, 4).join(" ")
  ).slice(0, 1800);

  if (description.length < 35 && features.length < 2) return null;

  const fingerprint = hashString(`${source.type}:${asin}`);
  const datasetPrice = Number(record.price);
  const price =
    Number.isFinite(datasetPrice) && datasetPrice > 0 && datasetPrice < 100000
      ? Number(datasetPrice.toFixed(2))
      : deterministicPrice(fingerprint, source);
  const hasDiscount = fingerprint % 4 === 0;
  const discountPercent = 10 + (fingerprint % 21);
  const oldPrice = hasDiscount
    ? Number((price / (1 - discountPercent / 100)).toFixed(2))
    : null;
  const rawRating = Number(record.average_rating);
  const rating = Number.isFinite(rawRating)
    ? Number(Math.min(5, Math.max(1, rawRating)).toFixed(1))
    : Number((3.8 + (fingerprint % 12) / 10).toFixed(1));
  const rawReviewCount = Number(record.rating_number);
  const reviewCount = Number.isFinite(rawReviewCount)
    ? Math.max(0, Math.round(rawReviewCount))
    : 20 + (fingerprint % 5000);
  const brand = cleanText(
    record.store || details.Brand || details.Manufacturer || source.categoryLabel
  );

  return {
    key: `amazon-${asin.toLowerCase()}`,
    title,
    description,
    brand,
    quantity: "",
    categoryKey: source.categoryKey,
    categoryLabel: source.categoryLabel,
    price,
    oldPrice,
    badge: hasDiscount ? "sale" : fingerprint % 3 === 0 ? "new" : "stock",
    image: source.icon,
    imageUrl: images[0],
    images,
    features,
    details,
    stock: 10 + (fingerprint % 240),
    rating,
    reviewCount,
    popularity: reviewCount * 10 + Math.round(rating * 100) - position,
    source: "amazon-reviews-2023",
    sourceType: source.type,
    sourceCode: asin,
    sourceUrl: `https://www.amazon.com/dp/${encodeURIComponent(asin)}`,
    isActive: true,
  };
}

async function collectCategory({ source, quota, seenKeys, userAgent, position }) {
  const controller = new AbortController();
  const url = `${DATASET_BASE_URL}/${source.file}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/gzip",
      "User-Agent": userAgent,
    },
    redirect: "follow",
    signal: controller.signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`Amazon metadata request failed (${response.status}) for ${source.file}.`);
  }

  const compressedStream = Readable.fromWeb(response.body);
  const gunzip = createGunzip();
  const lineReader = createInterface({
    input: compressedStream.pipe(gunzip),
    crlfDelay: Infinity,
  });
  const products = [];

  try {
    for await (const line of lineReader) {
      if (!line.trim()) continue;

      let record;
      try {
        record = JSON.parse(line);
      } catch {
        continue;
      }

      const product = normalizeAmazonProduct(
        record,
        source,
        position + products.length
      );

      if (!product || seenKeys.has(product.key)) continue;

      seenKeys.add(product.key);
      products.push(product);

      if (products.length % 50 === 0 || products.length === quota) {
        console.log(`[${source.type}] ${products.length}/${quota} quality products`);
      }

      if (products.length >= quota) break;
    }
  } finally {
    lineReader.close();
    controller.abort();
    compressedStream.destroy();
    gunzip.destroy();
  }

  return products;
}

async function writeProducts(products) {
  const totals = { matchedCount: 0, modifiedCount: 0, upsertedCount: 0 };

  for (let index = 0; index < products.length; index += 500) {
    const result = await Product.bulkWrite(
      products.slice(index, index + 500).map((product) => ({
        updateOne: {
          filter: { key: product.key },
          update: { $set: product },
          upsert: true,
        },
      })),
      { ordered: false }
    );

    totals.matchedCount += result.matchedCount || 0;
    totals.modifiedCount += result.modifiedCount || 0;
    totals.upsertedCount += result.upsertedCount || 0;
  }

  return totals;
}

export async function importAmazonCatalog(options = {}) {
  const target = toPositiveInteger(
    options.target ?? process.env.AMAZON_CATALOG_TARGET,
    DEFAULT_TARGET
  );
  const userAgent = cleanText(
    options.userAgent ??
      process.env.AMAZON_CATALOG_USER_AGENT ??
      "Kemalreis/0.1 (https://github.com/Miles70/kemalreis)"
  );
  const products = [];
  const seenKeys = new Set();
  const sourceCounts = {};

  for (const source of SOURCES) {
    if (products.length >= target) break;

    const quota = Math.min(source.quota, target - products.length);

    try {
      const collected = await collectCategory({
        source,
        quota,
        seenKeys,
        userAgent,
        position: products.length,
      });
      products.push(...collected);
      sourceCounts[source.type] = collected.length;
    } catch (error) {
      sourceCounts[source.type] = 0;
      console.warn(`[${source.type}] source skipped: ${error.message}`);
    }
  }

  if (products.length < target) {
    throw new Error(
      `Amazon metadata returned only ${products.length} quality products. Existing catalog was not deleted.`
    );
  }

  const finalProducts = products.slice(0, target);
  const result = await writeProducts(finalProducts);
  const activeKeys = finalProducts.map((product) => product.key);

  const [openFactsDelete, demoDelete, staleAmazonDelete] = await Promise.all([
    Product.deleteMany({ source: "openfacts" }),
    Product.deleteMany({ key: { $in: LEGACY_DEMO_KEYS } }),
    Product.deleteMany({
      source: "amazon-reviews-2023",
      key: { $nin: activeKeys },
    }),
  ]);

  return {
    target,
    importedCount: finalProducts.length,
    ...result,
    deletedOpenFactsCount: openFactsDelete.deletedCount || 0,
    deletedDemoCount: demoDelete.deletedCount || 0,
    deletedStaleAmazonCount: staleAmazonDelete.deletedCount || 0,
    sourceCounts,
  };
}
