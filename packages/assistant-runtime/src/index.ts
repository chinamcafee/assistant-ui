import {
  isAssistantEvent,
  type AssistantEvent,
  type AssistantRunRequest,
} from "@wenchuantech/assistant-protocol";

export interface AssistantTransportOptions {
  readonly signal: AbortSignal;
}

export interface AssistantTransport {
  run(
    request: AssistantRunRequest,
    options: AssistantTransportOptions,
  ): AsyncIterable<AssistantEvent>;
}

export interface AssistantRuntimeSnapshot {
  readonly status: "idle" | "running" | "completed" | "failed" | "cancelled";
  readonly request?: AssistantRunRequest;
  readonly events: readonly AssistantEvent[];
  readonly error?: Error;
}

export type AssistantRuntimeListener = (
  snapshot: AssistantRuntimeSnapshot,
) => void;

export class WenchuanAssistantRuntime {
  readonly #transport: AssistantTransport;
  readonly #listeners = new Set<AssistantRuntimeListener>();
  #controller: AbortController | undefined;
  #snapshot: AssistantRuntimeSnapshot = { status: "idle", events: [] };

  constructor(transport: AssistantTransport) {
    this.#transport = transport;
  }

  get snapshot(): AssistantRuntimeSnapshot {
    return this.#snapshot;
  }

  subscribe(listener: AssistantRuntimeListener): () => void {
    this.#listeners.add(listener);
    listener(this.#snapshot);
    return () => this.#listeners.delete(listener);
  }

  cancel(): void {
    if (!this.#controller) return;
    this.#controller.abort();
    this.#controller = undefined;
    this.#setSnapshot({ ...this.#snapshot, status: "cancelled" });
  }

  async run(request: AssistantRunRequest): Promise<AssistantRuntimeSnapshot> {
    this.cancel();
    const controller = new AbortController();
    this.#controller = controller;
    this.#setSnapshot({ status: "running", request, events: [] });
    try {
      for await (const event of this.#transport.run(request, {
        signal: controller.signal,
      })) {
        if (controller.signal.aborted) break;
        this.#setSnapshot({
          ...this.#snapshot,
          events: [...this.#snapshot.events, event],
          status:
            event.type === "run.failed" ? "failed" : this.#snapshot.status,
        });
      }
      if (controller.signal.aborted) return this.#snapshot;
      const status =
        this.#snapshot.status === "failed" ? "failed" : "completed";
      this.#setSnapshot({ ...this.#snapshot, status });
      return this.#snapshot;
    } catch (error) {
      if (controller.signal.aborted) return this.#snapshot;
      const runtimeError =
        error instanceof Error ? error : new Error(String(error));
      this.#setSnapshot({
        ...this.#snapshot,
        status: "failed",
        error: runtimeError,
      });
      throw runtimeError;
    } finally {
      if (this.#controller === controller) this.#controller = undefined;
    }
  }

  #setSnapshot(snapshot: AssistantRuntimeSnapshot): void {
    this.#snapshot = snapshot;
    for (const listener of this.#listeners) listener(snapshot);
  }
}

export interface FetchAssistantTransportOptions {
  readonly url: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly fetch?: typeof globalThis.fetch;
}

async function* parseEventResponse(
  response: Response,
): AsyncGenerator<AssistantEvent> {
  if (!response.body) throw new Error("Assistant response body is empty");
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let pending = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      pending += value;
      const lines = pending.split(/\r?\n/);
      pending = lines.pop() ?? "";
      for (const line of lines) {
        const payload = line.startsWith("data:")
          ? line.slice(5).trim()
          : line.trim();
        if (!payload || payload === "[DONE]") continue;
        const event: unknown = JSON.parse(payload);
        if (!isAssistantEvent(event))
          throw new Error("Invalid assistant protocol event");
        yield event;
      }
    }
    if (pending.trim()) {
      const event: unknown = JSON.parse(pending.trim());
      if (!isAssistantEvent(event))
        throw new Error("Invalid assistant protocol event");
      yield event;
    }
  } finally {
    reader.releaseLock();
  }
}

export function createFetchAssistantTransport(
  options: FetchAssistantTransportOptions,
): AssistantTransport {
  const fetchImplementation = options.fetch ?? globalThis.fetch;
  if (!fetchImplementation)
    throw new Error("A fetch implementation is required");
  return {
    async *run(request, { signal }) {
      const response = await fetchImplementation(options.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "text/event-stream, application/x-ndjson, application/json",
          ...options.headers,
        },
        body: JSON.stringify(request),
        signal,
      });
      if (!response.ok) {
        throw new Error(
          `Assistant request failed with HTTP ${response.status}`,
        );
      }
      yield* parseEventResponse(response);
    },
  };
}
