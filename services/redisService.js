const redisClient = require("../utils/reddisConnection.js");
const logger = require("../utils/logger");

const setArray = async (key, array) => {
  try {
    await redisClient.setEx(key, 21900, JSON.stringify(array));
    logger.info("Id stored in reddis");
  } catch (err) {
    logger.error("Error setting array in Redis:", err);
    return;
  }
};

const getArray = async (key) => {
  try {
    const myArray = await redisClient.get(key);
    //logger.info(`getting key for ${key}`);
    return JSON.parse(myArray);
  } catch (err) {
    logger.error("Error getting token from Redis:", err);
    let error = new Error("Error occured verifying user");
    error.status = 400;
    throw error;
  }
};

const delArray = async (key) => {
  try {
    const myArray = await redisClient.del(key);
    logger.info(`getting key for ${key}`);
    return JSON.parse(myArray);
  } catch (err) {
    logger.error("Error getting token from Redis:", err);
    return;
  }
};

module.exports = { setArray, getArray, delArray };
