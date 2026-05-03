import {
  createDistrict,
  createProvince,
  createStation,
  deleteDistrict,
  deleteProvince,
  deleteStation,
  getDistrictById,
  getProvinceById,
  getStationById,
  listDistricts,
  listProvinces,
  listStations,
  updateDistrict,
  updateProvince,
  updateStation
} from "../services/masterDataService.js";

const provincesListController = async (req, res) => {
  const q = req.validated?.query || req.query;
  const data = await listProvinces(q);
  res.status(200).json({ success: true, message: "Provinces fetched", data });
};

const provinceGetController = async (req, res) => {
  const { id } = req.validated?.params || req.params;
  const data = await getProvinceById(id);
  res.status(200).json({ success: true, message: "Province fetched", data });
};

const provinceCreateController = async (req, res) => {
  const data = await createProvince(req.validated?.body || req.body);
  res.status(201).json({ success: true, message: "Province created", data });
};

const provincePatchController = async (req, res) => {
  const { id } = req.validated?.params || req.params;
  const data = await updateProvince(id, req.validated?.body || req.body);
  res.status(200).json({ success: true, message: "Province updated", data });
};

const provinceDeleteController = async (req, res) => {
  const { id } = req.validated?.params || req.params;
  await deleteProvince(id);
  res.status(200).json({ success: true, message: "Province deleted", data: null });
};

const districtsListController = async (req, res) => {
  const q = req.validated?.query || req.query;
  const data = await listDistricts(q);
  res.status(200).json({ success: true, message: "Districts fetched", data });
};

const districtGetController = async (req, res) => {
  const { id } = req.validated?.params || req.params;
  const data = await getDistrictById(id);
  res.status(200).json({ success: true, message: "District fetched", data });
};

const districtCreateController = async (req, res) => {
  const data = await createDistrict(req.validated?.body || req.body);
  res.status(201).json({ success: true, message: "District created", data });
};

const districtPatchController = async (req, res) => {
  const { id } = req.validated?.params || req.params;
  const data = await updateDistrict(id, req.validated?.body || req.body);
  res.status(200).json({ success: true, message: "District updated", data });
};

const districtDeleteController = async (req, res) => {
  const { id } = req.validated?.params || req.params;
  await deleteDistrict(id);
  res.status(200).json({ success: true, message: "District deleted", data: null });
};

const stationsListController = async (req, res) => {
  const q = req.validated?.query || req.query;
  const data = await listStations(q);
  res.status(200).json({ success: true, message: "Stations fetched", data });
};

const stationGetController = async (req, res) => {
  const { id } = req.validated?.params || req.params;
  const data = await getStationById(id);
  res.status(200).json({ success: true, message: "Station fetched", data });
};

const stationCreateController = async (req, res) => {
  const data = await createStation(req.validated?.body || req.body);
  res.status(201).json({ success: true, message: "Station created", data });
};

const stationPatchController = async (req, res) => {
  const { id } = req.validated?.params || req.params;
  const data = await updateStation(id, req.validated?.body || req.body);
  res.status(200).json({ success: true, message: "Station updated", data });
};

const stationDeleteController = async (req, res) => {
  const { id } = req.validated?.params || req.params;
  await deleteStation(id);
  res.status(200).json({ success: true, message: "Station deleted", data: null });
};

export {
  provincesListController,
  provinceGetController,
  provinceCreateController,
  provincePatchController,
  provinceDeleteController,
  districtsListController,
  districtGetController,
  districtCreateController,
  districtPatchController,
  districtDeleteController,
  stationsListController,
  stationGetController,
  stationCreateController,
  stationPatchController,
  stationDeleteController
};
