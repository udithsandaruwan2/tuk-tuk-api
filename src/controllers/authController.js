import { login } from "../services/authService.js";

const loginController = async (req, res) => {
  const result = await login(req.validated?.body || req.body);
  res.status(200).json({
    success: true,
    message: "Authenticated successfully",
    data: {
      accessToken: result.accessToken,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role
      }
    }
  });
};

export { loginController };
