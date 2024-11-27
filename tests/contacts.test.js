const request = require("supertest");
const app = require("../app");
const mongoose = require("mongoose");
const User = require("../models/user");
const Contact = require("../models/contactModel");

let token;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Rejestracja i logowanie użytkownika, aby uzyskać token
  await request(app).post("/api/users/signup").send({
    email: "testuser@example.com",
    password: "testpassword",
  });

  const res = await request(app).post("/api/users/login").send({
    email: "testuser@example.com",
    password: "testpassword",
  });

  token = res.body.token;
});

afterAll(async () => {
  await mongoose.connection.close();
});

afterEach(async () => {
  await User.deleteMany({});
  await Contact.deleteMany({});
});

describe("POST /api/contacts", () => {
  it("should create a new contact", async () => {
    const res = await request(app)
      .post("/api/contacts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "John Doe",
        email: "john@example.com",
        phone: "123-456-7890",
        favorite: true,
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("name", "John Doe");
    expect(res.body).toHaveProperty("email", "john@example.com");
    expect(res.body).toHaveProperty("phone", "123-456-7890");
    expect(res.body).toHaveProperty("favorite", true);
  });

  it("should return validation error for missing fields", async () => {
    const res = await request(app)
      .post("/api/contacts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        email: "john@example.com",
        phone: "123-456-7890",
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("message");
  });
});

describe("GET /api/contacts", () => {
  it("should get all contacts", async () => {
    const user = await User.findOne({ email: "testuser@example.com" });
    await new Contact({
      name: "John Doe",
      email: "john@example.com",
      phone: "123-456-7890",
      favorite: true,
      owner: user._id,
    }).save();

    const res = await request(app)
      .get("/api/contacts")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.contacts).toHaveLength(1);
    expect(res.body.contacts[0]).toHaveProperty("name", "John Doe");
  });
});

describe("GET /api/contacts/:id", () => {
  it("should get a contact by ID", async () => {
    const user = await User.findOne({ email: "testuser@example.com" });
    const contact = await new Contact({
      name: "John Doe",
      email: "john@example.com",
      phone: "123-456-7890",
      favorite: true,
      owner: user._id,
    }).save();

    const res = await request(app)
      .get(`/api/contacts/${contact._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("name", "John Doe");
  });

  it("should return 404 for non-existing contact", async () => {
    const res = await request(app)
      .get("/api/contacts/60d5ec49f10a2c001c8d4c8b")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(404);
    expect(res.body).toHaveProperty("message", "Contact not found");
  });
});

describe("PUT /api/contacts/:id", () => {
  it("should update a contact by ID", async () => {
    const user = await User.findOne({ email: "testuser@example.com" });
    const contact = await new Contact({
      name: "John Doe",
      email: "john@example.com",
      phone: "123-456-7890",
      favorite: true,
      owner: user._id,
    }).save();

    const res = await request(app)
      .put(`/api/contacts/${contact._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Jane Doe",
        email: "jane@example.com",
        phone: "987-654-3210",
        favorite: false,
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("name", "Jane Doe");
    expect(res.body).toHaveProperty("email", "jane@example.com");
    expect(res.body).toHaveProperty("phone", "987-654-3210");
    expect(res.body).toHaveProperty("favorite", false);
  });

  it("should return 404 for non-existing contact", async () => {
    const res = await request(app)
      .put("/api/contacts/60d5ec49f10a2c001c8d4c8b")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Jane Doe",
        email: "jane@example.com",
        phone: "987-654-3210",
        favorite: false,
      });

    expect(res.statusCode).toEqual(404);
    expect(res.body).toHaveProperty("message", "Contact not found");
  });
});

describe("DELETE /api/contacts/:id", () => {
  it("should delete a contact by ID", async () => {
    const user = await User.findOne({ email: "testuser@example.com" });
    const contact = await new Contact({
      name: "John Doe",
      email: "john@example.com",
      phone: "123-456-7890",
      favorite: true,
      owner: user._id,
    }).save();

    const res = await request(app)
      .delete(`/api/contacts/${contact._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("message", "Contact deleted");
  });

  it("should return 404 for non-existing contact", async () => {
    const res = await request(app)
      .delete("/api/contacts/60d5ec49f10a2c001c8d4c8b")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toEqual(404);
    expect(res.body).toHaveProperty("message", "Contact not found");
  });
});
