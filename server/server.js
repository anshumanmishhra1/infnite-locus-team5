import express from "express";
import jwt from "jsonwebtoken";
import connectDb from "./config/db.js";
import bcrypt from "bcrypt";
import User from "./models/userSchema.js";

const app = express();
connectDb();

app.use(express.json());

app.post("/user/signup", async (req, res) => {
  try {
    const user = req.body;
    const userPassword = user.password;

    // Check if user with same email already exists
    const existingUser = await User.findOne({ email: user.email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userPassword, 10);

    // Create the new and updating the password
    const newUser = new User({
      ...user,
      password: hashedPassword,
    });

    //saving the new user
    await newUser.save();
    console.log(newUser);

    res.status(201).send("User created successfully");
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
});

app.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check first if user exists in the database or not 
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(400).send("User doesn't exist. Check your email.");
    }

    // Comparing user password password with frontend password
    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) {
      return res.status(401).send("Invalid credentials. Check your password.");
    }

    // Generate JWT token for cookie pareser to check 
    const token = jwt.sign(
      { userId: existingUser._id, email: existingUser.email },
      process.env.SECRET_KEY, 
      { expiresIn: "1h" }
    );

    res.status(200).send("Login Successfull !!")

  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});
