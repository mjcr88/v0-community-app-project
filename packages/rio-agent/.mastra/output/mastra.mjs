import { Mastra } from '@mastra/core';
import { registerApiRoute } from '@mastra/core/server';
import { Agent } from '@mastra/core/agent';

const rioAgent = new Agent({
  id: "rio-agent",
  name: "RioAgent",
  instructions: "You are R\xEDo, a helpful community assistant for Nido residents. You answer questions about community rules, events, and services.",
  // Sprint 0 stub: OpenAICompatibleConfig pointing at OpenRouter.
  // Full production wiring (OPENROUTER_API_KEY, tenant tools) in Sprint 8.
  model: {
    id: "openai/gpt-4o-mini",
    url: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY ?? "stub-key"
  }
});
console.log("RioAgent initialized");

const mastra = new Mastra({
  agents: {
    "rio-agent": rioAgent
  },
  server: {
    port: Number(process.env.PORT) || 3001,
    host: "0.0.0.0",
    studioBase: "/",
    // Mount the Playground/Studio UI at the root
    build: {
      swaggerUI: true
      // Enable interactive OpenAPI docs at /swagger-ui
    },
    apiRoutes: [
      /**
       * AC1: Health check endpoint for Railway.
       * Note: registerApiRoute prefixes must NOT start with '/api' (reserved).
       */
      registerApiRoute("/health", {
        method: "GET",
        requiresAuth: false,
        handler: async (c) => {
          return c.json({
            status: "ok"
          });
        }
      })
    ]
  }
});
console.log("RioAgent initialized via native Mastra server");

export { mastra as m };
