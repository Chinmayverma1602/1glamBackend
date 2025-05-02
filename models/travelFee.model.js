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
      type: mongoose.Schema.Types.Mixed,
      required: true,
      validate: {
        validator: function (value) {
          if (typeof value === "number") return value >= 0;
          return ["free", "starts_from", "fixed"].includes(value);
        },
        message:
          "Fee must be a non-negative number or one of: free, starts_from, fixed",
      },
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
