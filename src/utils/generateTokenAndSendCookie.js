import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SCERET, {
    expiresIn: "2d",
  });

  const isProd = process.env.NODE_ENV === "production";

  res.cookie("token", token, {
    httpOnly: true,
    // Render serves over HTTPS in production; sameSite "none" REQUIRES secure:true.
    secure: isProd,
    // Frontend and backend live on different Render domains (cross-site),
    // so the cookie must be "none" in production to be stored/sent at all.
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};
