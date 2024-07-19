require("express-async-errors");
const otpServices = require("../services/otpservices");
const emailServices = require("../services/emailServices");
const userServices = require("../services/userService");
const logger = require("../utils/logger");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../utils/config");
const remainderBots = require("./reminderbots");
const reminderServices = require("../services/reminderServices");

const signup = async (req, res, next) => {
  const { fullname, username, email, phonenumber, password } = req.body;
  try {
    let user = await userServices.findUserByOne("email", email);
    if (user) {
      return res.status(400).json({
        status: "error",
        message: "Email already exists",
      });
    }
    user = await userServices.findUserByOne("username", username);
    if (user) {
      return res.status(400).json({
        status: "error",
        message: "Username is already taken",
      });
    }
    user = await userServices.findUserByOne("phonenumber", phonenumber);
    if (user) {
      return res.status(400).json({
        status: "error",
        message: "Phonenumber is already taken",
      });
    }
    user = await userServices.createUser({
      fullname,
      username,
      email,
      phonenumber,
      password,
    });
    await otpServices.deleteUserOtpsByUserId(user._id);
    const otp = await otpServices.createUserOtp(user._id);
    await emailServices.sendOtpEmail(email, otp);
    logger.info("User successfully signed up");
    res.status(200).json({
      status: "PENDING",
      message: "Verification OTP sent",
      data: { email },
    });
  } catch (err) {
    logger.error("Authentication/Signup:", err);
    next(err);
  }
};

// Verify OTP
const verify = async (req, res, next) => {
  try {
    let { email, otp } = req.body;
    const user = await userServices.findUserByOne("email", email);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User does not exists please re-route to sign up page",
      });
    }
    const userotprecord = await otpServices.findUserOtpByUserId(user._id);
    if (!userotprecord) {
      return res.status(404).json({
        status: "error",
        message: "User has already been verified please login",
      });
    } else {
      const hashedotp = userotprecord.otp;
      const expiresat = userotprecord.expiresat;
      if (expiresat < Date.now()) {
        await otpServices.deleteUserOtpsByUserId(user._id);
        return res.status(404).json({
          status: "error",
          message: "OTP has expired",
        });
      } else {
        const validotp = await bcrypt.compare(otp, hashedotp);
        if (!validotp) {
          return res.status(404).json({
            status: "error",
            message: "Invalid OTP",
          });
        }
        await userServices.updateUserByOne(user._id);
        await otpServices.deleteUserOtpsByUserId(user._id);
        logger.info(`Email successfully verified for ${email}`);
        return res.status(200).json({
          status: "success",
          message: "User email verified successfully",
        });
      }
    }
  } catch (err) {
    logger.error("Authentication/Verify:", err);
    next(err);
  }
};

const resendOTPCode = async (req, res, next) => {
  try {
    let { email } = req.body;
    const user = await userServices.findUserByOne("email", email);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User has no records",
      });
    }
    await otpServices.deleteUserOtpsByUserId(user._id);
    let otp = await otpServices.createUserOtp(user._id);
    await emailServices.sendOtpEmail(user.email, otp);
    logger.info(`Email sent to ${user._id}`);
    return res.status(200).json({
      status: "success",
      message: "OTP sent successfully",
      data: { email },
    });
  } catch (err) {
    logger.error("Authentication/Verify:", err);
    next(err);
  }
};

// Login User
const login = async (req, res, next) => {
  const { username, password } = req.body;
  try {
    const user = await userServices.findUserByOne("username", username);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({
        status: "error",
        message: "Invalid credentials",
      });
    }
    if (!user.verified) {
      return res.status(400).json({
        status: "error",
        message: "User not verified",
      });
    }
    if (user.token) {
      return res.status(403).json({
        status: "error",
        message: "You already have an active session. Please logout first.",
      });
    }
    logger.info(`User ${user.username} has been successfully signed in.`);
    const token = jwt.sign({ userId: user._id }, config.SECRET, {
      expiresIn: "3h",
    });
    const refreshtoken = jwt.sign({ userId: user._id }, config.SECRET, {
      expiresIn: "7h",
    });
    user.token = token;
    await user.save();
    return res.status(200).json({
      status: "success",
      message: "user signed in successfully",
      data: [
        { token: token },
        { refreshtoken: refreshtoken },
        { username: user.username },
        { email: user.email },
        { setup: user.setup },
      ],
    });
  } catch (err) {
    logger.error("Authentication/Verify:", err);
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await userServices.findUserByOne("email", email);
    if (user) {
      user.verified = false;
      await user.save();
      logger.info(`Send token to reset password to ${user._id}`);
      await otpServices.deleteUserOtpsByUserId(user._id);
      let otp = await otpServices.createUserOtp(user._id);
      await emailServices.sendOtpEmail(user.email, otp);
      return res.status(200).json({
        status: "success",
        message: "OTP sent successfully",
        data: { email },
      });
    } else {
      const error = new Error("Email Does Not Exist");
      error.status = 404;
      throw error;
    }
  } catch (err) {
    logger.error("Authentication/forgotPassword:", err);
    next(err);
  }
};

//new password
const newPassword = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userServices.findUserByOne("email", email);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }
    if (!user.verified) {
      return res.status(404).json({
        status: "error",
        message: "Invalid user route",
      });
    }
    user.password = password;
    await user.save();
    return res.status(200).json({
      status: "success",
      message: "password successfully changed",
    });
  } catch (err) {
    logger.error("Authentication/forgotPassword:", err);
    next(err);
  }
};

