export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

export type AssistantMessageRole =
  | "system"
  | "developer"
  | "user"
  | "assistant"
  | "tool";

export type AssistantContentPart =
  | { readonly type: "text"; readonly text: string }
  | {
      readonly type: "image";
      readonly url: string;
      readonly mediaType?: string;
    }
  | {
      readonly type: "file";
      readonly url: string;
      readonly mediaType?: string;
      readonly name?: string;
    }
  | {
      readonly type: "tool-call";
      readonly toolCallId: string;
      readonly toolName: string;
      readonly args: JsonValue;
    }
  | {
      readonly type: "tool-result";
      readonly toolCallId: string;
      readonly result: JsonValue;
      readonly isError?: boolean;
    };

export interface AssistantMessage {
  readonly id: string;
  readonly role: AssistantMessageRole;
  readonly content: readonly AssistantContentPart[];
  readonly metadata?: Readonly<Record<string, JsonValue>>;
}

export interface AssistantToolDefinition {
  readonly name: string;
  readonly description?: string;
  readonly inputSchema: JsonValue;
}

export interface AssistantRunRequest {
  readonly protocolVersion: "1";
  readonly threadId: string;
  readonly runId: string;
  readonly messages: readonly AssistantMessage[];
  readonly tools?: readonly AssistantToolDefinition[];
  readonly state?: JsonValue;
  readonly metadata?: Readonly<Record<string, JsonValue>>;
}

interface AssistantEventBase {
  readonly protocolVersion: "1";
  readonly threadId: string;
  readonly runId: string;
  readonly timestamp?: string;
}

export type AssistantEvent =
  | (AssistantEventBase & { readonly type: "run.started" })
  | (AssistantEventBase & {
      readonly type: "message.started";
      readonly messageId: string;
      readonly role: "assistant";
    })
  | (AssistantEventBase & {
      readonly type: "message.text.delta";
      readonly messageId: string;
      readonly delta: string;
    })
  | (AssistantEventBase & {
      readonly type: "message.completed";
      readonly message: AssistantMessage;
    })
  | (AssistantEventBase & {
      readonly type: "tool.call";
      readonly toolCallId: string;
      readonly toolName: string;
      readonly args: JsonValue;
    })
  | (AssistantEventBase & {
      readonly type: "tool.result";
      readonly toolCallId: string;
      readonly result: JsonValue;
      readonly isError?: boolean;
    })
  | (AssistantEventBase & {
      readonly type: "state.snapshot";
      readonly state: JsonValue;
    })
  | (AssistantEventBase & {
      readonly type: "run.failed";
      readonly code: string;
      readonly message: string;
      readonly retryable?: boolean;
    })
  | (AssistantEventBase & {
      readonly type: "run.finished";
      readonly finishReason?: string;
    });

const eventTypes = new Set<AssistantEvent["type"]>([
  "run.started",
  "message.started",
  "message.text.delta",
  "message.completed",
  "tool.call",
  "tool.result",
  "state.snapshot",
  "run.failed",
  "run.finished",
]);

export function isAssistantEvent(value: unknown): value is AssistantEvent {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    candidate.protocolVersion === "1" &&
    typeof candidate.threadId === "string" &&
    typeof candidate.runId === "string" &&
    typeof candidate.type === "string" &&
    eventTypes.has(candidate.type as AssistantEvent["type"])
  );
}
