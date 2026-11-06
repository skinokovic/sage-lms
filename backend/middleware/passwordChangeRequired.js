import User from "../models/User.js";

export const passwordChangeRequired = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found.",
      });
    }

    if (user.mustChangePassword) {
      return res.status(403).json({
        success: false,
        code: "PASSWORD_CHANGE_REQUIRED",
        message: "You must change your temporary password before continuing.",
      });
    }

    next();
  } catch (error) {
    console.error("PASSWORD CHANGE CHECK ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify account status.",
    });
  }
};
