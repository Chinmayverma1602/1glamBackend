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
      enum: ["per_km", "flat_rate", "per_hour"],
      required: true,
    },
    fee: {
      type: Number,
      required: true,
      min: 0,
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