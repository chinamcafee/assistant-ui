import { describe, expect, it } from "vitest";
import type { AssistantRunRequest } from "@wenchuantech/assistant-protocol";
import { WenchuanAssistantRuntime, type AssistantTransport } from ".";

const request: AssistantRunRequest = {
  protocolVersion: "1",
  threadId: "thread-1",
  runId: "run-1",
  messages: [],
};

describe("WenchuanAssistantRuntime", () => {
  it("publishes events and completes a run", async () => {
    const transport: AssistantTransport = {
      async *run() {
        yield { ...request, type: "run.started" };
        yield { ...request, type: "run.finished" };
      },
    };
    const runtime = new WenchuanAssistantRuntime(transport);
    const snapshots: string[] = [];
    runtime.subscribe((snapshot) => snapshots.push(snapshot.status));
    const result = await runtime.run(request);
    expect(result.status).toBe("completed");
    expect(result.events).toHaveLength(2);
    expect(snapshots).toContain("running");
  });
});
