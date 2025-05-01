import mongoose from "mongoose";

const customerBookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customer_name: {
      type: String,
      required: true,
    },
    phone_number: {
      type: String,
      required: true,
    },
    lead_status: {
      type: String,
      enum: [
        "Inbound",
        "Qualifying",
        "Proposal Sent",
        "Proposal Reminder",
        "Proposal Accepted",
        "Deposit Requested",
        "Deposit Reminder",
        "Deposit Received",
        "Confirmed",
        "Completed",
        "Closed",
        "Lost",
        "Waitlisted",
      ],
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
  },
  {
    timestamps: true,
  }
);

const CustomerBooking = mongoose.model(
  "CustomerBooking",
  customerBookingSchema
);
export default CustomerBooking;
