import { Schema, model, models, type Types } from "mongoose";
import { ROLES, type Permission, type Role } from "../permissions";

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  department?: string;
  passwordHash: string;
  status: "ACTIVE" | "DISABLED" | "INVITED";
  permissions: Permission[];
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true },
    role: { type: String, enum: ROLES, required: true },
    department: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    status: { type: String, enum: ["ACTIVE", "DISABLED", "INVITED"], default: "ACTIVE" },
    permissions: { type: [String], default: [] },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export const User = models.User || model<IUser>("User", UserSchema);
