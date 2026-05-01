import { createVehicle, listVehicles } from "../services/vehicleService.js";

const listVehiclesController = async (req, res) => {
  const result = await listVehicles(req.validated?.query || req.query);
  res.status(200).json({ success: true, message: "Vehicles fetched", data: result });
};

const createVehicleController = async (req, res) => {
  const created = await createVehicle(req.validated?.body || req.body);
  res.status(201).json({ success: true, message: "Vehicle created", data: created });
};

export { listVehiclesController, createVehicleController };
