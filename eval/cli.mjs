import { createServer } from "vite";
import path from "node:path";

const server = await createServer({ resolve: { alias: { "@": path.resolve(process.cwd(), "src") } }, server: { middlewareMode: true, hmr: false }, appType: "custom" });
try {
  const { main } = await server.ssrLoadModule("/eval/runner.ts");
  await main(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await server.close();
}
