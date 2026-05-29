// utils/googleClient.js
import { OAuth2Client } from "google-auth-library";

const googleClientId = process.env.GOOGLE_CLIENT_ID;

if (!googleClientId) {
  // Warn loudly, but don't throw at import time — that would crash the whole
  // server. The googleAuth controller returns a clean 500 when it's missing.
  console.warn("⚠️  GOOGLE_CLIENT_ID is not set — Google sign-in will fail.");
}

export const client = new OAuth2Client(googleClientId);
