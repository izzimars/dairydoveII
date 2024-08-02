const express = require("express");
const validate = require("../utils/validate");
const schema = require("../schema/validationschema");
const userController = require("../controllers/usercontroller");
const whatsappController = require("../controllers/whatsappControllers");
const userrouter = express.Router();
const middleware = require("../utils/middleware");
const upload = require("../utils/cloudinary");

userrouter.post(
  "/signup",
  validate(schema.signupSchema, "body"),
  userController.signup
);

userrouter.post(
  "/sendphoneOTP",
  validate(schema.sendPhoneOTPSchema, "body"),
  middleware.verifyToken,
  whatsappController.sendOTP
);

userrouter.post(
  "/verifyOTP",
  validate(schema.verifyOTPSchema, "body"),
  userController.verify
);

userrouter.post(
  "/verifyPhoneOTP",
  validate(schema.changeVerifySchema),
  middleware.verifyToken,
  whatsappController.changephonenumberverify
);

userrouter.post(
  "/resendOTPCode",
  validate(schema.resendOTPSchema),
  userController.resendOTPCode
);

userrouter.post(
  "/resendphoneOTP",
  validate(schema.resendPhoneOTPSchema),
  middleware.verifyToken,
  whatsappController.sendOTP
);

userrouter.post("/login", validate(schema.loginSchema), userController.login);

userrouter.post(
  "/forgotpassword",
  validate(schema.forgotPasswordSchema),
  userController.forgotPassword
);

userrouter.post(
  "/newpassword/",
  validate(schema.newPasswordSchema),
  userController.newPassword
);

userrouter.post(
  "/setup",
  validate(schema.timeSchema),
  middleware.verifyToken,
  userController.setup
);

userrouter.get(
  "/personalinfo",
  middleware.verifyToken,
  userController.personalinfo
);

userrouter.post(
  "/uploadProfilePicture",
  middleware.verifyToken,
  upload.single("profilePicture"),
  userController.profilePicture
);

userrouter.delete(
  "/profilePicture",
  middleware.verifyToken,
  userController.profilePictureDelete
);

userrouter.post(
  "/personalinfo",
  validate(schema.personalInfoSchema),
  middleware.verifyToken,
  userController.personalinfopost
);

userrouter.post(
  "/personalinfo/changepassword",
  validate(schema.setupPasswdSchema),
  middleware.verifyToken,
  userController.changepassword
);

userrouter.post(
  "/personalinfo/changeemail",
  validate(schema.changeemailSchema),
  middleware.verifyToken,
  userController.changeemail
);

userrouter.post(
  "/personalinfo/changephonenumber",
  validate(schema.changePhonenumberSchema),
  middleware.verifyToken,
  whatsappController.changephonenumber
);

userrouter.post(
  "/personalinfo/changeemail/verify",
  validate(schema.changeVerifySchema),
  middleware.verifyToken,
  userController.changeemailverify
);

userrouter.post(
  "/personalinfo/changephonenumber/verify",
  validate(schema.changeVerifySchema),
  middleware.verifyToken,
  whatsappController.changephonenumberverify
);

userrouter.post("/logout", middleware.verifyToken, userController.logout);

module.exports = userrouter;
