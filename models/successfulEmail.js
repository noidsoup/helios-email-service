const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const EmailSchema = new Schema(
  {
    to: { type: String, required: true },
    from: { type: String, required: true },
    subject: { type: String, required: true, maxlength: 78 },
    body: { type: String, required: true },
    sent: { type: String, required: true },
  }
);

// Export model
module.exports = mongoose.model("SuccesfulEmails", EmailSchema, "SuccesfulEmails");
