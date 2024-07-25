const express = require("express");
require("./instrument.js");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const config = require("./utils/config");
const logger = require("./utils/logger");
const userRoutes = require("./routers/userrouters");
const Sentry = require("@sentry/node");
const remindersroute = require("./routers/reminderrouters");
const diaryrouter = require("./routers/diaryrouter");
const cors = require("cors");
const middleware = require("./utils/middleware");
const app = express();
const session = require("express-session");
const passport = require("passport");
const authRoutes = require("./routers/authrouters.js");
const redisClient = require("./utils/reddisConnection.js");
require("./utils/passport");

//DATABASES
mongoose.set("strictQuery", false);
mongoose
  .connect(config.MONGODB_URI, {})
  .then(() => logger.info("MongoDB connected"))
  .catch((err) => logger.error("MongoDB connection error:", err));

(async () => {
  await redisClient.connect();
})();
//middleware for requests before routes access
Sentry.setupExpressErrorHandler(app);

//app config
app.use(cors());
app.use(express.static("dist"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//google middleware
app.use(
  session({
    secret: config.SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
// Initialize Passport and use session
app.use(passport.initialize());
app.use(passport.session());

//app.use(middleware.requestLogger);
app.use(bodyParser.json());

//fetchEmails();
// Use routes
app.use("/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/diaries", diaryrouter);
app.use("/api/reminders", remindersroute);

//middleware to handle errors in utils module
app.use(middleware.errorHandler);
app.use(middleware.unknownEndpoint);

module.exports = app;
