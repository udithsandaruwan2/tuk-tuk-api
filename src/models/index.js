import { mongoose } from "../services/db.js";

const { Schema } = mongoose;

const provinceSchema = new Schema(
  {
    code: { type: String, unique: true, required: true, index: true },
    name: { type: String, required: true },
  },
  { timestamps: true },
);

const districtSchema = new Schema(
  {
    code: { type: String, unique: true, required: true, index: true },
    name: { type: String, required: true },
    provinceId: { type: Schema.Types.ObjectId, ref: "Province", required: true, index: true },
  },
  { timestamps: true },
);

const policeStationSchema = new Schema(
  {
    code: { type: String, unique: true, required: true, index: true },
    name: { type: String, required: true },
    districtId: { type: Schema.Types.ObjectId, ref: "District", required: true, index: true },
  },
  { timestamps: true },
);

const userSchema = new Schema(
  {
    email: { type: String, unique: true, required: true, index: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["HQ_ADMIN", "PROVINCIAL", "STATION"],
      required: true,
      index: true,
    },
    provinceId: { type: Schema.Types.ObjectId, ref: "Province", default: null, index: true },
    stationId: { type: Schema.Types.ObjectId, ref: "PoliceStation", default: null, index: true },
  },
  { timestamps: true },
);

const vehicleSchema = new Schema(
  {
    registrationNumber: { type: String, unique: true, required: true, index: true },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
      default: "ACTIVE",
      index: true,
    },
    districtId: { type: Schema.Types.ObjectId, ref: "District", required: true, index: true },
    stationId: { type: Schema.Types.ObjectId, ref: "PoliceStation", default: null, index: true },
    driverName: { type: String, default: null },
    driverLicense: { type: String, default: null },
  },
  { timestamps: true },
);

vehicleSchema.index({ districtId: 1, status: 1 });

const trackerDeviceSchema = new Schema(
  {
    vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true, index: true },
    apiKeyHash: { type: String, required: true },
    label: { type: String, default: null },
    isActive: { type: Boolean, default: true, index: true },
    lastSeenAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const locationPingSchema = new Schema(
  {
    vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true, index: true },
    recordedAt: { type: Date, required: true, index: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    speedKmh: { type: Number, default: null },
    headingDeg: { type: Number, default: null },
  },
  { timestamps: true },
);

locationPingSchema.index({ vehicleId: 1, recordedAt: -1 });

export const Province = mongoose.models.Province || mongoose.model("Province", provinceSchema);
export const District = mongoose.models.District || mongoose.model("District", districtSchema);
export const PoliceStation =
  mongoose.models.PoliceStation || mongoose.model("PoliceStation", policeStationSchema);
export const User = mongoose.models.User || mongoose.model("User", userSchema);
export const Vehicle = mongoose.models.Vehicle || mongoose.model("Vehicle", vehicleSchema);
export const TrackerDevice =
  mongoose.models.TrackerDevice || mongoose.model("TrackerDevice", trackerDeviceSchema);
export const LocationPing =
  mongoose.models.LocationPing || mongoose.model("LocationPing", locationPingSchema);
