/**
 * Upload Controller
 * Franco Sport API
 * 
 * Manejo de upload de imágenes a Cloudinary
 */

import { cloudinary } from '../config/cloudinary.js';

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

    // Multer + Cloudinary Storage ya subió el archivo
    // req.file.path contiene la URL de Cloudinary
    res.json({
      success: true,
      data: {
        url: req.file.path,
        public_id: req.file.filename,
        width: req.file.width,
        height: req.file.height,
        format: req.file.format,
        size: req.file.bytes,
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

    const uploadedImages = req.files.map((file) => ({
      url: file.path,
      public_id: file.filename,
      width: file.width,
      height: file.height,
      format: file.format,
      size: file.bytes,
    }));

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
 * DELETE /api/upload/image/:publicId
 */
export const deleteImage = async (req, res, next) => {
  try {
    const { publicId } = req.params;

    // Delete from Cloudinary
    const result = await cloudinary.v2.uploader.destroy(publicId);

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
