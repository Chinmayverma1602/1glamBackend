import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // User: {
    //   type: String,
    //   required: true,
    // },
    address_line_1: {
      type: String,
      required: true,
    },
    address_line_2: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      required: true,
    },
    zip_code: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    is_shared_location: {
      type: Boolean,
      default: false,
    },
    booth_no: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Address = mongoose.model("Address", addressSchema);
export default Address;
