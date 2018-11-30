const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');
const logger = require('../utils/logger');

const Email = require("../models/email");
require('../services/cache');

const options = {
  auth: {
    api_key: process.env.SENDGRID_API_KEY,
  }
};

const mailer = nodemailer.createTransport(sgTransport(options));

exports.send_email = (req, res, err) => {
  if (err) {
    logger.error('Error making request to emailController', err);
    throw err;
  };

  const { to, from, subject, body } = req.body
  const email = {
    to,
    from,
    subject,
    body,
    html: '<b>Hello world</b>',
    sent: false,
  };

  const savedEmail = new Email(email);
  let id;

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
      const error = `An error has occurred while attempting to send email. The response from Sendgrid is: ${sendGridRes.message}, and the error object is ${err}`;
      logger.error(error);
      res.status(500).json({ message: error});
      throw(err || sendGridRes);
    }
    // Update previously saved email to reflect succesful send
    Email.findOneAndUpdate({_id: id}, { sent: true }, ((err, res) => {
      if (err) {
        const error = `Error saving email to MongoDB: ${err}`
        logger.error(error);
        res.status(500).json({ message: error});
        throw (error);
      }
      logger.info(`Saved email with ID: ${id}`)
    }))
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
  if (!req.params.email) {
    res.status(500).json({ message: "No email supplied in request." });
  };
  const userEmail = req.params.email;
  const emailList = Email.find(
    { to: userEmail },
  ).cache()
  if (!emailList) {
    const error = Error(`Error retrieving emails from MongoDB.`);
    logger.error(error);
    res.status(500).json({ message: error});
  }
    logger.info(`Retrieving emails ${emails.length} of the user ${userEmail}`);
    res.status(200).json({ emailList });
};
