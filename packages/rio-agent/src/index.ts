import { Mastra } from "@mastra/core";
import { registerApiRoute } from "@mastra/core/server";
import { rioAgent } from "./agents/rio-agent.js";

/**
 * RioAgent Service — native Mastra implementation.
 *
 * This file replaces the previous Fastify implementation.
 * The Mastra CLI ('mastra start' / 'mastra dev') looks for an exported 'mastra' instance.
 */
export const mastra = new Mastra({
    agents: {
        "rio-agent": rioAgent,
    },
    server: {
        port: Number(process.env.PORT) || 3001,
        host: "0.0.0.0",
        studioBase: "/", // Mount the Playground/Studio UI at the root
        build: {
            swaggerUI: true, // Enable interactive OpenAPI docs at /swagger-ui
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
                    return c.json({ status: "ok" });
                },
            }),
        ],
    },
});

console.log("RioAgent initialized via native Mastra server");
