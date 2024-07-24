const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const userServices = require("../services/userService"); // Replace with your User model
const config = require("../utils/config");

passport.use(
  new GoogleStrategy(
    {
      clientID: config.CLIENTID,
      clientSecret: config.CLIENTSECRET,
      callbackURL: "https://dairydoveii.onrender.com/auth/google/callback",
      //scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Find or create user in your database
        let user = await userServices.findUserByOne(
          "email",
          profile.emails[0].value
        );
        console.log("email ", profile.emails[0].value);
        if (!user) {
          user = await userServices.createUser({
            username: profile.displayName,
            fullname: profile.displayName,
            email: profile.emails[0].value,
            password: config.CLIENTPASSWORD, // Provide a default or random password
            phonenumber: "0000000000", // Provide a default phone number if needed
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser(async (id, done) => {
  try {
    let user = await userServices.findUserByOne(
      "email",
      profile.emails[0].value
    );
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
