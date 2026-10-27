// GET -> { mock: boolean }. Tells the UI whether to show the offline demo
// banner. The API key itself is never included in any response.
import { connection } from "next/server";
import { isMockMode } from "@/lib/meta/mode";

export async function GET() {
  // Read env at request time, not at build time (cacheComponents is on).
  await connection();
  return Response.json({ mock: isMockMode() });
}
