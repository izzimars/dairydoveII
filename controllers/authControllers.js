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

      const authData = JSON.stringify({
        token,
        refreshtoken,
        username: user.username,
        email: user.email,
        setup: user.setup,
      });

      return res.redirect(
        `http://diary-dove-frontend.vercel.app/auth/callback?authData=${encodeURIComponent(
          authData
        )}`
      ).status(200);
      // Send the token, email, and username as response
      // return res.status(200).json({
      //   status: "success",
      //   message: "user signed in successfully",
      //   data: [
      //     { token: token },
      //     { refreshtoken: refreshtoken },
      //     { username: user.username },
      //     { email: user.email },
      //     { setup: user.setup },
      //   ],
      // });
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
