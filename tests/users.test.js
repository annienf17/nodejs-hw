const request = require("supertest");
const app = require("../app");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const path = require("path");

describe("PATCH /api/users/avatars", () => {
  let token;
  let userId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Tworzenie użytkownika testowego
    const user = new User({
      email: "test@example.com",
      password: await bcrypt.hash("password123", 10),
      avatarURL: "",
    });
    await user.save();

    userId = user._id;

    // Logowanie użytkownika testowego, aby uzyskać token
    const res = await request(app)
      .post("/api/users/login")
      .send({ email: "test@example.com", password: "password123" });

    token = res.body.token;
    console.log("Login Response:", res.body); // Dodaj logowanie odpowiedzi logowania
    console.log("Token:", token); // Dodaj logowanie tokena
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  it("should update the user's avatar", async () => {
    console.log("Token before request:", token); // Dodaj logowanie tokena przed żądaniem

    const res = await request(app)
      .patch("/api/users/avatars")
      .set("Authorization", `Bearer ${token}`)
      .attach("avatar", path.join(__dirname, "test-avatar.jpg"));

    console.log("Response status:", res.status); // Dodaj logowanie statusu odpowiedzi
    console.log("Response body:", res.body); // Dodaj logowanie ciała odpowiedzi

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("avatarURL");

    const user = await User.findById(userId);
    expect(user.avatarURL).toBe(res.body.avatarURL);
  });

  it("should return 401 if not authorized", async () => {
    const res = await request(app)
      .patch("/api/users/avatars")
      .attach("avatar", path.join(__dirname, "test-avatar.jpg"));

    console.log("Unauthorized Response:", res.body); // Dodaj logowanie odpowiedzi

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("message", "Not authorized");
  });
});
