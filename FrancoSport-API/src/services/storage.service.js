/**
 * Storage Service
 * Franco Sport E-Commerce
 *
 * The only place that talks to Cloudinary for uploads and deletes. Tests mock
 * this module so no real account is ever reached.
 *
 * With STORAGE_DRIVER=local (development only, refused in production) images are
 * saved on this machine instead; see config/cloudinary.js.
 */

import {
  cloudinary,
  PROJECT_FOLDER,
  resolveStorageDriver,
  saveLocalImage,
  deleteLocalImage,
} from '../config/cloudinary.js';

const TRANSFORMATION = [
  {
    width: 1000,
    height: 1000,
    crop: 'limit',
    quality: 'auto:good',
    fetch_format: 'auto',
  },
];

const uploadToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: TRANSFORMATION,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );
    stream.end(buffer);
  });

/**
 * Upload an in-memory image to a Cloudinary folder (or to the local folder with STORAGE_DRIVER=local)
 * @returns {Promise<{url: string, public_id: string, width: number|null, height: number|null, format: string, bytes: number}>}
 */
export const uploadImageBuffer = async (buffer, { folder = `${PROJECT_FOLDER}/products` } = {}) =>
  resolveStorageDriver() === 'local' ? saveLocalImage(buffer, { folder }) : uploadToCloudinary(buffer, folder);

/**
 * Delete an image by public id
 * @returns {Promise<{result: string}>} Cloudinary answer; `result` is 'ok' when deleted
 */
export const deleteStoredImage = async (publicId) =>
  resolveStorageDriver() === 'local' ? deleteLocalImage(publicId) : cloudinary.v2.uploader.destroy(publicId);
