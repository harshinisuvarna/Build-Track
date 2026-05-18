const User = require("../models/User");

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) {
      user.name = name.trim();
    }
    if (email) {
      user.email = email.trim().toLowerCase();
    }

    await user.save();

    return res.status(200).json(user);
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  updateProfile,
};
