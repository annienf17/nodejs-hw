const express = require("express");
const bcrypt = require("bcryptjs");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const multer = require("multer");
const path = require("path");
const fs = require("fs/promises");
const Jimp = require("jimp");
const User = require("../../models/user");
const auth = require("../../middleware/auth");

const router = express.Router();

const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const subscriptionSchema = Joi.object({
  subscription: Joi.string().valid("starter", "pro", "business").required(),
});

// Konfiguracja multer do przesyłania plików
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../tmp"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      `${req.user._id}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({ storage });

router.post("/signup", async (req, res) => {
  const { error } = signupSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ message: "Email in use" });

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Hashed Password:", hashedPassword);

    const avatarURL = gravatar.url(email, { s: "200", r: "pg", d: "mm" });

    const user = new User({ email, password: hashedPassword, avatarURL });
    await user.save();

    res.status(201).json({
      user: {
        email: user.email,
        subscription: user.subscription,
        avatarURL: user.avatarURL,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  const { error } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found");
      return res.status(401).json({ message: "Email or password is wrong" });
    }

    console.log("Plain Password:", password);
    console.log("Stored Hashed Password:", user.password);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log("Password Valid:", isPasswordValid);
    if (!isPasswordValid) {
      console.log("Invalid password");
      return res.status(401).json({ message: "Email or password is wrong" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    user.token = token;
    await user.save();

    res.status(200).json({
      token,
      user: {
        email: user.email,
        subscription: user.subscription,
        avatarURL: user.avatarURL,
      },
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/logout", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    user.token = null;
    await user.save();

    res.status(200).json({ message: "Successfully logged out" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/current", auth, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    res.status(200).json({
      email: user.email,
      subscription: user.subscription,
      avatarURL: user.avatarURL,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Endpoint PATCH /users do aktualizacji subskrypcji użytkownika
router.patch("/", auth, async (req, res) => {
  const { error } = subscriptionSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { subscription } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { subscription },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Endpoint PATCH /users/avatars do aktualizacji awatara użytkownika
router.patch("/avatars", auth, upload.single("avatar"), async (req, res) => {
  try {
    const { path: tempUpload, filename } = req.file;
    const resultUpload = path.join(__dirname, "../../public/avatars", filename);

    console.log("Temp upload path:", tempUpload);
    console.log("Result upload path:", resultUpload);

    // Przetwarzanie obrazu za pomocą Jimp
    const image = await Jimp.read(tempUpload);
    await image.resize(250, 250).writeAsync(resultUpload);

    // Usunięcie pliku z folderu tmp
    await fs.unlink(tempUpload);

    const avatarURL = path.join("/avatars", filename);
    await User.findByIdAndUpdate(req.user._id, { avatarURL });

    res.json({ avatarURL });
  } catch (err) {
    console.error("Error processing avatar:", err);
    await fs.unlink(req.file.path);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
