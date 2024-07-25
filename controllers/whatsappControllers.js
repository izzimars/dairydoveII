require("express-async-errors");
const otpServices = require("../services/otpservices");
const userServices = require("../services/userService");
const logger = require("../utils/logger");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const remainderBots = require("./reminderbots");
const cloudinary = require("cloudinary").v2;
const reminderServices = require("../services/reminderServices");
const redisService = require("../services/redisService");
const whatsappServices = require('../services/whatsappservices');


//Send OTP
const sendOTP = async (req, res, next) => {
    const {  phonenumber } = req.body;
    try {
      let user = await userServices.findUserByOne("_id", req.userId);
      let userphone = await userServices.findUserByOne("phonenumber", phonenumber);
      if (userphone && !(userphone.phonenumber == user.phonenumber)) {
        return res.status(400).json({
          status: "error",
          message: "Phonenumber is already taken",
        });
      }
      const exist = await whatsappServices.checkWhatapp(phonenumber);
      if (!exist.existsWhatsapp) {
          return res.status(400).json({
            status: "error",
            message: "phonenumber does not have whasapp connected",
          });
      };
      await otpServices.deleteUserOtpsByUserId(req.userId);
      const otp = await otpServices.createUserOtp(req.userId);
      await whatsappServices.sendOtpMessage(phonenumber, otp);
      logger.info("User successfully signed up");
      res.status(200).json({
        status: "PENDING",
        message: "Verification OTP sent",
        data: { phonenumber },
      });
    } catch (err) {
      logger.error("Authentication/SendOtp:", err);
      next(err);
    }
  };


// Verify OTP
const verifyOTP = async (req, res, next) => {
  try {
    let { phonenumber, otp } = req.body;
    const userotprecord = await otpServices.findUserOtpByUserId(req.userId);
    if (!userotprecord) {
      return res.status(404).json({
        status: "error",
        message: "No OTP found for user",
      });
    } else {
      const hashedotp = userotprecord.otp;
      const expiresat = userotprecord.expiresat;
      if (expiresat < Date.now()) {
        await otpServices.deleteUserOtpsByUserId(req.userId);
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
        await userServices.updateUserPhoneByOne(req.userId);
        await otpServices.deleteUserOtpsByUserId(req.userId);
        logger.info(`phonenumber successfully verified for ${phonenumber}`);
        return res.status(200).json({
          status: "success",
          message: "User phonenumber verified successfully",
        });
      }
    }
  } catch (err) {
    logger.error("Authentication/PhoneVerify:", err);
    next(err);
  }
};


// //resend OTP
// const resendOTP = async (req, res, next) => {
//   try {
//     let { phonenumber } = req.body;
//     const user = await userServices.findUserByOne("phonenumber", phonenumber);
//     if (!user) {
//       return res.status(404).json({
//         status: "error",
//         message: "User has no records",
//       });
//     }
//     await otpServices.deleteUserOtpsByUserId(req.userId);
//     let otp = await otpServices.createUserOtp(req.userId);
//     await whatsappServices.sendOtpMessage(phonenumber, otp);
//     logger.info(`OTP sent to ${user._id}`);
//     return res.status(200).json({
//       status: "success",
//       message: "OTP sent successfully",
//       data: { phonenumber },
//     });
//   } catch (err) {
//     logger.error("Authentication/Verify:", err);
//     next(err);
//   }
// };


// change Number
const changephonenumber = async (req, res) => {
  const { phonenumber } = req.body;
  try {
    let user = await userServices.findUserByOne("_id", req.userId);
    let userphone = await userServices.findUserByOne("phonenumber", phonenumber);
    if (userphone && !(userphone.phonenumber == user.phonenumber)) {
      return res.status(400).json({
        status: "error",
        message: "Phonenumber is already taken",
      });
    }
    const exist = await whatsappServices.checkWhatapp(phonenumber);
    if (!exist.existsWhatsapp) {
        return res.status(400).json({
          status: "error",
          message: "phonenumber does not have whasapp connected",
        });
    };
    user.whatsappverified = false;
    user.phonenumber = phonenumber;
    await user.save();
    await otpServices.deleteUserOtpsByUserId(user._id);
    let otp = await otpServices.createUserOtp(user._id);
    await whatsappServices.sendOtpMessage(phonenumber, otp);
    return res.status(200).json({
      status: "success",
      message: "OTP successfully sent",
      data: { phonenumber },
    });
  } catch (err) {
    logger.error("user/changephonenumber: ", err);
    next(err);
  }
};


//Verify changed Number
const changephonenumberverify = async (req, res) => {
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
    await userServices.updateUserPhoneByOne(req.userId);
    await otpServices.deleteUserOtpsByUserId(req.userId);
    return res.status(200).json({
      status: "success",
      message: "User phonenumber verified successfully",
    });
  } catch (err) {
    logger.error("user/changephonenumber/verify: ", err);
    next(err);
  }
};


module.exports = {
    sendOTP,
    verifyOTP,
    changephonenumber,
    changephonenumberverify
}