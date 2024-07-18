const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const userServices = require("../services/userService"); // Replace with your User model

passport.use(
  new GoogleStrategy(
    {
      clientID:
        "527503269478-khfbnvbkib0139s2b2dtm22bt53hkeff.apps.googleusercontent.com",
      clientSecret: "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",
      callbackURL: "http://localhost:3000/auth/google/callback",
      //scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Find or create user in your database
        console.log(profile);
        console.log(profile.emails[0].value);
        let user = await userServices.findUserByOne(
          "email",
          profile.emails[0].value
        );
        console.log(user);
        if (!user) {
          user = await userServices.createUser({
            username: profile.displayName,
            fullname: profile.displayName,
            email: profile.emails[0].value,
            password: "default_password", // Provide a default or random password
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
