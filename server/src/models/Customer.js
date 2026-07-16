import mongoose from "mongoose";

const customerProfileSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    phone: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const customerAddressSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    label: { type: String, trim: true, default: "Address" },
    fullName: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false },
);

const favoriteProductSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    price: { type: Number, min: 0, default: 0 },
    oldPrice: { type: Number, min: 0, default: null },
    imageUrl: { type: String, trim: true, default: "" },
    categoryKey: { type: String, trim: true, default: "" },
    category: { type: String, trim: true, default: "" },
    badge: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const customerSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ["firebase", "wallet", "guest"],
      required: true,
      index: true,
    },
    providerId: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      index: true,
    },
    emailVerified: { type: Boolean, default: false },
    displayName: { type: String, trim: true, default: "" },
    photoUrl: { type: String, trim: true, default: "" },
    profile: {
      type: customerProfileSchema,
      default: () => ({}),
    },
    addresses: {
      type: [customerAddressSchema],
      default: () => [],
    },
    favorites: {
      type: [favoriteProductSchema],
      default: () => [],
    },
    lastLoginAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

customerSchema.index(
  { provider: 1, providerId: 1 },
  { unique: true },
);

export const Customer = mongoose.model("Customer", customerSchema);
