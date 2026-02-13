// utils/googleClient.js
import { OAuth2Client } from "google-auth-library";

const googleClientId = process.env.GOOGLE_CLIENT_ID;

if (!googleClientId) {
  // Fail fast so OAuth issues are obvious in dev/prod logs.
  throw new Error("Missing env var GOOGLE_CLIENT_ID");
}

export const client = new OAuth2Client(googleClientId);
