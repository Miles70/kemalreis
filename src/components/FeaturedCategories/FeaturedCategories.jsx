import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, PawPrint, ShoppingBasket, Sparkles } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { getProductCategories } from "../../services/productsApi";
import "./FeaturedCategories.css";

const descriptions = {
  en: {
    marketplace: "Everyday products from the global open catalog.",
    groceries: "Food, drinks and pantry essentials.",
    beauty: "Cosmetics and personal care essentials.",
    "pet-supplies": "Food and essentials for pets.",
  },
  tr: {
    marketplace: "Global açık katalogdan günlük ürünler.",
    groceries: "Yiyecek, içecek ve market ihtiyaçları.",
    beauty: "Kozmetik ve kişisel bakım ürünleri.",
    "pet-supplies": "Evcil hayvan mama ve ihtiyaçları.",
  },
  ru: {
    marketplace: "Повседневные товары из открытого каталога.",
    groceries: "Еда, напитки и продукты.",
    beauty: "Косметика и личный уход.",
    "pet-supplies": "Корм и товары для питомцев.",
  },
  ar: {
    marketplace: "منتجات يومية من الكتالوج المفتوح.",
    groceries: "أطعمة ومشروبات واحتياجات البقالة.",
    beauty: "مستحضرات التجميل والعناية الشخصية.",
    "pet-supplies": "أغذية واحتياجات الحيوانات الأليفة.",
  },
  zh: {
    marketplace: "来自全球开放目录的日常商品。",
    groceries: "食品、饮料和杂货用品。",
    beauty: "化妆品和个人护理用品。",
    "pet-supplies": "宠物食品和日常用品。",
  },
};

function CategoryIcon({ categoryKey }) {
  if (categoryKey === "groceries") return <ShoppingBasket />;
  if (categoryKey === "beauty") return <Sparkles />;
  if (categoryKey === "pet-supplies") return <PawPrint />;
  return <Package />;
}

function FeaturedCategories() {
  const { t, language } = useLanguage();
  const [categories, setCategories] = useState([]);
  const copy = descriptions[language] || descriptions.en;

  useEffect(() => {
    const controller = new AbortController();

    getProductCategories({ signal: controller.signal })
      .then((payload) => setCategories((payload.categories || []).slice(0, 4)))
      .catch((error) => {
        if (error.name !== "AbortError") console.error(error);
      });

    return () => controller.abort();
  }, []);

  return (
    <section className="featuredCategories">
      <div className="container">
        <p className="sectionTag">{t("featuredCategories.tag")}</p>
        <h2>{t("featuredCategories.title")}</h2>

        <div className="categoryGrid">
          {categories.map((category) => (
            <Link
              className="categoryCard"
              key={category.key}
              to={`/products?category=${category.key}`}
              aria-label={category.title || category.key}
            >
              <div className="categoryIcon">
                <CategoryIcon categoryKey={category.key} />
              </div>

              <h3>{category.title || category.key}</h3>
              <p>{copy[category.key] || copy.marketplace}</p>

              <span className="categoryArrow" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 12H19"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M13 6L19 12L13 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturedCategories;
