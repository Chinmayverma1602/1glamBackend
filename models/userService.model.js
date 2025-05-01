import mongoose from "mongoose";

const serviceIncludedSchema = new mongoose.Schema({
  service_name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  duration: {
    type: Number,
    required: true,
    min: 0,
  },
});

const userServiceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    service_name: {
      type: String,
      required: true,
    },
    bundle: {
      type: Boolean,
      default: false,
    },
    services_included: [serviceIncludedSchema],
    duration: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const UserService = mongoose.model("UserService", userServiceSchema);
export default UserService;
