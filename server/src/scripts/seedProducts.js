import "dotenv/config";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { syncProductsFromCatalog } from "../services/productSync.js";

try {
  await connectDatabase();
  const result = await syncProductsFromCatalog();
  console.log(`Legacy demo cleanup complete: ${result.deletedCount || 0} removed.`);
} catch (error) {
  console.error("Legacy demo cleanup failed:", error);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
