import {
  createVehicle,
  deleteVehicle,
  getVehicleById,
  listVehicles,
  updateVehicle
} from "../services/vehicleService.js";

const listVehiclesController = async (req, res) => {
  const result = await listVehicles(req.validated?.query || req.query, req.user);
  res.status(200).json({ success: true, message: "Vehicles fetched", data: result });
};

const getVehicleController = async (req, res) => {
  const { id } = req.validated?.params || req.params;
  const data = await getVehicleById(id, req.user);
  res.status(200).json({ success: true, message: "Vehicle fetched", data });
};

const createVehicleController = async (req, res) => {
  const created = await createVehicle(req.validated?.body || req.body);
  res.status(201).json({ success: true, message: "Vehicle created", data: created });
};

const patchVehicleController = async (req, res) => {
  const { id } = req.validated?.params || req.params;
  const data = await updateVehicle(id, req.validated?.body || req.body);
  res.status(200).json({ success: true, message: "Vehicle updated", data });
};

const deleteVehicleController = async (req, res) => {
  const { id } = req.validated?.params || req.params;
  await deleteVehicle(id);
  res.status(200).json({ success: true, message: "Vehicle deleted", data: null });
};

export {
  listVehiclesController,
  getVehicleController,
  createVehicleController,
  patchVehicleController,
  deleteVehicleController
};
