//require('dotenv').config();
require('dotenv').config({ path: './tmp/.env' })
const config = require("./config");
const express = require("express");
const bodyParser = require('body-parser');
const logger = require('./utils/logger');
const router = express.Router();
router.get("/", (req, res) => {
  res.status(200).json("Email API");
});
const api = require("./routes/api/v1");

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
    console.log('-------------------', err);
});

const db = mongoose.connection;
db.on("connected", () => {
  logger.info(`using ${db.name}`);
  console.log(`using=------------------------- ${db.name}`);
});

app.use(router);
app.use("/api", api);
console.log('SERVER_PORT', process.env.SERVER_PORT);
app.listen(process.env.SERVER_PORT, () => logger.info(`email service listening on port ${process.env.SERVER_PORT}!`))