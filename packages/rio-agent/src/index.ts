import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import { rioAgent } from "./agents/rio-agent.js";

const server = Fastify({ logger: true });
const PORT = Number(process.env.PORT) || 3001;

/**
 * AC1: Health check endpoint.
 * Returns 200 { status: "ok" } — used by Railway to verify the service is alive.
 */
server.get("/health", async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(200).send({ status: "ok" });
});

/**
 * AC2: Mock SSE streaming endpoint.
 *
 * Returns a text/event-stream response that emits 5 mock token events,
 * then closes with data: [DONE]. This validates the SSE pipeline before
 * real LLM integration in Sprint 8.
 */
server.post("/api/chat", async (_request: FastifyRequest, reply: FastifyReply) => {
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

    reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
    });

    for (const token of mockTokens) {
        const event = `data: ${JSON.stringify({ token })}\n\n`;
        reply.raw.write(event);
        await sleep(150);
    }

    reply.raw.write("data: [DONE]\n\n");
    reply.raw.end();
});

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const start = async (): Promise<void> => {
    try {
        // Ensure RioAgent is referenced so it initializes and logs on startup (AC3)
        void rioAgent;

        await server.listen({ port: PORT, host: "0.0.0.0" });
        server.log.info(`Río agent service listening on port ${PORT}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

void start();
