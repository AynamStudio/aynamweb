import Papa from "papaparse";
import * as XLSX from "xlsx";
import { ImportJob } from "@/lib/server/models/ImportJob";
import { ok, requireUser } from "@/lib/server/guards";
import { putImport, suggestMapping } from "@/lib/server/services/importStore";

export async function GET() {
  const { user, res } = await requireUser("leads.import");
  if (res) return res;
  const jobs = await ImportJob.find().sort({ createdAt: -1 }).limit(50).populate("uploadedBy", "name");
  return ok({
    items: jobs.map((j) => ({
      id: String(j._id),
      fileName: j.fileName,
      source: j.source,
      uploadedBy: j.uploadedBy ? (j.uploadedBy as unknown as { name: string }).name : "System",
      totalRows: j.totalRows,
      successfulRows: j.successfulRows,
      failedRows: j.failedRows,
      duplicateRows: j.duplicateRows,
      status: j.status,
      createdAt: j.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const { user, res } = await requireUser("leads.import");
  if (res) return res;
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") {
    return ok({ error: "No file uploaded." }, { status: 400 });
  }
  const f = file as File;
  const name = f.name || "upload";
  const buf = Buffer.from(await f.arrayBuffer());
  const ext = name.split(".").pop()?.toLowerCase() || "";
  let columns: string[] = [];
  let rows: Record<string, string>[] = [];
  try {
    if (ext === "csv") {
      const text = buf.toString("utf8");
      const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
      columns = (parsed.meta.fields || []).filter(Boolean);
      rows = parsed.data.slice(0, 5000);
    } else if (ext === "xlsx" || ext === "xls") {
      const wb = XLSX.read(buf, { type: "buffer" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      rows = json.slice(0, 5000).map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v)])));
      columns = rows.length ? Object.keys(rows[0]) : [];
    } else {
      return ok({ error: "Unsupported file type. Use .csv, .xlsx or .xls." }, { status: 400 });
    }
  } catch {
    return ok({ error: "Could not parse the file." }, { status: 400 });
  }
  if (!rows.length || !columns.length) return ok({ error: "The file appears to be empty." }, { status: 400 });
  const stored = putImport({
    fileName: name,
    source: ext === "csv" ? "CSV_IMPORT" : "EXCEL_IMPORT",
    columns,
    rows,
    uploadedBy: String(user._id),
  });
  return ok({
    jobId: stored.jobId,
    fileName: name,
    source: stored.source,
    columns,
    rowCount: rows.length,
    suggestedMapping: suggestMapping(columns),
    preview: rows.slice(0, 25),
  });
}
