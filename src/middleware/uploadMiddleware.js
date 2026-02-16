import multer from "multer";

const storage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  const allowed = /image\/(jpeg|jpg|png|gif|webp)/.test(file.mimetype);
  if (allowed) cb(null, true);
  else cb(new Error("Only image files (jpeg, png, gif, webp) are allowed"), false);
};

/** Single file for profile picture: field name "profilePic" */
export const uploadProfilePic = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: imageFilter,
}).single("profilePic");

/** Single file for event banner: field name "bannerImage" */
export const uploadEventBanner = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: imageFilter,
}).single("bannerImage");
