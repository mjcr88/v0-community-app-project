import { Mastra } from "@mastra/core";
import { PostgresStore } from "@mastra/pg";
import { registerApiRoute } from "@mastra/core/server";
import { streamText } from "hono/streaming";
import { rioAgent } from "./agents/rio-agent.js";

/**
 * RioAgent Service — native Mastra implementation.
 *
 * This file replaces the previous Fastify implementation.
 * The Mastra CLI ('mastra start' / 'mastra dev') looks for an exported 'mastra' instance.
 */
function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

const connectionString = requireEnv("RIO_DATABASE_URL");

export const mastra = new Mastra({
    storage: new PostgresStore({
        id: "rio-storage",
        connectionString,
    }),
    agents: {
        "rio-agent": rioAgent,
    },
    server: {
        port: Number(process.env.PORT) || 3001,
        host: "0.0.0.0",
        studioBase: "/", // Mount the Playground/Studio UI at the root
        build: {
            swaggerUI: true, // Enable interactive OpenAPI docs at /swagger-ui
            openAPIDocs: true, // Required for Swagger UI to function
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
            /**
             * AC2: Mock SSE streaming endpoint.
             * Note: registerApiRoute prefixes must NOT start with '/api' (reserved).
             * Exposed as POST /api/chat.
             */
            registerApiRoute("/chat", {
                method: "POST",
                requiresAuth: false,
                handler: async (c) => {
                    return streamText(c, async (stream) => {
                        const mockTokens = [
                            "Hola,",
                            " soy",
                            " Río.",
                            " ¿En",
                            " qué",
                            " puedo",
                            " ayudarte",
                            " hoy?",
                        ];

                        for (const token of mockTokens) {
                            await stream.write(`data: ${JSON.stringify({ token })}\n\n`);
                            await stream.sleep(150);
                        }

                        await stream.write("data: [DONE]\n\n");
                    });
                },
            }),
        ],
    },
});

console.log("RioAgent initialized via native Mastra server");
