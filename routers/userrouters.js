const express = require("express");
const validate = require("../utils/validate");
const schema = require("../schema/validationschema");
const userController = require("../controllers/usercontroller");
const userrouter = express.Router();
const middleware = require("../utils/middleware");
const upload = require("../utils/cloudinary");

userrouter.post(
  "/signup",
  validate(schema.signupSchema, "body"),
  userController.signup
);

userrouter.post(
  "/verifyOTP",
  validate(schema.verifyOTPSchema, "body"),
  userController.verify
);

userrouter.post(
  "/resendOTPCode",
  validate(schema.resendOTPSchema),
  userController.resendOTPCode
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
  "/personalinfo/changeemail/verify",
  validate(schema.changeemailVerifySchema),
  middleware.verifyToken,
  userController.changeemailverify
);

userrouter.post("/logout", middleware.verifyToken, userController.logout);

module.exports = userrouter;
