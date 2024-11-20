const mongoose = require("mongoose");

const uri =
  "mongodb+srv://annie:15Niema29@cluster0.kb8py.mongodb.net/db-contacts?retryWrites=true&w=majority";

const connectDB = async () => {
  try {
    await mongoose.connect(uri);
    console.log("Database connection successful");
  } catch (error) {
    console.error("Could not connect to MongoDB:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
