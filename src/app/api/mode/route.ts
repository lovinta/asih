// GET -> { mock: boolean }. Tells the UI whether to show the offline demo
// banner. The API key itself is never included in any response.
import { isMockMode } from "@/lib/meta/mode";

export async function GET() {
  return Response.json({ mock: isMockMode() });
}
