import { Lead } from "../models/Lead";
import { emitAutomation } from "./automation";
import { notify } from "../audit";
import { User } from "../models/User";

const g = globalThis as typeof globalThis & { __aynamScheduler?: NodeJS.Timeout };

/** One lightweight interval: follow-up due sweep. No queues, no workers. */
export function startScheduler(): void {
  if (g.__aynamScheduler || process.env.AYNAM_SCHEDULER === "off") return;
  g.__aynamScheduler = setInterval(() => void sweepFollowUps(), 60_000);
  g.__aynamScheduler.unref?.();
}

export async function sweepFollowUps(): Promise<void> {
  try {
    const now = new Date();
    const due = await Lead.find({
      deletedAt: null,
      nextFollowUpAt: { $lte: now },
      $or: [{ followUpNotifiedAt: null }, { followUpNotifiedAt: { $lt: new Date(now.getTime() - 12 * 3600_000) } }],
    }).limit(100);
    for (const lead of due) {
      lead.followUpNotifiedAt = now;
      await lead.save();
      const target = lead.assignedTo || (await User.findOne({ role: "ADMIN" }))?._id;
      if (target) {
        await notify(target, "followup_due", `Follow-up due: ${lead.name}`, lead.company || lead.email);
      }
      await emitAutomation("lead.followup_due", lead, null);
    }
  } catch (e) {
    console.error("[scheduler] sweep failed:", (e as Error).message);
  }
}
