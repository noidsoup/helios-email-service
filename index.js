require('dotenv').config();
const jwt = require('jsonwebtoken');
const config = require("./config");
const express = require("express");
const bodyParser = require('body-parser');
const logger = require('./utils/logger');
const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json("Email API");
});

const api = require("./routes/api/v1");

function jwtVerify (req, res, next) {
  console.log('verifying token...')

    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    // decode token
    if (token) {
  
      // verifies secret and checks exp
      jwt.verify(token, process.env.SECRET, function(err, decoded) {
        if (err) {
          return res.json({ success: false, message: 'Failed to authenticate token.' });
        } else {
          // if everything is good, save to request for use in other routes
          req.decoded = decoded;
          next();
        }
      });
  
    } else {
      // if there is no token
      // return an error
    return res.status(403).send({ 
        success: false, 
        message: 'No token provided.' 
    });
  }
}

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// set up mongoose connection
const mongoose = require("mongoose");
const {
  db: { host, port, name },
} = config.prod;

const mongoDB = process.env.MONGODB_URI || `mongodb://${host}:${port}/${name}`;
mongoose.Promise = global.Promise;
mongoose.connect(mongoDB, { useNewUrlParser: true, useFindAndModify: false }, function(err) {
    if (err)
      logger.error(err);
});

const db = mongoose.connection;
db.on("connected", () => {
  logger.info(`using ${db.name}`);
});

app.use(router);
app.use("/api", jwtVerify, api);
logger.info('SERVER_PORT', process.env.SERVER_PORT);
app.listen(process.env.SERVER_PORT, () => logger.info(`email service listening on port ${process.env.SERVER_PORT}!`))