require("dotenv").config();

const PORT = process.env.PORT;
const MONGODB_URI = process.env.MONGODB_URI;
const SECRET = process.env.SECRET;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const CLOUD_NAME = process.env.CLOUD_NAME;
const CLOUD_API_KEY = process.env.CLOUD_API_KEY;
const CLOUD_API_SECRET = process.env.CLOUD_API_SECRET;
const CLIENTID = process.env.CLIENTID;
const CLIENTSECRET = process.env.CLIENTSECRET;
const CLIENTPASSWORD = process.env.CLIENTPASSWORD;
const ID_INSTANCE= process.env.ID_INSTANCE;
const API_URL= process.env.API_URL;
const API_TOKEN_INSTANCE= process.env.API_TOKEN_INSTANCE;

module.exports = {
  MONGODB_URI,
  PORT,
  SECRET,
  EMAIL_USER,
  EMAIL_PASS,
  CLOUD_NAME,
  CLOUD_API_KEY,
  CLOUD_API_SECRET,
  CLIENTSECRET,
  CLIENTID,
  CLIENTPASSWORD,
  ID_INSTANCE,
  API_URL,
  API_TOKEN_INSTANCE
};
