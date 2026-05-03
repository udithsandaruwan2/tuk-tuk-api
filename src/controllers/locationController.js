import {
  createPing,
  deletePing,
  getLiveLocations,
  getPingById,
  getVehicleHistory,
  listPings,
  updatePing
} from "../services/locationService.js";

const createPingController = async (req, res) => {
  const ping = await createPing(req.validated?.body || req.body, req.user);
  res.status(201).json({ success: true, message: "Ping received", data: ping });
};

const liveLocationController = async (req, res) => {
  const result = await getLiveLocations(req.validated?.query || req.query, req.user);
  res.status(200).json({ success: true, message: "Live locations fetched", data: result });
};

const vehicleHistoryController = async (req, res) => {
  const query = req.validated?.query || req.query;
  const params = req.validated?.params || req.params;
  const result = await getVehicleHistory(
    { ...query, vehicleId: params.vehicleId },
    req.user
  );
  res.status(200).json({ success: true, message: "History fetched", data: result });
};

const listPingsController = async (req, res) => {
  const result = await listPings(req.validated?.query || req.query, req.user);
  res.status(200).json({ success: true, message: "Pings fetched", data: result });
};

const getPingController = async (req, res) => {
  const { id } = req.validated?.params || req.params;
  const data = await getPingById(id, req.user);
  res.status(200).json({ success: true, message: "Ping fetched", data });
};

const patchPingController = async (req, res) => {
  const { id } = req.validated?.params || req.params;
  const data = await updatePing(id, req.validated?.body || req.body, req.user);
  res.status(200).json({ success: true, message: "Ping updated", data });
};

const deletePingController = async (req, res) => {
  const { id } = req.validated?.params || req.params;
  await deletePing(id, req.user);
  res.status(200).json({ success: true, message: "Ping deleted", data: null });
};

export {
  createPingController,
  liveLocationController,
  vehicleHistoryController,
  listPingsController,
  getPingController,
  patchPingController,
  deletePingController
};
