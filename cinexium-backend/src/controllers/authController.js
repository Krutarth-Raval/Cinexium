import {
  changePasswordService,
  deleteAccountRequestService,
  forgotPasswordService,
  logoutService,
  resetPasswordService,
  signupService,
  updateProfileService,
} from "../services/authService.js";
import { loginService } from "../services/authService.js";

//sign up controller
export const signupController = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const response = await signupService({ name, email, password });

    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// login controller
export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    const response = await loginService({ email, password });

    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//profile controller
export const profileController = (req, res) => {
  return res.status(200).json({
    message: "Profile Fetched Successfully.",
    user: req.user,
  });
};

//update name controller
export const updateProfileController = async (req, res) => {
  try {
    //get user id
    const userId = req.user._id;
    //gave a new name from request
    const { name } = req.body;

    //call the service
    const response = await updateProfileService(userId, { name });

    //respond to the client
    return res.status(response.status).json(response);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//change password controller
export const changePasswordController = async (req, res) => {
  try {
    //who is changing the password
    const userId = req.user._id;
    //what are they changing
    const { oldPassword, newPassword } = req.body;

    const response = await changePasswordService(userId, {
      oldPassword,
      newPassword,
    });

    return res.status(response.status).json(response);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//logout controller
export const logoutController = async (req, res) => {
  try {
    const result = logoutService();
    return res.status(result.status).json({ message: result.message });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//forget password controller
export const forgotPasswordController = async (req, res) => {
  try {
    const { email } = req.body;
    const response = await forgotPasswordService(email);

    return res.status(response.status).json(response);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// reset password with email link
export const resetPasswordController = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const response = await resetPasswordService(token, newPassword);
    return res.status(response.status).json(response);
  } catch (error) {
    return res.status(500).status({ message: error.message });
  }
};

// delete account request controller
export const deleteAccountRequestController = async (req, res) => {
  try {
    const { password } = req.body;
    const  userId = req.user._id
    const response = await deleteAccountRequestService(userId, password);
    return res.status(response.status).json(response);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
