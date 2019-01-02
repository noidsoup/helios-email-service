const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');
const logger = require('../utils/logger');

require('../services/cache');
const Email = require("../models/successfulEmail");
const failedEmail = require("../models/failedEmail");


const options = {
  auth: {
    api_key: process.env.SENDGRID_API_KEY,
  }
};

const mailer = nodemailer.createTransport(sgTransport(options));

const saveEmail = (model) => model.save((err, res) => {
  if (err) {
    logger.error(`Error saving email object to MongoDB: ${err}`);
    throw err;
  }
  id = res._id;
  console.info('saved to mongoDB', id);
});

exports.send_email = (req, res, err) => {
  if (err) {
    logger.error('Error making request to emailController', err);
    throw err;
  };

  let id;
  const { to, from, subject, body } = req.body
  const email = {
    to,
    from,
    subject,
    body,
    html: `<h1>${body}</h1>`,
    sent: false,
  };

  const savedEmail = new Email(email);
  savedEmail.save((err, res) => {
    if (err) {
      logger.error(`Error saving email object to MongoDB: ${err}`);
      throw err;
    }

    id = res._id;
    logger.info('saved to mongoDB', id);
  });

  mailer.sendMail(email, (err, sendGridRes) => {
    if (err || sendGridRes.message !== 'success') {
      email.sent = false;
      saveEmail(new failedEmail(email));
      const error = `An error has occurred while attempting to send email. The response from Sendgrid is: ${sendGridRes.message}, and the error object is ${err}`;
      logger.error(error);
      res.status(500).json({ message: error});
      throw(err || sendGridRes);
    }
    saveEmail(new Email(email));
    const msg = `Successfully sent email to ${email.to}. Sendgrid responded with: ${sendGridRes.message}`;
    logger.info(msg);
    res.status(200).json({ message: msg });
  });
};

// Display list of all emails.
exports.get_emails = async (req, res) => {
  console.log(" i ran");
  const emails = await Email.find().cache()
  if (!emails) {
    const error = Error(`Error retrieving emails from MongoDB.`);
    logger.error(error);
    res.status(500).json({ message: error});
  }
    // Successful, so send data
    logger.info(`Retrieving array of emails with length of ${emails.length}`);
    res.status(200).json({ emails });
};

// Get email Details based on ID.
exports.get_single_email = async (req, res) => {
  if (!req.params.id) {
    const error = Error("No ID supplied in request");
    res.status(500).json({ message: error });
  };
  const id = req.params.id;
  const emailDetail = await Email.findOne({
    _id: id
  }).cache();

  if (!emailDetail) {
    const error = Error(`Error retrieving emails from MongoDB.`);
    logger.error(error);
    res.status(500).json({ message: error});
  }
  // Successful, so send data
  logger.info(`Retrieving email with ID of ${id}`);
  res.status(200).json({ emailDetail });

};

// Handle request for EMAILS by a given email address
exports.get_user_emails = async (req, res) => {
  const userEmail = req.params.email;
  if (!req.params.email) {
    const error = Error("No email supplied in request");
    logger.error((error));
    res.status(500).json({ message: "No email supplied in request" });
  };
  logger.info(`Attempting to retrieve emails from the user ${userEmail}`);
  const emailList = await Email.find(
    { $and : [{ $or : [ { to : userEmail }, { from : userEmail } ] }] },
  );
  if (!emailList) {
    const error = Error(`Error retrieving emails from MongoDB.`);
    logger.error(error);
    res.status(500).json({ message: error});
  }
  logger.info(`Retrieving emails ${emailList.length} of the user ${userEmail}`);
  res.status(200).json(emailList);
};
