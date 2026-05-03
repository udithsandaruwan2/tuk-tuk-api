import { createUser, deleteUser, getUserById, listUsers, updateUser } from "../services/userService.js";

const listUsersController = async (req, res) => {
  const data = await listUsers(req.validated?.query || req.query);
  res.status(200).json({ success: true, message: "Users fetched", data });
};

const getUserController = async (req, res) => {
  const { id } = req.validated?.params || req.params;
  const data = await getUserById(id);
  res.status(200).json({ success: true, message: "User fetched", data });
};

const createUserController = async (req, res) => {
  const data = await createUser(req.validated?.body || req.body);
  res.status(201).json({ success: true, message: "User created", data });
};

const patchUserController = async (req, res) => {
  const { id } = req.validated?.params || req.params;
  const data = await updateUser(id, req.validated?.body || req.body);
  res.status(200).json({ success: true, message: "User updated", data });
};

const deleteUserController = async (req, res) => {
  const { id } = req.validated?.params || req.params;
  await deleteUser(id);
  res.status(200).json({ success: true, message: "User deleted", data: null });
};

export { listUsersController, getUserController, createUserController, patchUserController, deleteUserController };
