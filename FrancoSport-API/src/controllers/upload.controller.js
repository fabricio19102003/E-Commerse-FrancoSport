/**
 * Upload Controller
 * Franco Sport API
 * 
 * Manejo de upload de imágenes a Cloudinary
 */

import { uploadImageBuffer, deleteStoredImage } from '../services/storage.service.js';
import { PROJECT_FOLDER } from '../config/cloudinary.js';
import { isProjectPublicId } from '../utils/imageIds.js';

const UPLOAD_FOLDER = `${PROJECT_FOLDER}/products`;


/**
 * Upload single image to Cloudinary
 * POST /api/upload/image
 */
export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'No se ha enviado ningún archivo',
        },
      });
    }

    // The middleware already validated the image content; store it now
    const image = await uploadImageBuffer(req.file.buffer, { folder: UPLOAD_FOLDER });
    res.json({
      success: true,
      data: {
        url: image.url,
        public_id: image.public_id,
        width: image.width,
        height: image.height,
        format: image.format,
        size: image.bytes,
      },
      message: 'Imagen subida exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload multiple images to Cloudinary
 * POST /api/upload/images
 */
export const uploadMultipleImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILES',
          message: 'No se han enviado archivos',
        },
      });
    }

    const uploadedImages = [];
    for (const file of req.files) {
      const image = await uploadImageBuffer(file.buffer, { folder: UPLOAD_FOLDER });
      uploadedImages.push({
        url: image.url,
        public_id: image.public_id,
        width: image.width,
        height: image.height,
        format: image.format,
        size: image.bytes,
      });
    }

    res.json({
      success: true,
      data: uploadedImages,
      message: `${uploadedImages.length} imágenes subidas exitosamente`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete image from Cloudinary
 * DELETE /api/upload/image/<public id with slashes>
 */
export const deleteImage = async (req, res, next) => {
  try {
    const publicId = req.params[0];

    if (!isProjectPublicId(publicId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PUBLIC_ID',
          message: 'Identificador de imagen inválido',
        },
      });
    }

    // Delete from Cloudinary
    const result = await deleteStoredImage(publicId);

    if (result.result !== 'ok') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'IMAGE_NOT_FOUND',
          message: 'Imagen no encontrada',
        },
      });
    }

    res.json({
      success: true,
      message: 'Imagen eliminada exitosamente',
    });
  } catch (error) {
    next(error);
  }
};
