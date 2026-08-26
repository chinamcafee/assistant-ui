import { describe, expect, it } from "vitest";
import { isAssistantEvent } from ".";

describe("isAssistantEvent", () => {
  it("accepts a versioned run event", () => {
    expect(
      isAssistantEvent({
        protocolVersion: "1",
        threadId: "thread-1",
        runId: "run-1",
        type: "run.started",
      }),
    ).toBe(true);
  });

  it("rejects unknown event types", () => {
    expect(
      isAssistantEvent({
        protocolVersion: "1",
        threadId: "thread-1",
        runId: "run-1",
        type: "upstream.unknown",
      }),
    ).toBe(false);
  });
});
