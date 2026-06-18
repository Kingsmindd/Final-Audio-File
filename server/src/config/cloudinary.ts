// Set up cloudnairy for images storing/uploading
// Cloudnairy is a cloud service that  stores and servers images
// Instead of storing images on our server (which would be slow ), we upload them to cloudnairy and store the URL in MongoDB

import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Configure cloudinary with credentials from .env file
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//Upload an image to cloudinary and return the result
// Imagepath can be a file on disk or a base string
export const uploadImage = async (
  imagePath: string,
  folder: string = "audiophile", // Default folder name is cloudinary
) => {
  try {
    const result = await cloudinary.uploader.upload(imagePath, {
      folder, //  Organization images in folders
      resource_type: "image", // Tell cloudinary
    });
    return result;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

//Delete an image from cloudinary using its public  ID
//publicId is returned when you upload (result.public_id)

export const deleteImage = async (publicId: string) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

export default cloudinary;
