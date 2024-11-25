const express = require("express");
const auth = require("../../middleware/auth");
const router = express.Router();
const Contact = require("../../models/contactModel");

// Endpoint GET /contacts z paginacją
router.get("/", auth, async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  try {
    const contacts = await Contact.find({ owner: req.user._id })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Contact.countDocuments({ owner: req.user._id });

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
router.post("/", auth, async (req, res) => {
  try {
    const { name, email, phone, favorite } = req.body;
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
    res.status(500).json({ message: "Server error" });
  }
});

// Endpoint PUT /contacts/:id do aktualizacji kontaktu po ID
router.put("/:id", auth, async (req, res) => {
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
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
