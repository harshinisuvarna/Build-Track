const passport       = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const User           = require("../models/User");
const safeUser = (user) => ({
  id:           user._id,
  name:         user.name,
  email:        user.email,
  role:         user.role || "User",
  profilePhoto: user.profilePhoto || null,
  provider:     user.provider || "local",
  isActive:     user.isActive,
  createdAt:    user.createdAt,
});

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE — only register if credentials are present in .env
// ─────────────────────────────────────────────────────────────────────────────
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID:     process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:  `${process.env.BACKEND_URL || "http://localhost:5000"}/api/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error("No email returned from Google"), null);

          // 1. Find returning Google user
          let user = await User.findOne({ googleId: profile.id });

          // 2. Email-matched existing user (signed up with password before)
          if (!user) user = await User.findOne({ email });

          if (user) {
            // Attach googleId to existing account if not already set
            if (!user.googleId) { user.googleId = profile.id; await user.save(); }
            return done(null, safeUser(user));
          }

          // 3. Brand new user — create account (no password)
          const newUser = await User.create({
            googleId: profile.id,
            name:     profile.displayName || email.split("@")[0],
            email,
          });
          return done(null, safeUser(newUser));

        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
  if (process.env.NODE_ENV !== "production") console.log("✅ Google OAuth strategy registered");
} else {
  if (process.env.NODE_ENV !== "production") console.log("⚠️  Google OAuth skipped — GOOGLE_CLIENT_ID not set in .env");
}
// Passport requires these even in JWT-only mode (no sessions)
passport.serializeUser((user, done)   => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

module.exports = passport;
