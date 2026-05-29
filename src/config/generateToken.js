import jwt from "jsonwebtoken";

const generateToken = (id) => {
  // Use the same secret env var as the live cookie auth (JWT_SCERET).
  return jwt.sign({ id }, process.env.JWT_SCERET, {
    expiresIn: "30d",
  });
};

export default generateToken;
