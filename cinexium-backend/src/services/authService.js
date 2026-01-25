import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { isValidEmail } from "../utils/validators/emailValidator.js";
import { isValidPassword } from "../utils/validators/passwordValidator.js";
import crypto from "node:crypto";
import sendEmail from "../utils/sendMail.js";

//sign up service
export const signupService = async ({ name, email, password }) => {
  //validate data
  if (!name || !email || !password) {
    return {
      status: 400,
      message: "All fields are required",
    };
  }
  //check is email is valid
  if (!isValidEmail(email)) {
    return {
      status: 400,
      message: "Invalid email format",
    };
  }

  //check password length
  if (!isValidPassword(password)) {
    return {
      status: 400,
      message: "Password must be at least 8 characters long",
    };
  }

  //check if user exist
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return {
      status: 409,
      message: "User already exists",
    };
  }

  //hash password
  const hasPassword = await bcrypt.hash(password, 10);

  //create a user
  const newUser = await User.create({
    name,
    email,
    password: hasPassword,
  });

  //send response
  return {
    status: 201,
    message: "User registered successfully",
    user: {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
    },
  };
};

//login service
export const loginService = async ({ email, password }) => {
  //validation
  if (!email || !password) {
    return {
      status: 400,
      message: "Email and password are required",
    };
  }

  //check user exists
  const user = await User.findOne({ email });

  if (!user) {
    return {
      status: 401,
      message: "User not found",
    };
  }

  //compare password
  const isPasswordMatch = await bcrypt.compare(password, user.password);

  if (!isPasswordMatch) {
    return {
      status: 401,
      message: "Invalid Credentials",
    };
  }
  if (user.deleteRequested) {
    user.deleteRequested = false;
    user.deleteAt = null;
    await user.save();
  }

  //generate token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  //send response
  return {
    status: 200,
    message: "Login Successfully",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  };
};

//profile update service
export const updateProfileService = async (userId, { name }) => {
  // 1. Validate input
  if (!name) {
    return {
      status: 400,
      message: "Name is required",
    };
  }

  // 2. Update user
  const updateUser = await User.findByIdAndUpdate(
    userId,
    { name },
    { new: true }
  ).select("-password");

  // 3. Check if user exists
  if (!updateUser) {
    return {
      status: 404,
      message: "User not found",
    };
  }

  // 4. Response
  return {
    status: 200,
    message: "Profile name Updated successfully",
    user: updateUser,
  };
};

// change password service
export const changePasswordService = async (
  userId,
  { oldPassword, newPassword }
) => {
  //validate input
  if (!oldPassword || !newPassword) {
    return {
      status: 400,
      message: "Old and new password are required",
    };
  }
  //check password length
  if (!isValidPassword(newPassword)) {
    return {
      status: 400,
      message: "Password must be at least 8 characters long",
    };
  }

  //fetch user WITH password
  const user = await User.findById(userId).select("+password");

  //if user not exist
  if (!user) {
    return {
      status: 404,
      message: "User not found",
    };
  }
  //compare old password
  const isMatch = await bcrypt.compare(oldPassword, user.password);

  //if its not match
  if (!isMatch) {
    return {
      status: 401,
      message: "Old password is incorrect.",
    };
  }

  //hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  //save new password
  user.password = hashedPassword;
  await user.save();

  //response
  return {
    status: 200,
    message: "password changed successfully",
  };
};

//logout service
export const logoutService = () => {
  return {
    status: 200,
    message: "Logout successfully",
  };
};

//forget password service
export const forgotPasswordService = async (email) => {
  if (!email) {
    return {
      status: 400,
      message: "Email is required",
    };
  }
  if (!isValidEmail(email)) {
    return {
      status: 400,
      message: "Invalid email format",
    };
  }

  const user = await User.findOne({ email });
  if (!user) {
    return {
      status: 200,
      message: "If an account exist, a password reset email been sent",
    };
  }
  //generate a raw token
  const resetToken = crypto.randomBytes(32).toString("hex");
  //hashed the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

  await user.save();

  // send email
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  await sendEmail({
    to: user.email,
    subject: "Reset your password",
    html: `Click here to reset password:${resetLink}`,
  });
  return {
    status: 200,
    message: "If an account exists, a password reset email has been sent",
  };
};

// reset password viw email link service
export const resetPasswordService = async (token, newPassword) => {
  if (!token || !newPassword) {
    return {
      status: 400,
      message: "token and newPassword are required",
    };
  }

  if (!isValidPassword(newPassword)) {
    return {
      status: 400,
      message: "Password must be at least 8 characters long",
    };
  }

  //hash incoming token

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) {
    return {
      status: 400,
      message: "invalid or expire token",
    };
  }

  // hash new password

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);

  //kill the token forever
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  return {
    status: 200,
    message: "Password reset successful",
  };
};

//account delete request service
export const deleteAccountRequestService = async (userId, password) => {
  if (!password) {
    return {
      status: 400,
      message: "Password is required ",
    };
  }

  const user = await User.findById(userId);
  if (!user) {
    return {
      status: 404,
      message: "User not found",
    };
  }

  if (user.deleteRequested) {
    return {
      status: 400,
      message: "Account deletion already requested",
    };
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return {
      status: 400,
      message: "Invalid password",
    };
  }

  user.deleteRequested = true;
  user.deleteAt = Date.now() + 7 * 24 * 60 * 60 * 1000; //7 days

  await user.save();
  await sendEmail({
    to: user.email,
    subject: "Account deletion requested",
    html: `
    <p> Your account is schedule for deletion</p>
    <p>If you did not request this, simply log in to cancel.</p>
    <p>Deletion date:${new Date(user.deleteAt).toDateString()} </p>
    `,
  });

  return {
    status: 200,
    message: "Account deletion scheduled, You have  7 days to cancel.",
  };
};
