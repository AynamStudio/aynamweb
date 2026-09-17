import { z } from "zod";
import { Setting } from "@/lib/server/models/Setting";
import { ok, parseBody, requireUser } from "@/lib/server/guards";
import { settingsSchema } from "@/lib/server/validators";
import { audit } from "@/lib/server/audit";

const getSettings = async () => (await Setting.findOne({ key: "primary" })) || (await Setting.create({ key: "primary" }));

export async function GET() {
  const { res } = await requireUser("settings.view");
  if (res) return res;
  const s = await getSettings();
  return ok({
    businessName: s.businessName,
    websiteUrl: s.websiteUrl,
    contactEmail: s.contactEmail,
    defaultLeadStatus: s.defaultLeadStatus,
    defaultLeadPriority: s.defaultLeadPriority,
    timezone: s.timezone,
  });
}

export async function PATCH(req: Request) {
  const { user, res } = await requireUser("settings.edit");
  if (res) return res;
  const { data, res: bad } = await parseBody<z.infer<typeof settingsSchema>>(req, settingsSchema);
  if (bad) return bad;
  const s = await getSettings();
  Object.assign(s, data);
  await s.save();
  await audit(user._id, "settings.update", "settings", "primary", { fields: Object.keys(data) });
  return ok({ updated: true });
}
