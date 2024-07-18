const logger = require("../utils/logger");
const config = require("../utils/config");
const jwt = require("jsonwebtoken");
const userServices = require("../services/userService");

const verifyToken = async (req, res, next) => {
  const token = req.header("Authorization").replace("Bearer ", "");
  if (!token) {
    return res.status(403).json({
      status: "error",
      message: "No token provided",
    });
  }
  try {
    const decoded = jwt.verify(token, config.SECRET);
    const user = await userServices.findUserByOne("_id", decoded.userId);
    if (!user || user.token != token) {
      return res.status(403).json({
        status: "error",
        message: "Failed to authenticate token",
      });
    }
    req.userId = decoded.userId;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      const expdecoded = jwt.decode(token);
      if (expdecoded.userId) {
        try {
          let expuser = await userServices.findUserByOne(
            "_id",
            expdecoded.userId
          );
          expuser.token = null;
          await expuser.save();
          return res.status(401).json({
            status: "error",
            message: "Token has expired. Please log in again.",
          });
        } catch (err) {
          logger.info(err.message);
          return res.status(500).json({
            status: "error",
            message: "Internal Server Error",
          });
        }
      }
    }
    return res.status(401).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
};

const requestLogger = (request, response, next) => {
  logger.info("Method:", request.method);
  logger.info("Path:  ", request.path);
  logger.info("Body:  ", request.body);
  logger.info("---");
  next();
};

const errorHandler = (error, request, response, next) => {
  logger.error(error.message);
  // logger.error(error.name);
  if (error.name === "CastError") {
    return response.status(400).json({
      status: "error",
      message: "improper arguments passed through",
    });
  } else if (error.name === "ValidationError") {
    return response.status(400).json({
      status: "error",
      message: error.message,
    });
  } else if (error.name === "SyntaxError") {
    return response.status(400).json({
      status: "error",
      message: "Syntax Error",
    });
  } else if (error.name === "ReferenceError") {
    return response.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  } else if (error.status == 404) {
    return response.status(500).json({
      status: "error",
      message: error.message,
    });
  } else if (error.status == 500) {
    return response.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
  next(error);
};

const unknownEndpoint = (err, req, res, next) => {
  return res.status(404).json({
    status: "error",
    message: "Unknown endpoint",
  });
};

module.exports = {
  requestLogger,
  errorHandler,
  unknownEndpoint,
  verifyToken,
};
