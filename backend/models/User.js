const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Optional: OAuth users won't have a password
    password: {
      type: String,
      minlength: 6,
      default: null,
      // NOTE: NO select:false here — that was causing matchPassword to see undefined
    },

    // For Google OAuth — ready but not wired yet
    googleId: {
      type: String,
      default: null,
    },

    // For GitHub OAuth — ready but not wired yet
    githubId: {
      type: String,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// ── Hash password before saving ──────────────────────────────────────────────
// Mongoose 7+ async middleware: do NOT call next(), just return or throw
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// ── Compare entered password vs stored hash during login ─────────────────────
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false; // OAuth user — no password set
  return bcrypt.compare(enteredPassword, this.password);
};

// ── Strip password from every JSON response ───────────────────────────────────
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model("User", userSchema);