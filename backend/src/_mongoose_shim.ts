// Shim mongoose so existing model files (`import { Schema, model, models }`)
// work under native ESM. Mongoose ships CJS; named exports like `models`
// aren't re-exported in ESM. We re-create them here and register as a
// loader side-effect.
import mongoose from "mongoose";
const m: any = mongoose;
if (!m.models) m.models = m.connection?.models ?? {};
// Make sure any Schema/model/types references used in the codebase are set:
(m.Schema ??= (mongoose as any).default?.Schema);
if (!m.model && (mongoose as any).default?.model) m.model = (mongoose as any).default.model;
export default mongoose;
export const { Schema, model, models, connection, Types } = m;
