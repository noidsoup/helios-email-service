require("dotenv").config(); // loads evnironment variables defined in .env

/* const fs = require('fs')

const path = '../.env';

fs.access(path, fs.F_OK, (err) => {
  if (err) {
    console.error(err)
    return
  }

  //file exists
  console.log('file exists');
}) */

// / DEVELOPMENT ///
const dev = {
  app: {
    sendgrid_api_key: process.env.SENDGRID_API_KEY,
    port: parseInt(process.env.SERVER_PORT) || 3001,
    redis_host: 'localhost'
  },
  db: {
    uri: process.env.DEV_MONGODB_URI,
    host: "localhost",
    port: parseInt(process.env.DB_PORT) || 27017,
    name: "localEmailDB",
  },
};

// / STAGING ///
const staging = {
  db: {
    uri: process.env.MONGODB_URI,
    host: process.env.STAGING_DB_HOST || "localhost",
    port: parseInt(process.env.STAGING_DB_PORT) || 27017,
    name: process.env.STAGING_DB_NAME || "statgingDB",
  },
};

// / PRODUCTION ///
const prod = {
  app: {
    sendgrid_api_key: process.env.SENDGRID_API_KEY,
    server_port: parseInt(process.env.SERVER_PORT),
    redis_host: process.env.REDIS_HOST,
  },
  db: {
    uri: process.env.MONGODB_URI,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    name: 'emailDB',
  },
};

const config = {
  dev,
  staging,
  prod,
};

module.exports = config;