const express = require("express");
const Joi = require("joi");
const auth = require("../../middleware/auth");
const router = express.Router();
const Contact = require("../../models/contactModel");

const phoneRegex = /^[0-9]{3}-[0-9]{3}-[0-9]{4}$/;

const contactSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(phoneRegex).required().messages({
    "string.pattern.base": "Phone number must be in the format XXX-XXX-XXXX",
  }),
  favorite: Joi.boolean(),
});

const favoriteSchema = Joi.object({
  favorite: Joi.boolean().required(),
});

const validateContact = (req, res, next) => {
  const { error } = contactSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

const validateFavorite = (req, res, next) => {
  const { error } = favoriteSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: "missing field favorite" });
  }
  next();
};

// Endpoint GET /contacts z paginacją i filtrowaniem
router.get("/", auth, async (req, res) => {
  const { page = 1, limit = 20, favorite } = req.query;
  const filter = { owner: req.user._id };

  if (favorite !== undefined) {
    filter.favorite = favorite === "true";
  }

  try {
    const contacts = await Contact.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Contact.countDocuments(filter);

    res.status(200).json({
      contacts,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Endpoint POST /contacts do tworzenia nowego kontaktu
router.post("/", auth, validateContact, async (req, res) => {
  try {
    const { name, email, phone, favorite } = req.body;

    // Sprawdzenie, czy kontakt już istnieje
    const existingContact = await Contact.findOne({
      email,
      owner: req.user._id,
    });
    if (existingContact) {
      return res.status(409).json({ message: "Contact already exists" });
    }

    const newContact = new Contact({
      name,
      email,
      phone,
      favorite,
      owner: req.user._id,
    });
    const savedContact = await newContact.save();
    res.status(201).json(savedContact);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Endpoint GET /contacts/:id do pobierania kontaktu po ID
router.get("/:id", auth, async (req, res) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }
    res.json(contact);
  } catch (err) {
    if (err.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid contact ID" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// Endpoint PUT /contacts/:id do aktualizacji kontaktu po ID
router.put("/:id", auth, validateContact, async (req, res) => {
  try {
    const { name, email, phone, favorite } = req.body;
    const updatedContact = await Contact.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { name, email, phone, favorite },
      { new: true }
    );
    if (!updatedContact) {
      return res.status(404).json({ message: "Contact not found" });
    }
    res.json(updatedContact);
  } catch (err) {
    if (err.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid contact ID" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// Endpoint DELETE /contacts/:id do usuwania kontaktu po ID
router.delete("/:id", auth, async (req, res) => {
  try {
    const deletedContact = await Contact.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!deletedContact) {
      return res.status(404).json({ message: "Contact not found" });
    }
    res.json({ message: "Contact deleted" });
  } catch (err) {
    if (err.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid contact ID" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// Endpoint PATCH /contacts/:id/favorite do aktualizacji statusu kontaktu
router.patch("/:id/favorite", auth, validateFavorite, async (req, res) => {
  try {
    const updatedContact = await Contact.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { favorite: req.body.favorite },
      { new: true }
    );
    if (!updatedContact) {
      return res.status(404).json({ message: "Contact not found" });
    }
    res.json(updatedContact);
  } catch (err) {
    if (err.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid contact ID" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
