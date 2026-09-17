export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureBootstrap } = await import("./lib/server/db");
    const { startScheduler } = await import("./lib/server/services/scheduler");
    ensureBootstrap().catch((e) => console.error("[boot] bootstrap failed:", (e as Error).message));
    startScheduler();
  }
}
