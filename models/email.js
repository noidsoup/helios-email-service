const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const EmailSchema = new Schema(
  {
    to: { type: String, required: true },
    from: { type: String, required: true },
    subject: { type: String, required: true, maxlength: 78 },
    body: { type: String, required: true },
    magiclink: { type: String, required: false },
    type: { type: String, required: false },
    sent: { type: String, required: true },
  }
);

// Export model
module.exports = mongoose.model("Email", EmailSchema);
