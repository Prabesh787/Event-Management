import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);
