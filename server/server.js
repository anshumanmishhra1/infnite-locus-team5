import express from "express";
import jwt from "jsonwebtoken";
import connectDb from "./config/db.js";
import bcrypt from "bcrypt";
import User from "./models/userSchema.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from 'dotenv';

dotenv.config();

const app = express();
connectDb();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Input validation middleware
const validateSignup = (req, res, next) => {
  const { name, email, password, age } = req.body.formData || req.body;
  
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ message: "Name must be at least 2 characters long" });
  }
  
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "Please provide a valid email address" });
  }
  
  if (!password || password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters long" });
  }
  
  if (!age || age < 13 || age > 120) {
    return res.status(400).json({ message: "Age must be between 13 and 120" });
  }
  
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body.formData || req.body;
  
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "Please provide a valid email address" });
  }
  
  if (!password) {
    return res.status(400).json({ message: "Password is required" });
  }
  
  next();
};

// Auth middleware
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid token" });
  }
};

app.post("/user/signup", validateSignup, async (req, res) => {
  try {
    const userData = req.body.formData || req.body;
    const { name, email, password, age } = userData;

    // Check if user with same email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "User with this email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create the new user
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      age: parseInt(age)
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser._id, 
        email: newUser.email,
        name: newUser.name 
      },
      process.env.SECRET_KEY,
      { expiresIn: "7d" }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({ 
      message: "Account created successfully!",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        age: newUser.age
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

app.post("/user/login", validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body.formData || req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (!existingUser) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: existingUser._id, 
        email: existingUser.email,
        name: existingUser.name 
      },
      process.env.SECRET_KEY,
      { expiresIn: "7d" }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({ 
      message: "Login successful!",
      user: {
        id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
        age: existingUser.age
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

app.post("/user/logout", (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: "Logged out successfully" });
});

app.get("/user/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/user/verify", authenticateToken, (req, res) => {
  res.json({ 
    valid: true, 
    user: {
      id: req.user.userId,
      email: req.user.email,
      name: req.user.name
    }
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});