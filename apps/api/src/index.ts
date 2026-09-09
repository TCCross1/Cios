/**
 * @cios/api entry point.
 *
 * This is the composition root for CIOS's interactive Fastify API runtime
 * (ADR 0003). It intentionally implements nothing beyond an operational
 * health check — no product endpoints, authentication, or persistence
 * wiring exist yet (Directive 002 is architecture/topology only).
 */
import Fastify from 'fastify';

export function buildServer() {
  const app = Fastify({ logger: true });

  app.get('/health', async () => ({ status: 'ok' as const }));

  return app;
}

async function main(): Promise<void> {
  const app = buildServer();
  const port = Number(process.env['PORT'] ?? 3000);
  await app.listen({ port, host: '0.0.0.0' });
}

if (process.env['NODE_ENV'] !== 'test') {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
