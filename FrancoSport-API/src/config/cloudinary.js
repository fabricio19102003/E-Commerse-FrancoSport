/**
 * Cloudinary Configuration
 * Franco Sport API
 * 
 * Configuración para upload de imágenes
 */

import cloudinary from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectImageType } from '../middleware/imageUpload.js';
import { isProjectPublicId } from '../utils/imageIds.js';

// Every image of this project lives under this folder
export const PROJECT_FOLDER = 'franco-sport';

// ===== Storage driver =====
// 'cloudinary' (default) or 'local' (DEVELOPMENT ONLY: images saved on this machine and served by
// the API under /uploads, so the store can be shown without a Cloudinary account).

/**
 * The storage driver selected by STORAGE_DRIVER. Throws for an unknown value and when `local` is
 * combined with NODE_ENV=production, so a production API can never start with local storage.
 */
export const resolveStorageDriver = (env = process.env) => {
  const driver = env.STORAGE_DRIVER || 'cloudinary';
  if (driver === 'cloudinary') return driver;
  if (driver !== 'local') {
    throw new Error(`STORAGE_DRIVER inválido: "${driver}". Use "cloudinary" o "local".`);
  }
  if (String(env.NODE_ENV).trim().toLowerCase() === 'production') {
    throw new Error('STORAGE_DRIVER=local is for development only and cannot be enabled when NODE_ENV=production.');
  }
  return driver;
};

// Evaluated when the app loads: the API refuses to start with an invalid or forbidden driver
export const STORAGE_DRIVER = resolveStorageDriver();

const INVALID_IMAGE_MESSAGE = 'El archivo no es una imagen válida. Solo se permiten imágenes JPG, PNG y WEBP.';
const API_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const LOCAL_EXTENSIONS = { jpeg: 'jpg', png: 'png', webp: 'webp' };

/** Folder where the local driver keeps the images (STORAGE_LOCAL_DIR, default <api>/storage/uploads) */
export const localUploadsDir = (env = process.env) =>
  path.resolve(env.STORAGE_LOCAL_DIR || path.join(API_ROOT, 'storage', 'uploads'));

/** True only for STORAGE_DRIVER=local outside production (never throws; the checks live in resolveStorageDriver) */
export const localStorageEnabled = (env = process.env) => {
  try {
    return resolveStorageDriver(env) === 'local';
  } catch {
    return false;
  }
};

/** Public base URL of the API, where the local images are served (/uploads) */
export const localPublicBaseUrl = (env = process.env) =>
  (env.PUBLIC_API_URL || `http://localhost:${env.PORT || 3001}`).replace(/\/+$/, '');

/** Absolute path of `<publicId>.<extension>` inside the uploads folder; null when it would escape it */
const localFilePath = (publicId, extension, env) => {
  const root = localUploadsDir(env);
  const file = path.resolve(root, `${publicId}.${extension}`);
  return file.startsWith(root + path.sep) ? file : null;
};

/**
 * Save an in-memory image under the project folder (same result shape as the Cloudinary upload).
 * The file name is random; no resizing is done. Only real jpg/png/webp content is accepted.
 * @returns {Promise<{url: string, public_id: string, width: null, height: null, format: string, bytes: number}>}
 */
export const saveLocalImage = async (buffer, { folder = `${PROJECT_FOLDER}/products` } = {}, env = process.env) => {
  resolveStorageDriver({ ...env, STORAGE_DRIVER: 'local' });
  const type = detectImageType(buffer);
  if (!type) throw new Error('El archivo no es una imagen válida (JPG, PNG o WEBP).');
  if (!isProjectPublicId(`${folder}/x`)) throw new Error(`Carpeta de imágenes no permitida: ${folder}`);

  const extension = LOCAL_EXTENSIONS[type];
  const publicId = `${folder}/${randomUUID()}`;
  const file = localFilePath(publicId, extension, env);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, buffer, { flag: 'wx' });
  return {
    url: `${localPublicBaseUrl(env)}/uploads/${publicId}.${extension}`,
    public_id: publicId,
    width: null,
    height: null,
    format: extension,
    bytes: buffer.length,
  };
};

/**
 * Delete a locally stored image by public id (project folder only)
 * @returns {Promise<{result: string}>} 'ok' when deleted, 'not found' otherwise (as Cloudinary answers)
 */
export const deleteLocalImage = async (publicId, env = process.env) => {
  resolveStorageDriver({ ...env, STORAGE_DRIVER: 'local' });
  if (!isProjectPublicId(publicId)) return { result: 'not found' };
  for (const extension of new Set(Object.values(LOCAL_EXTENSIONS))) {
    try {
      await unlink(localFilePath(publicId, extension, env));
      return { result: 'ok' };
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return { result: 'not found' };
};

// multer storage engine of the local driver: same `req.file.path` (a public URL) as multer-storage-cloudinary
const localDiskStorage = {
  _handleFile(req, file, cb) {
    const chunks = [];
    file.stream.on('data', (chunk) => chunks.push(chunk));
    file.stream.on('error', cb);
    file.stream.on('end', () => {
      const buffer = Buffer.concat(chunks);
      if (!detectImageType(buffer)) {
        const error = new Error(INVALID_IMAGE_MESSAGE);
        error.code = 'INVALID_IMAGE';
        return cb(error);
      }
      saveLocalImage(buffer)
        .then((image) => cb(null, { path: image.url, filename: image.public_id, size: buffer.length }))
        .catch(cb);
    });
  },
  _removeFile(req, file, cb) {
    deleteLocalImage(file.filename).then(() => cb(null), cb);
  },
};

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary Storage for Multer
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: `${PROJECT_FOLDER}/products`,
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      {
        width: 1000,
        height: 1000,
        crop: 'limit',
        quality: 'auto:good',
        fetch_format: 'auto',
      },
    ],
  },
});

// The engine is chosen per upload (Cloudinary unless STORAGE_DRIVER=local in development)
const storage = {
  _handleFile(req, file, cb) {
    (localStorageEnabled() ? localDiskStorage : cloudinaryStorage)._handleFile(req, file, cb);
  },
  _removeFile(req, file, cb) {
    (localStorageEnabled() ? localDiskStorage : cloudinaryStorage)._removeFile(req, file, cb);
  },
};

const multerUpload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes JPG, PNG y WEBP.'));
    }
  },
});

// A file whose content is not an image (local engine) is a 400 with the usual message, not a 500
const answerInvalidImage = (handler) => (req, res, next) =>
  handler(req, res, (error) => {
    if (error?.code === 'INVALID_IMAGE') {
      return res.status(400).json({ success: false, error: { code: 'INVALID_IMAGE', message: error.message } });
    }
    next(error);
  });

// Multer instance for the admin routes that still receive the file through the storage engine
export const upload = {
  single: (field) => answerInvalidImage(multerUpload.single(field)),
  array: (field, max) => answerInvalidImage(multerUpload.array(field, max)),
};

export { cloudinary };
