import mongoose from "mongoose";

const instructorSignatureSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    url: { type: String, required: true },
    publicId: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("InstructorSignature", instructorSignatureSchema);
