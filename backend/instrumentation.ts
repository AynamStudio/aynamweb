export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureBootstrap } = await import("./lib/server/db");
    const { startScheduler } = await import("./lib/server/services/scheduler");
    // Don't let a slow Atlas first-connect block startup from resolving.
    // ensureBootstrap will fall back to embedded Mongo on dev if Atlas is
    // unreachable; in production it rejects and the health check will
    // report unready until MongoDB is available.
    ensureBootstrap()
      .then(() => {
        startScheduler();
      })
      .catch((e) => {
        console.error("[boot] bootstrap failed:", (e as Error).message);
        // Still start scheduler — it no-ops when DB isn't connected.
        startScheduler();
      });
  }
}
