import "dotenv/config";
import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { syncProductsFromCatalog } from "./services/productSync.js";
import { normalizeExcessivelyLongProductTitles } from "./services/productTitleCleanup.js";

const port = Number(process.env.PORT) || 5000;
const app = createApp();
let server;

async function startServer() {
  await connectDatabase();

  const cleanupResult = await syncProductsFromCatalog();
  if (cleanupResult.deletedCount > 0) {
    console.log(`Legacy demo products removed: ${cleanupResult.deletedCount}.`);
  }

  const titleCleanupResult = await normalizeExcessivelyLongProductTitles();
  if (titleCleanupResult.modifiedCount > 0) {
    console.log(`Long product titles normalized: ${titleCleanupResult.modifiedCount}.`);
  }

  server = app.listen(port, () => {
    console.log(`Kemalreis API running on http://localhost:${port}`);
  });
}

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down...`);

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  await disconnectDatabase();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer().catch((error) => {
  console.error("Server could not start:", error);
  process.exit(1);
});
