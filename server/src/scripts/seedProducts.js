import "dotenv/config";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { syncProductsFromCatalog } from "../services/productSync.js";

try {
  await connectDatabase();
  const result = await syncProductsFromCatalog();
  console.log(
    `Seed complete: ${result.modifiedCount || 0} updated, ${result.upsertedCount || 0} created.`
  );
} catch (error) {
  console.error("Seed failed:", error);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
