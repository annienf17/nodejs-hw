const express = require("express");
const auth = require("../../middleware/auth");
const router = express.Router();
const Contact = require("../../models/contactModel");

// Example of a protected route to get all contacts
router.get("/", auth, async (req, res) => {
  try {
    const contacts = await Contact.find({ owner: req.user._id });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Example of a protected route to create a new contact
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

// Example of a protected route to get a contact by ID
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

// Example of a protected route to update a contact by ID
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

// Example of a protected route to delete a contact by ID
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
