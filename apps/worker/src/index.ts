/**
 * @cios/worker entry point.
 *
 * This is the composition root for CIOS's background job runtime
 * (Constitution, section J). It intentionally implements no jobs and is
 * not bound to any queue technology yet — Directive 002 is architecture/
 * topology only. This placeholder proves the dev/build/start toolchain
 * works for this runtime.
 */

export function getStartupMessage(): string {
  return 'CIOS worker runtime foundation is running.';
}

function main(): void {
  console.log(getStartupMessage());
}

if (process.env['NODE_ENV'] !== 'test') {
  main();
}
