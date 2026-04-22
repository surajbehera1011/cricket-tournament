import { sseManager } from "@/lib/sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const onMessage = (event: { type: string; data: Record<string, unknown> }) => {
        const payload = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          // stream closed
        }
      };

      sseManager.on("message", onMessage);

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      // Send initial connection event
      const connectPayload = `event: connected\ndata: ${JSON.stringify({ status: "ok" })}\n\n`;
      controller.enqueue(encoder.encode(connectPayload));

      // Cleanup when stream closes
      const cleanup = () => {
        sseManager.off("message", onMessage);
        clearInterval(heartbeat);
      };

      // Handle abort
      if (typeof controller.close === "function") {
        const originalClose = controller.close.bind(controller);
        controller.close = () => {
          cleanup();
          originalClose();
        };
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
