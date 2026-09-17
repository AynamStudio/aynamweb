import crypto from "crypto";

export type ParsedImport = {
  jobId: string;
  fileName: string;
  source: "CSV_IMPORT" | "EXCEL_IMPORT";
  columns: string[];
  rows: Record<string, string>[];
  uploadedBy: string;
  at: number;
};

const store = new Map<string, ParsedImport>();
const TTL = 30 * 60_000;

export function putImport(p: Omit<ParsedImport, "jobId" | "at">): ParsedImport {
  for (const [k, v] of store) if (Date.now() - v.at > TTL) store.delete(k);
  const jobId = crypto.randomUUID();
  const rec = { ...p, jobId, at: Date.now() };
  store.set(jobId, rec);
  return rec;
}

export function takeImport(jobId: string, userId: string): ParsedImport | null {
  const rec = store.get(jobId);
  if (!rec || rec.uploadedBy !== userId || Date.now() - rec.at > TTL) return null;
  store.delete(jobId);
  return rec;
}

const norm = (h: string): string => h.toLowerCase().replace(/[^a-z0-9]/g, "");

const ALIASES: Record<string, string[]> = {
  name: ["name", "fullname", "full name", "contactname", "leadname"],
  email: ["email", "emailaddress", "email address"],
  phone: ["phone", "phonenumber", "phone number", "mobile", "contact"],
  company: ["company", "companyname", "company name", "organization", "organisation"],
  projectType: ["project", "projecttype", "project type", "service"],
  budget: ["budget", "budgetrange", "budget range"],
  message: ["message", "notes", "details", "description", "requirements"],
  status: ["status", "leadstatus"],
  priority: ["priority"],
  tags: ["tags", "labels"],
};

/** Suggests mappings from header names — never applied silently. */
export function suggestMapping(columns: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const col of columns) {
    const n = norm(col);
    for (const [field, aliases] of Object.entries(ALIASES)) {
      if (map[field]) continue;
      if (aliases.some((a) => norm(a) === n)) map[field] = col;
    }
  }
  return map;
}