//setting up user
const setup = async (req, res, next) => {
  var suc = 0;
  const reminders = req.body.times;
  try {
    for (const time of reminders) {
      let hourmins = await remainderBots.timeSplitter(time);
      await reminderServices.createReminder(
        req.userId,
        hourmins[0],
        hourmins[1]
      );
      suc += 1;
    }
    const user = await userServices.findUserByOne("_id", req.userId);
    user.setup = true;
    await user.save();
    return res.status(200).json({
      status: "success",
      message: `${suc} remainders successfully created`,
    });
  } catch (err) {
    logger.error("user/setup: ", err);
    next(err);
  }
};

//change personal settings
const personalinfo = async (req, res) => {
  try {
    const user = await userServices.findUserByOne("_id", req.userId);
    return res.status(200).json({
      status: "success",
      message: "User data successfully retrieved",
      data: [
        { fullname: user.fullname },
        { username: user.username },
        { email: user.email },
        { phonenumber: user.phonenumber },
        { verified: user.verified },
        { profilePicture: user.profilePicture },
      ],
    });
  } catch (err) {
    logger.error("Settings/personalinfo: ", err);
    next(err);
  }
};

const profilePicture = async (req, res) => {
  try {
    const user = await userServices.findUserByOne("_id", req.userId);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }
    user.profilePicture = req.file.path; // Cloudinary file path
    await user.save();
    res.status(200).json({
      status: "success",
      message: "Profile picture successfully uploaded",
      data: {
        profilePicture: user.profilePicture,
      },
    });
  } catch (err) {
    logger.error("Settings/profilePicture: ", err);
    if (err.status != 500) {
      err.status = 500;
    }
    next(err);
  }
};

const personalinfopost = async (req, res, next) => {
  const { fullname, username, phonenumber } = req.body;
  try {
    let user = await userServices.findUserByOne("_id", req.userId);
    let usersname = await userServices.findUserByOne("username", username);
    if (usersname && !(usersname.username == user.username)) {
      return res.status(400).json({
        status: "error",
        message: "Username is already taken",
      });
    }
    let userphone = await userServices.findUserByOne("phonenumber", phonenumber);
    if (userphone && !(usersname.phonenumber == user.phonenumber)) {
      return res.status(400).json({
        status: "error",
        message: "Phonenumber is already taken",
      });
    }    
    user.fullname = fullname || user.fullname;
    user.username = username || user.username;
    user.phonenumber = phonenumber || user.phonenumber;
    await user.save();
    return res.status(200).json({
      status: "success",
      message: "User details successfully edited",
    });
  } catch (err) {
    logger.error("user/setup: ", err);
    next(err);
  }
};

const changepassword = async (req, res) => {
  const { oldpassword, password } = req.body;
  try {
    const user = await userServices.findUserByOne("_id", req.userId);
    if (!user || !(await bcrypt.compare(oldpassword, user.password))) {
      return res.status(400).json({
        status: "error",
        message: "old password invalid",
      });
    }
    user.password = password;
    await user.save();
    logger.info(`User ${user.username} has successfully changed password.`);
    return res.status(200).json({
      status: "success",
      message: "Password successfuly changed",
    });
  } catch (err) {
    logger.error("user/changepassword: ", err);
    next(err);
  }
};

const changeemail = async (req, res) => {
  const { email } = req.body;
  try {
    let user = await userServices.findUserByOne("email", email);
    if (user) {
      return res.status(400).json({
        status: "error",
        message: "Email already exists",
      });
    }
    user = await userServices.findUserByOne("_id", req.userId);
    user.verified = false;
    user.email = email;
    await user.save();
    await otpServices.deleteUserOtpsByUserId(user._id);
    let otp = await otpServices.createUserOtp(user._id);
    await emailServices.sendOtpEmail(email, otp);
    return res.status(200).json({
      status: "success",
      message: "OTP successfully sent",
      data: { email },
    });
  } catch (err) {
    logger.error("user/changeemail: ", err);
    next(err);
  }
};

const changeemailverify = async (req, res) => {
  const { otp } = req.body;
  try {
    const userotprecord = await otpServices.findUserOtpByUserId(req.userId);
    if (!userotprecord) {
      return res.status(404).json({
        status: "error",
        message: "Restricted access to user",
      });
    }
    const hashedotp = userotprecord.otp;
    const expiresat = userotprecord.expiresat;
    if (expiresat < Date.now()) {
      await otpServices.deleteUserOtpsByUserId(req.userId);
      return res.status(404).json({
        status: "error",
        message: "OTP has expired",
      });
    }
    const validotp = await bcrypt.compare(otp, hashedotp);
    if (!validotp) {
      return res.status(404).json({
        status: "error",
        message: "Invalid OTP",
      });
    }
    await userServices.updateUserByOne(req.userId);
    await otpServices.deleteUserOtpsByUserId(req.userId);
    return res.status(200).json({
      status: "success",
      message: "User email verified successfully",
    });
  } catch (err) {
    logger.error("user/changeemail/verify: ", err);
    next(err);
  }
};

const logout = async (req, res) => {
  try {
    const user = await userServices.findUserByOne("_id", req.userId);
    return res.status(200).json({
      status: "success",
      message: "User successfully logged out",
    });
  } catch (err) {
    logger.error("user/logout: ", err);
    next(err);
  }
};

module.exports = {
  signup,
  verify,
  resendOTPCode,
  login,
  forgotPassword,
  logout,
  newPassword,
  setup,
  personalinfo,
  profilePicture,
  personalinfopost,
  changepassword,
  changeemail,
  changeemailverify,
};
