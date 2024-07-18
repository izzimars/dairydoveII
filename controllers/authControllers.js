const passport = require("passport");
const config = require("../utils/config");

const googleAuth = passport.authenticate("google", {
  scope: ["https://www.googleapis.com/auth/userinfo.email"],
});
//https://www.googleapis.com/auth/userinfo.profile
//https://www.googleapis.com/auth/plus.login
// Handle callback after Google has authenticated the user
const googleAuthCallback = async (req, res, next) => {
  try {
    passport.authenticate("google", { session: false }, async (err, user) => {
      console.log(user);
      console.log(err);
      if (err || !user) {
        return res.status(401).json({
          status: "error",
          message: "Authentication failed",
        });
      }
      const token = jwt.sign({ id: user._id }, config.SECRET, {
        expiresIn: "3h",
      });
      // Send the token, email, and username as response
      res.status(200).json({
        status: "success",
        token,
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
