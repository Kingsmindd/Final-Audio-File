// Sets up multer for handling file uploads (images)
// Multer is a Node.js middleware for handling multiparts/form data/ uploads to thirdparty websites etc
// Instead of saving files to mongo, we use memmory storage and then upload directly to cloudinary

import { Request } from "express";
import multer from "multer";

// memoryStorage keeps the file in RAM as a buffery (binary data)
// This is better than saving to database/disk when we're uploading to cloudinary

const storage = multer.memoryStorage();

// file filter - only allow image files
// This runs for every file upload attempts
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void => {
  // check if the files MIME type starts "image/" e.g "image/jpeg" "image/png", "image/webp"
  if (file.mimetype.startsWith("image/")) {
    cb(null, true); //null = no error, true = accept the file
  } else {
    // reject non-images files
    cb(new Error("Only images files are allowed"));
  }
};

// Create the multer upload instance with our settings
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Max 5mb per file (5 * 1024* 1024 bytes)
  },
});

export default upload;
