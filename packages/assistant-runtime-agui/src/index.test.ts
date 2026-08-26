import { describe, expect, it } from "vitest";
import type { AssistantRunRequest } from "@wenchuantech/assistant-protocol";
import { fromAgUiEvent } from ".";

const request: AssistantRunRequest = {
  protocolVersion: "1",
  threadId: "thread-1",
  runId: "run-1",
  messages: [],
};

describe("fromAgUiEvent", () => {
  it("maps text deltas into the company protocol", () => {
    expect(
      fromAgUiEvent(request, {
        type: "TEXT_MESSAGE_CONTENT",
        messageId: "message-1",
        delta: "hello",
      }),
    ).toEqual({
      protocolVersion: "1",
      threadId: "thread-1",
      runId: "run-1",
      type: "message.text.delta",
      messageId: "message-1",
      delta: "hello",
    });
  });
});
