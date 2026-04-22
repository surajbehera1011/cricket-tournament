import { EventEmitter } from "events";

type SSEEvent = {
  type: "team-updated" | "player-assigned" | "player-removed" | "registration-created" | "heartbeat";
  data: Record<string, unknown>;
};

class SSEManager extends EventEmitter {
  private static instance: SSEManager;

  private constructor() {
    super();
    this.setMaxListeners(200);
  }

  static getInstance(): SSEManager {
    if (!SSEManager.instance) {
      SSEManager.instance = new SSEManager();
    }
    return SSEManager.instance;
  }

  broadcast(event: SSEEvent) {
    this.emit("message", event);
  }
}

const globalForSSE = globalThis as unknown as { sseManager: SSEManager };
export const sseManager = globalForSSE.sseManager ?? SSEManager.getInstance();
if (process.env.NODE_ENV !== "production") globalForSSE.sseManager = sseManager;
