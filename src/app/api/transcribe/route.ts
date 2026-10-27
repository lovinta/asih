// POST multipart WAV upload -> transcript. Fields: audio (File), lang.
// Server-only: transcription runs through the server-side client.
import { transcribe } from "@/lib/meta/transcribe";
import type { Lang } from "@/lib/agent/types";

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Expected multipart form data." }, { status: 400 });
  }
  const audio = form.get("audio");
  const langRaw = form.get("lang");
  const lang: Lang = langRaw === "es" ? "es" : "en";
  if (!(audio instanceof File)) {
    return Response.json({ error: 'Missing "audio" file.' }, { status: 400 });
  }
  try {
    const buffer = Buffer.from(await audio.arrayBuffer());
    const { transcript, mock } = await transcribe(buffer, lang);
    return Response.json({ transcript, mock });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transcribe failed.";
    const status = message.includes("spend cap") ? 429 : 500;
    return Response.json({ error: message }, { status });
  }
}
