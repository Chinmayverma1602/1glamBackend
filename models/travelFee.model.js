import mongoose from "mongoose";

const travelFeeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fee_type: {
      type: String,
      enum: ["per_km", "per_mile"],
      required: true,
    },
    fee: {
      type: String,
      required: true,
      enum: ["free", "starts_from", "fixed"],

    },
    max_distance: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const TravelFee = mongoose.model("TravelFee", travelFeeSchema);
export default TravelFee;