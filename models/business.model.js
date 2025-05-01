import mongoose from "mongoose";

const businessSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    business_name: {
      type: String,
      required: true,
    },
    business_type: {
      type: String,
      required: true,
    },
    owner_name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Business = mongoose.model("Business", businessSchema);
export default Business;