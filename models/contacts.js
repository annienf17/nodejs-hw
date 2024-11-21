const Contact = require("./contactModel");

const listContacts = async () => {
  return Contact.find();
};

const getContactById = async (contactId) => {
  return Contact.findById(contactId);
};

const addContact = async (body) => {
  const contact = new Contact(body);
  return contact.save();
};

const removeContact = async (contactId) => {
  return Contact.findByIdAndDelete(contactId);
};

const updateContact = async (contactId, body) => {
  return Contact.findByIdAndUpdate(contactId, body, { new: true });
};

const updateStatusContact = async (contactId, favorite) => {
  return Contact.findByIdAndUpdate(contactId, { favorite }, { new: true });
};

module.exports = {
  listContacts,
  getContactById,
  addContact,
  removeContact,
  updateContact,
  updateStatusContact,
};
