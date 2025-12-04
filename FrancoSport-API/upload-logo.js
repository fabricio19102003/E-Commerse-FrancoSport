import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadLogo = async () => {
  try {
    const imagePath = path.join('d:', 'Trabajo', 'Repositorios', 'FrancoSport', 'E-Commerse-FrancoSport', 'FrancoSport-web', 'public', 'email-logo.jpg');
    console.log('Uploading...', imagePath);
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: 'franco-sport/assets',
      public_id: 'email-logo-v2',
      overwrite: true,
    });
    console.log('Upload success!');
    console.log('URL:', result.secure_url);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};

uploadLogo();
