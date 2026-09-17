/** Granular permissions — roles are organisational labels only. */
export const PERMISSIONS = [
  "leads.view",
  "leads.create",
  "leads.edit",
  "leads.delete",
  "leads.assign",
  "leads.import",
  "leads.export",
  "leads.view_all",
  "contacts.view",
  "employees.view",
  "employees.create",
  "employees.edit",
  "employees.disable",
  "emails.send",
  "automations.view",
  "automations.create",
  "automations.edit",
  "automations.delete",
  "templates.view",
  "templates.create",
  "templates.edit",
  "templates.delete",
  "settings.view",
  "settings.edit",
  "activity.view",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLES = ["ADMIN", "SALES", "OPERATIONS", "MANAGER"] as const;
export type Role = (typeof ROLES)[number];

export const ALL_PERMISSIONS: Permission[] = [...PERMISSIONS];

export const ROLE_PRESETS: Record<Role, Permission[]> = {
  ADMIN: ALL_PERMISSIONS,
  SALES: ["leads.view", "leads.create", "leads.edit", "leads.export", "contacts.view", "emails.send", "activity.view"],
  OPERATIONS: ["leads.view", "leads.edit", "leads.import", "contacts.view", "activity.view"],
  MANAGER: [
    "leads.view",
    "leads.view_all",
    "leads.edit",
    "leads.assign",
    "leads.export",
    "contacts.view",
    "employees.view",
    "emails.send",
    "activity.view",
  ],
};

export const hasPerm = (user: { role: Role; permissions?: string[] }, perm: Permission): boolean =>
  user.role === "ADMIN" || (user.permissions || []).includes(perm);
