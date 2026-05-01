import { createPing, getLiveLocations, getVehicleHistory } from "../services/locationService.js";

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

export { createPingController, liveLocationController, vehicleHistoryController };
