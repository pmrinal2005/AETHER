import { classifyModeration } from "@/lib/core";

export const dynamic = "force-dynamic";

// Public demo endpoint standing in for the Modal-hosted fine-tuned MiniCPM5-1B
// moderation-inference endpoint (LoRA/PEFT adapters over synthetic Claude-generated
// abuse dataset in the full spec). Here: dummy keyword classifier for demo purposes.
export async function POST(req: Request) {
  const body = await req.json();
  const text = String(body.text ?? "");
  const result = classifyModeration(text);
  return Response.json(result);
}
