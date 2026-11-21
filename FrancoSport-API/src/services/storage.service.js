/**
 * Storage Service
 * Franco Sport E-Commerce
 *
 * The only place that talks to Cloudinary for uploads and deletes. Tests mock
 * this module so no real account is ever reached.
 */

import { cloudinary, PROJECT_FOLDER } from '../config/cloudinary.js';

const TRANSFORMATION = [
  {
    width: 1000,
    height: 1000,
    crop: 'limit',
    quality: 'auto:good',
    fetch_format: 'auto',
  },
];

/**
 * Upload an in-memory image to a Cloudinary folder
 * @returns {Promise<{url: string, public_id: string, width: number, height: number, format: string, bytes: number}>}
 */
export const uploadImageBuffer = (buffer, { folder = `${PROJECT_FOLDER}/products` } = {}) =>
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
 * Delete an image by public id
 * @returns {Promise<{result: string}>} Cloudinary answer; `result` is 'ok' when deleted
 */
export const deleteStoredImage = (publicId) => cloudinary.v2.uploader.destroy(publicId);
