import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Attaches req.user if a valid access token is present, but never blocks
// the request if it's missing/invalid. Useful for routes that behave
// differently for logged-in users (e.g. showing unpublished courses to
// admins) but are otherwise public.
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.id);
      if (user && user.isActive) req.user = user;
    } catch (error) {
      // ignore invalid token, treat as anonymous
    }
  }
  next();
};

export default optionalAuth;
