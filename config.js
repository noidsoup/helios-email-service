require("dotenv").config(); // loads evnironment variables defined in .env

// / DEVELOPMENT ///
const dev = {
  app: {
    sendgrid_api_key: process.env.SENDGRID_API_KEY,
    port: parseInt(process.env.DEV_APP_PORT) || 3000,
  },
  db: {
    host: process.env.DEV_DB_HOST || "localhost",
    port: parseInt(process.env.DEV_DB_PORT) || 27017,
    name: process.env.DEV_DB_NAME || "localEmailDB",
  },
};

// / STAGING ///
const staging = {
  db: {
    host: process.env.STAGING_DB_HOST || "localhost",
    port: parseInt(process.env.STAGING_DB_PORT) || 27017,
    name: process.env.STAGING_DB_NAME || "statgingDB",
  },
};

// / PRODUCTION ///
const prod = {
  app: {
    sendgrid_api_key: process.env.SENDGRID_API_KEY,
    server_port: parseInt(process.env.DEV_APP_PORT) || 3001,
    redis_host: process.env.REDIS_HOST,
  },
  db: {
    host: process.env.PROD_DB_HOST || "localhost",
    port: parseInt(process.env.PROD_DB_PORT) || 27017,
    name: process.env.PROD_DB_NAME || "productionDB",
  },
};

const config = {
  dev,
  staging,
  prod,
};

module.exports = config;