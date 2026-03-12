import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';

dotenv.config();

const s3Client = new S3Client({
    region: process.env.AWS_REGION as string,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY as string,
        secretAccessKey: process.env.AWS_SECRET_KEY as string,
    },
});

/**
 * Upload file buffer to AWS S3
 * @param fileBuffer File buffer
 * @param folder S3 folder name (prefix)
 * @param fileName Original file name or generated name
 * @param mimeType File mime type
 */
export const uploadToS3 = async (fileBuffer: Buffer, folder: string, fileName: string, mimeType: string): Promise<string> => {
    const key = `ideco/${folder}/${Date.now()}-${fileName.replace(/\s+/g, '-')}`;
    const bucketName = process.env.AWS_BUCKET as string;

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
    });

    try {
        await s3Client.send(command);
        // Standard S3 URL
        return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    } catch (error) {
        console.error('S3 Upload Error:', error);
        throw error;
    }
};
