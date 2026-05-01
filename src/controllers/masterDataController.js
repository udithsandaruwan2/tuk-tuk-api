import { listDistricts, listProvinces, listStations } from "../services/masterDataService.js";

const provincesController = async (req, res) => {
  const items = await listProvinces(req.validated?.query || req.query);
  res.status(200).json({ success: true, message: "Provinces fetched", data: items });
};

const districtsController = async (req, res) => {
  const items = await listDistricts(req.validated?.query || req.query);
  res.status(200).json({ success: true, message: "Districts fetched", data: items });
};

const stationsController = async (req, res) => {
  const items = await listStations(req.validated?.query || req.query);
  res.status(200).json({ success: true, message: "Stations fetched", data: items });
};

export { provincesController, districtsController, stationsController };
