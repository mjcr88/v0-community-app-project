import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";

const openRouterApiKey = process.env.OPENROUTER_API_KEY;

if (!openRouterApiKey && process.env.NODE_ENV !== "development") {
    throw new Error(
        "OPENROUTER_API_KEY is not set. Please add the OpenRouter API key to your environment variables.",
    );
}

/**
 * RioAgent — Sprint 0 scaffold stub.
 *
 * This is a minimal definition to validate that @mastra/core initializes
 * correctly inside the Railway service. No tools or memory are wired yet;
 * those are added in Sprint 8 (Foundation).
 */
export const rioAgent = new Agent({
    id: "rio-agent",
    name: "RioAgent",
    instructions:
        "You are Río, a helpful community assistant for Nido residents. " +
        "You answer questions about community rules, events, and services. " +
        "Always respond in the language the user is speaking unless the user explicitly asks to speak in another language.",
    // Sprint 0 stub: OpenAICompatibleConfig pointing at OpenRouter.
    // Full production wiring (OPENROUTER_API_KEY, tenant tools) in Sprint 8.
    model: {
        id: "openai/gpt-4o-mini" as `${string}/${string}`,
        url: "https://openrouter.ai/api/v1",
        apiKey: openRouterApiKey ?? "stub-key",
    },
    memory: new Memory(),
});

console.log("RioAgent initialized");
