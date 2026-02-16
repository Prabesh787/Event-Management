import {
  cloudinary,
  configureCloudinaryFromEnv,
  isCloudinaryConfigured,
} from "../config/cloudinary.js";

const BASE_FOLDER = "eventManagement";

/**
 * Sanitize a name for use in Cloudinary folder path (no spaces, no special chars).
 */
function sanitizeFolderName(name) {
  if (!name || typeof name !== "string") return "unknown";
  return name
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 80) || "unknown";
}

/**
 * Upload user profile image to eventManagement/user/[user_name]
 * @param {string} userName - User's name (used for folder)
 * @param {string|Buffer|object} source - Base64 data URI (e.g. "data:image/png;base64,..."), Buffer, or { buffer, mimetype }
 * @returns {Promise<{ url: string, publicId: string }|null>}
 */
export async function uploadUserProfileImage(userName, source) {
  if (!isCloudinaryConfigured()) return null;
  const folder = `${BASE_FOLDER}/user/${sanitizeFolderName(userName)}`;
  return uploadImage(source, folder);
}

/**
 * Upload event banner image to eventManagement/events/[event_name]
 * @param {string} eventName - Event title (used for folder)
 * @param {string|Buffer|object} source - Base64 data URI, Buffer, or { buffer, mimetype }
 * @returns {Promise<{ url: string, publicId: string }|null>}
 */
export async function uploadEventBannerImage(eventName, source) {
  if (!isCloudinaryConfigured()) return null;
  const folder = `${BASE_FOLDER}/events/${sanitizeFolderName(eventName)}`;
  return uploadImage(source, folder);
}

/**
 * Generic image upload to Cloudinary.
 * @param {string|Buffer|object} source - Base64 data URI, Buffer, or { buffer, mimetype }
 * @param {string} folder - Cloudinary folder path
 */
async function uploadImage(source, folder) {
  try {
    // Ensure Cloudinary is configured after dotenv has loaded env vars.
    configureCloudinaryFromEnv();

    let uploadSource = source;
    let options = { folder, resource_type: "image" };

    if (Buffer.isBuffer(source)) {
      uploadSource = `data:image/jpeg;base64,${source.toString("base64")}`;
    } else if (source && typeof source === "object" && source.buffer) {
      const mime = source.mimetype || "image/jpeg";
      uploadSource = `data:${mime};base64,${source.buffer.toString("base64")}`;
    }

    if (typeof uploadSource !== "string") {
      console.warn("[Cloudinary] Unsupported upload source type");
      return null;
    }

    const result = await cloudinary.uploader.upload(uploadSource, options);
    return { url: result.secure_url, publicId: result.public_id };
  } catch (err) {
    console.error("[Cloudinary] Upload error:", err.message);
    return null;
  }
}

/**
 * Delete an image by public_id (optional, for cleanup).
 */
export async function deleteByPublicId(publicId) {
  if (!isCloudinaryConfigured()) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch (err) {
    console.error("[Cloudinary] Delete error:", err.message);
  }
}
