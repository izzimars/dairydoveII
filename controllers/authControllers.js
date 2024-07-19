const passport = require("passport");
const config = require("../utils/config");
const jwt = require("jsonwebtoken");

const googleAuth = passport.authenticate("google", {
  scope: [
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
  ],
});

const googleAuthCallback = async (req, res, next) => {
  try {
    passport.authenticate("google", { session: false }, async (err, user) => {
      if (err || !user) {
        return res.status(401).json({
          status: "error",
          message: "Authentication failed",
        });
      }
      const token = jwt.sign({ userId: user._id }, config.SECRET, {
        expiresIn: "3h",
      });
      const refreshtoken = jwt.sign({ userId: user._id }, config.SECRET, {
        expiresIn: "7h",
      });
      console.log("Generated Token: ", token);
      // Send the token, email, and username as response
      res.status(200).json({
        status: "success",
        token,
        refreshtoken,
        email: user.email,
        username: user.username,
      });
    })(req, res, next);
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  googleAuth,
  googleAuthCallback,
};
