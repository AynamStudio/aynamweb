import { Schema, model, models, type Types } from "mongoose";

export interface INote {
  _id: Types.ObjectId;
  leadId: Types.ObjectId;
  authorId: Types.ObjectId;
  body: string;
  createdAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, maxlength: 5000 },
  },
  { timestamps: true }
);

export const Note = models.Note || model<INote>("Note", NoteSchema);
