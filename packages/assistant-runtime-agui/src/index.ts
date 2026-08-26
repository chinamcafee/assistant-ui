import type {
  AssistantEvent,
  AssistantRunRequest,
  JsonValue,
} from "@wenchuantech/assistant-protocol";
import type { AssistantTransport } from "@wenchuantech/assistant-runtime";

export interface AgUiEventLike {
  readonly type: string;
  readonly messageId?: string;
  readonly toolCallId?: string;
  readonly toolCallName?: string;
  readonly delta?: string;
  readonly content?: string;
  readonly result?: JsonValue;
  readonly snapshot?: JsonValue;
  readonly message?: string;
  readonly code?: string;
}

export type AgUiRun = (
  request: AssistantRunRequest,
  options: { readonly signal: AbortSignal },
) => AsyncIterable<AgUiEventLike>;

function base(request: AssistantRunRequest) {
  return {
    protocolVersion: "1" as const,
    threadId: request.threadId,
    runId: request.runId,
  };
}

export function fromAgUiEvent(
  request: AssistantRunRequest,
  event: AgUiEventLike,
): AssistantEvent | undefined {
  switch (event.type) {
    case "RUN_STARTED":
      return { ...base(request), type: "run.started" };
    case "TEXT_MESSAGE_START":
      return {
        ...base(request),
        type: "message.started",
        messageId: event.messageId ?? request.runId,
        role: "assistant",
      };
    case "TEXT_MESSAGE_CONTENT":
      return {
        ...base(request),
        type: "message.text.delta",
        messageId: event.messageId ?? request.runId,
        delta: event.delta ?? event.content ?? "",
      };
    case "TOOL_CALL_START":
      return {
        ...base(request),
        type: "tool.call",
        toolCallId: event.toolCallId ?? request.runId,
        toolName: event.toolCallName ?? "unknown",
        args: null,
      };
    case "TOOL_CALL_RESULT":
      return {
        ...base(request),
        type: "tool.result",
        toolCallId: event.toolCallId ?? request.runId,
        result: event.result ?? null,
      };
    case "STATE_SNAPSHOT":
      return {
        ...base(request),
        type: "state.snapshot",
        state: event.snapshot ?? null,
      };
    case "RUN_ERROR":
      return {
        ...base(request),
        type: "run.failed",
        code: event.code ?? "AG_UI_ERROR",
        message: event.message ?? "AG-UI run failed",
      };
    case "RUN_FINISHED":
      return { ...base(request), type: "run.finished" };
    default:
      return undefined;
  }
}

export function createAgUiAssistantTransport(
  runAgUi: AgUiRun,
): AssistantTransport {
  return {
    async *run(request, options) {
      for await (const event of runAgUi(request, options)) {
        const converted = fromAgUiEvent(request, event);
        if (converted) yield converted;
      }
    },
  };
}
