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
        return res
          .status(401)
          .redirect(
            `http://diary-dove-frontend.vercel.app/auth/callback?status=error&message=Authentication%20failed`
          );
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

      return res
        .status(200)
        .redirect(
          `http://diary-dove-frontend.vercel.app/auth/callback?authData=${encodeURIComponent(
            authData
          )}`
        );
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
    const errorStatus = "error";
    const errorMessage = encodeURIComponent("Internal Server Error");
    return res
      .status(500)
      .redirect(
        `http://diary-dove-frontend.vercel.app/auth/callback?status=${errorStatus}&message=${errorMessage}`
      );
  }
};

module.exports = {
  googleAuth,
  googleAuthCallback,
};
