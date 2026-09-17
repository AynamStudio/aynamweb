import { Schema, model, models, type Types } from "mongoose";

export interface IImportJob {
  _id: Types.ObjectId;
  fileName: string;
  uploadedBy: Types.ObjectId;
  source: "CSV_IMPORT" | "EXCEL_IMPORT";
  mapping?: Record<string, string>;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  duplicateRows: number;
  status: "PROCESSING" | "COMPLETED" | "PARTIAL" | "FAILED";
  errors: { row: number; field: string; message: string }[];
  createdAt: Date;
}

const ImportSchema = new Schema<IImportJob>(
  {
    fileName: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    source: { type: String, enum: ["CSV_IMPORT", "EXCEL_IMPORT"], required: true },
    mapping: { type: Object },
    totalRows: { type: Number, default: 0 },
    successfulRows: { type: Number, default: 0 },
    failedRows: { type: Number, default: 0 },
    duplicateRows: { type: Number, default: 0 },
    status: { type: String, enum: ["PROCESSING", "COMPLETED", "PARTIAL", "FAILED"], default: "PROCESSING" },
    errors: { type: [{ row: Number, field: String, message: String }], default: [] },
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);
ImportSchema.index({ createdAt: -1 });

export const ImportJob = models.ImportJob || model<IImportJob>("ImportJob", ImportSchema);
