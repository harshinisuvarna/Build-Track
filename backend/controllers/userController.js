const User = require("../models/User");

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;

    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name.trim();
    if (email) user.email = email.trim().toLowerCase();

    await user.save();
    return res.status(200).json({ user });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

//get profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// @desc  Update profile photo
// @route PUT /api/users/profile/photo
const updateProfilePhoto = async (req, res) => {
  console.log('updateProfilePhoto called');
  console.log('req.user:', req.user);
  console.log('body keys:', Object.keys(req.body));
  console.log('profilePhoto length:', req.body.profilePhoto?.length);
  try {
    const { profilePhoto } = req.body;
    if (profilePhoto === undefined) {
      return res.status(400).json({ message: "No photo provided" });
    }

    const updatePhoto = (profilePhoto === null || profilePhoto === "") ? null : profilePhoto;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePhoto: updatePhoto },
      { new: true, runValidators: false }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// PUT /api/users/subscription
const updateSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { plan, status, renewalDate, purchaseToken } = req.body;

    const validPlans = ['free', 'starter', 'growth', 'pro', 'business', 'enterprise'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ message: "Invalid plan" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.subscription = {
      plan:          plan          ?? user.subscription?.plan ?? 'free',
      status:        status        ?? 'active',
      renewalDate:   renewalDate   ? new Date(renewalDate) : null,
      purchaseToken: purchaseToken ?? null,
    };

    await user.save();
    return res.status(200).json({ subscription: user.subscription });
  } catch (error) {
    console.error("Update subscription error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /api/users/subscription
const getSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('subscription');
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ subscription: user.subscription });
  } catch (error) {
    console.error("Get subscription error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { updateProfile, updateSubscription, getSubscription, getProfile ,updateProfilePhoto};