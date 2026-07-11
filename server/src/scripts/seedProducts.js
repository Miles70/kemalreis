import "dotenv/config";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { importOpenFactsCatalog } from "../services/openFactsImportV2.js";

try {
  await connectDatabase();

  const result = await importOpenFactsCatalog();

  console.log("Open Facts import complete:");
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error("Open Facts import failed:", error);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
