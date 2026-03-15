import { Mastra } from "@mastra/core";
import { PostgresStore } from "@mastra/pg";
import { registerApiRoute } from "@mastra/core/server";
import { streamSSE } from "hono/streaming";
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
        port: (() => {
            const port = Number(process.env.PORT) || 3001;
            if (port < 1 || port > 65535) throw new Error(`Invalid PORT: ${port}`);
            return port;
        })(),
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
                    return streamSSE(c, async (stream) => {
                        let closed = false;
                        c.req.raw.signal.addEventListener("abort", () => {
                            closed = true;
                        });

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
                            if (closed) break;
                            await stream.writeSSE({ data: JSON.stringify({ token }) });
                            await stream.sleep(150);
                        }

                        if (!closed) {
                            await stream.writeSSE({ data: "[DONE]" });
                        }
                    });
                },
            }),
            /**
             * Manual verification route to check environment variables.
             * Returns masked values to confirm they are set correctly on Railway.
             */
            registerApiRoute("/config-check", {
                method: "GET",
                requiresAuth: false,
                handler: async (c) => {
                    if (process.env.NODE_ENV === "production") {
                        return c.json({ error: "Not Found" }, 404);
                    }
                    const mask = (val?: string) => (val ? `${val.slice(0, 4)}...${val.slice(-4)}` : "MISSING");
                    return c.json({
                        RIO_DATABASE_URL: mask(process.env.RIO_DATABASE_URL),
                        OPENROUTER_API_KEY: mask(process.env.OPENROUTER_API_KEY),
                        SUPABASE_URL: mask(process.env.SUPABASE_URL),
                        NODE_ENV: process.env.NODE_ENV || "not set",
                        PORT: process.env.PORT || "not set",
                    });
                },
            }),
        ],
    },
});

console.log("RioAgent initialized via native Mastra server");
