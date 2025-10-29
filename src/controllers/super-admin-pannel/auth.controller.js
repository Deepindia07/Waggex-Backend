import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import User from "../../models/User.js"; // adjust path if needed

const signJwt = (user) =>
  jwt.sign(
    { id: user.userId, role: user.role, email: user.email },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "1d" }
  );

// POST /api/auth/register
export const registerController = async (req, res) => {
  try {
    const {
      firstName = "",
      lastName = "",
      email = "",
      phoneNumber = "",
      password = "",
      role = "SUPERADMIN", // or "admin"/"user" if you want
    } = req.body;

    // basic validations
    if (!firstName?.trim() || !lastName?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "First & last name are required." });
    }
    if (!email && !phoneNumber) {
      return res
        .status(400)
        .json({ success: false, message: "Provide email or phone number." });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    // normalize
    const normalizedEmail = email
      ? String(email).toLowerCase().trim()
      : undefined;
    const normalizedPhone = phoneNumber
      ? String(phoneNumber).trim()
      : undefined;

    // check duplicates
    const existing = await User.findOne({
      $or: [
        normalizedEmail ? { email: normalizedEmail } : null,
        normalizedPhone ? { phoneNumber: normalizedPhone } : null,
      ].filter(Boolean),
    });

    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "Email or phone already in use." });
    }

    // create user (password is hashed by pre-save hook)
    const user = await User.create({
      userId: uuid(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      phoneNumber: normalizedPhone,
      password,
      role,
      isActive: true,
    });

    const token = signJwt(user);

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      token,
      user: {
        userId: user.userId,
        role: user.role,
        email: user.email,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (err) {
    console.error("auth:register", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to register user." });
  }
};

// POST /api/auth/login
export const loginController = async (req, res) => {
  try {
    const { email_or_phoneNumber, password } = req.body;

    if (!email_or_phoneNumber || !password) {
      return res.status(400).json({
        success: false,
        message: "Email or phone number and password are required.",
      });
    }

    const identifier = String(email_or_phoneNumber).trim();
    const isEmail = identifier.includes("@");

    const whereCondition = isEmail
      ? { email: identifier.toLowerCase(), isActive: true }
      : { phoneNumber: identifier, isActive: true };

    const user = await User.findOne(whereCondition);
    if (!user || !user.password) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid credentials." });
    }

    // compare password (via instance method or bcrypt directly)
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Incorrect password." });
    }

    const token = signJwt(user);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        userId: user.userId,
        role: user.role,
        email: user.email,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (err) {
    console.error("auth:login", err);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred during login.",
    });
  }
};
