import { requireUser } from "@/lib/server/guards";
import * as XLSX from "xlsx";

const HEADERS = ["name", "email", "phone", "company", "projectType", "budget", "message", "status", "priority", "tags"];
const EXAMPLE = [
  "Asha Verma",
  "asha@example.com",
  "+91 98000 00000",
  "Example Pvt Ltd",
  "Web & Product Development",
  "Not sure yet",
  "Example row — delete before importing.",
  "NEW",
  "MEDIUM",
  "example|template",
];

export async function GET(req: Request) {
  const { res } = await requireUser("leads.import");
  if (res) return res;
  const format = new URL(req.url).searchParams.get("format") === "xlsx" ? "xlsx" : "csv";
  if (format === "xlsx") {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([HEADERS]), "Leads");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([HEADERS, EXAMPLE]), "Example");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new Response(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="AYNAM_LEADS_IMPORT_TEMPLATE.xlsx"',
      },
    });
  }
  return new Response([HEADERS.join(",")].join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="AYNAM_LEADS_IMPORT_TEMPLATE.csv"' },
  });
}
