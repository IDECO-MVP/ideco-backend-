import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload file to Cloudinary
 * @param filePath Local path of the file
 * @param folder Cloudinary folder name
 */
export const uploadToCloudinary = async (filePath: string, folder: string) => {
    try {
        const timestamp = Math.round(new Date().getTime() / 1000);
        const result = await cloudinary.uploader.upload(filePath, {
            folder: `ideco/${folder}`,
            use_filename: true,
            unique_filename: true,
            timestamp: timestamp,
        });

        // Remove file from local storage after upload
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        return result.secure_url;
    } catch (error) {
        // Clean up local file even on error
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        throw error;
    }
};
