import { v2 as cloudinary } from "cloudinary";

/**
 * IMPORTANT:
 * In ESM, imports are evaluated before `dotenv.config()` in `server.js` runs.
 * So we must configure Cloudinary lazily at runtime (not at import time).
 */
export function configureCloudinaryFromEnv() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    return true;
  }
  return false;
}

export { cloudinary };
export const isCloudinaryConfigured = () => {
  const hasCloudName = !!process.env.CLOUDINARY_CLOUD_NAME;
  const hasApiKey = !!process.env.CLOUDINARY_API_KEY;
  const hasApiSecret = !!process.env.CLOUDINARY_API_SECRET;
  return hasCloudName && hasApiKey && hasApiSecret;
};
