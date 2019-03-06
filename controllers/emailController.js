const nodemailer = require('nodemailer');
const EmailTemplates = require('swig-email-templates');
const sgTransport = require('nodemailer-sendgrid-transport-categories');
const logger = require('../utils/logger');
const ent = require('ent');
const encode = require('ent/encode');
const decode = require('ent/decode');

const Email = require("../models/email");
require('../services/cache');

const options = {
  auth: {
    api_key: process.env.SENDGRID_API_KEY,
  }
};

const templates = new EmailTemplates({root: './',   juice: {
    webResources: {
      images: false // don't inline images, gmail won't like it.
    }
  },
});
const mailer = nodemailer.createTransport(sgTransport(options));

exports.send_email = (req, res, err) => {
  if (err) {
    logger.error('Error making request to emailController', err);
    throw err;
  };

  const { to, from, subject, body, type } = req.body
  const email = {
    to,
    from,
    subject,
    body,
    sent: false,
    categories: ['Content Portal'],
    type
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

  // sets up variables passed in through the request, specifically the magic link used in the email template
  var context = {
    magic_link: ent.decode(body),
    type: type,
  };

  templates.render('email_template.html', context, function(template_err, html) {
    if (template_err) {
      const error = `An error has occured while using the template render function: ${template_err}`;
      logger.error(error);
    }
    // add 'email_template.html' html to email object
    email.html = html;

    // Send email
    mailer.sendMail(email, (mailer_err, sendGridRes) => {
      if (mailer_err || !sendGridRes || sendGridRes.message !== 'success') {
        const error = `An error has occurred while attempting to send email. The response from Sendgrid is: ${sendGridRes}, and the error object is ${mailer_err}`;
        logger.error(error);
        res.status(500).json({ message: error});
        throw(mailer_err || sendGridRes);
      }
      // Update previously saved email to reflect succesful send
      Email.findOneAndUpdate({_id: id}, { sent: true }, ((findOneAndUpdate_err, res) => {
        if (findOneAndUpdate_err) {
          const error = `Error saving email to MongoDB: ${findOneAndUpdate_err}`
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

  });
};

// Display list of all emails.
exports.get_emails = async (req, res) => {
  const emails = await Email.find().cache()
  if (!emails) {
    const error = Error(`Error retrieving emails from MongoDB.`);
    logger.error(error);
    console.log(error);
    res.status(500).json({ message: error});
  }
    // Successful, so send data
    logger.info(`Retrieving array of emails with length of ${emails.length}`);
    console.log(emails);
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
  const emailList = await Email.find(
    { to: userEmail },
  );
  if (!emailList) {
    const error = Error(`Error retrieving emails from MongoDB.`);
    logger.error(error);
    res.status(500).json({ message: error});
  }
    logger.info(`Retrieving emails ${emailList.length} of the user ${userEmail}`);
    res.json(emailList);
};

