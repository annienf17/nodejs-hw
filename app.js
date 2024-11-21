const express = require("express");
const logger = require("morgan");
const cors = require("cors");
const connectDB = require("./db");
require("dotenv").config();

const contactsRouter = require("./routes/api/contacts");

const app = express();

const formatsLogger = app.get("env") === "development" ? "dev" : "short";

app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());

app.use("/api/contacts", contactsRouter);

// Middleware obsługujący brakujące trasy
app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

// Centralny middleware do obsługi błędów
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.code === 11000) {
    // MongoDB duplicate key error
    return res.status(409).json({ message: "Contact already exists" });
  }
  res.status(500).json({ message: "Internal Server Error" });
});

connectDB();
module.exports = app;
