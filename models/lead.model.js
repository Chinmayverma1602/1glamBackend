import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    client_name: {
      type: String,
      required: true,
    },
    phone_number: {
      type: String,
      required: true,
    },
    lead_status: {
      type: String,
      enum: ["Inquiry Received", "Follow Up", "Confirmed", "Closed"],
      required: true,
    },
    booking_date: {
      type: Date,
      required: true,
    },
    booking_time: {
      type: String,
      required: true,
    },
    service_name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    notes: {
      type: String,
      default: "",
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Lead = mongoose.model("Lead", leadSchema);
export default Lead;
