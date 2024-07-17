const User = require("../models/usermodel");
const logger = require("../utils/logger")


const sendOTPVerificationEmail = async (email, res) => {
  try {
    const user = await User.findOne({ email });
    logger.info("Generating OTP for user ID:", user._id);
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp, salt);
    await userOtpVerification.deleteMany({ userId: user._id });
    logger.info(`Deleted former otp for ${user._id}`);
    const newOTPverification = new userOtpVerification({
      userId: user._id,
      otp: hashedOTP,
      createdat: Date.now(),
      expiredat: Date.now() + 360000,
    });
    await newOTPverification.save();

    

    

    logger.info("OTP sent to:", email);
    res.status(200).json({
      status: "PENDING",
      message: "Verification OTP sent",
      data: { email },
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({
      status: "FAILED",
      message: error.message,
    });
  }
};

module.exports() = {sendOTPVerificationEmail}