/**
 * Image upload middleware
 * Franco Sport E-Commerce
 *
 * Receives images in memory (jpg/png/webp, max 5 MB) and checks the real
 * content (magic bytes), not just the declared type or the file extension.
 * Nothing is sent to Cloudinary here: controllers store the buffer only after
 * every business rule passed.
 */

import multer from 'multer';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ONLY_IMAGES = 'Solo se permiten imágenes JPG, PNG y WEBP.';

/**
 * Detect the real image type from the first bytes; null when it is not jpg/png/webp
 */
export const detectImageType = (buffer) => {
  if (!buffer || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpeg';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buffer.subarray(0, 4).toString('latin1') === 'RIFF' && buffer.subarray(8, 12).toString('latin1') === 'WEBP') {
    return 'webp';
  }
  return null;
};

const badRequest = (res, code, message) =>
  res.status(400).json({ success: false, error: { code, message } });

const multerInstance = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 5 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) return cb(null, true);
    const error = new Error(`Tipo de archivo no permitido. ${ONLY_IMAGES}`);
    error.code = 'INVALID_FILE_TYPE';
    cb(error);
  },
});

const wrap = (handler) => (req, res, next) =>
  handler(req, res, (error) => {
    if (!error) {
      const files = req.file ? [req.file] : req.files || [];
      if (files.some((file) => !detectImageType(file.buffer))) {
        return badRequest(res, 'INVALID_IMAGE', `El archivo no es una imagen válida. ${ONLY_IMAGES}`);
      }
      return next();
    }
    if (error.code === 'LIMIT_FILE_SIZE') return badRequest(res, 'FILE_TOO_LARGE', 'La imagen no puede superar los 5 MB');
    if (error.code === 'INVALID_FILE_TYPE') return badRequest(res, 'INVALID_FILE_TYPE', error.message);
    if (error instanceof multer.MulterError) {
      return badRequest(res, 'INVALID_UPLOAD', 'Archivo no esperado en la solicitud');
    }
    next(error);
  });

/** One image in the multipart field `field` -> req.file */
export const uploadSingleImage = (field) => wrap(multerInstance.single(field));

/** Up to `max` images in the multipart field `field` -> req.files */
export const uploadImages = (field, max = 5) => wrap(multerInstance.array(field, max));
