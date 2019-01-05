require('dotenv').config({ debug: process.env.DEBUG })
const config = require("./config");
const express = require("express");
const bodyParser = require('body-parser');
const logger = require('./utils/logger');

const api = require("./routes/api/v1");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// set up mongoose connection
const mongoose = require("mongoose");
const {
  db: { host, port, name },
} = config.dev;

const mongoDB = process.env.MONGODB_URI || `mongodb://${host}:${port}/${name}`;
mongoose.Promise = global.Promise;
mongoose.connect(mongoDB, { useNewUrlParser: true, useFindAndModify: false });
const db = mongoose.connection;
db.on("connected", () => {
  logger.info(`using ${db.name}`);
});
db.on("error", logger.error.bind(logger, "MongoDB connection error;"));

app.use("/api", api);
console.log('using process.env.SERVER_PORT', process.env.SERVER_PORT);
app.listen(process.env.SERVER_PORT, () => logger.info(`email service listening on port ${process.env.SERVER_PORT}!`))