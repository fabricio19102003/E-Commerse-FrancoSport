/**
 * Image public ids
 * Franco Sport E-Commerce
 *
 * Helpers shared by the upload and payment controllers. Kept apart from the
 * storage adapter so they never touch Cloudinary.
 */

import { PROJECT_FOLDER, localStorageEnabled, localPublicBaseUrl } from '../config/cloudinary.js';

// Only this project's folder, no empty or relative segments
export const isProjectPublicId = (publicId) =>
  typeof publicId === 'string' &&
  /^[\w\-. ]+(\/[\w\-. ]+)+$/.test(publicId) &&
  publicId.startsWith(`${PROJECT_FOLDER}/`) &&
  publicId.split('/').every((segment) => segment !== '.' && segment !== '..');

// Local driver (development): `${PUBLIC_API_URL}/uploads/franco-sport/x/y.png` -> franco-sport/x/y
const localPublicId = (url) => {
  try {
    const parsed = new URL(url);
    if (parsed.origin !== new URL(localPublicBaseUrl()).origin) return null;
    const pathname = decodeURIComponent(parsed.pathname);
    if (!pathname.startsWith('/uploads/')) return null;
    const publicId = pathname.slice('/uploads/'.length).replace(/\.[A-Za-z0-9]+$/, '');
    return isProjectPublicId(publicId) ? publicId : null;
  } catch {
    return null;
  }
};

/**
 * Public id of a stored image from its URL, or null when the URL is not an
 * image of this Cloudinary account and project folder (or, with STORAGE_DRIVER=local,
 * of the local /uploads folder of this API)
 * (https://res.cloudinary.com/<cloud>/image/upload/v123/franco-sport/x/y.png -> franco-sport/x/y).
 * Only https URLs of res.cloudinary.com for the configured cloud count: older
 * orders may hold a client-supplied URL, which must never lead to a delete.
 */
export const projectPublicIdFromUrl = (url) => {
  if (typeof url === 'string' && localStorageEnabled()) {
    const localId = localPublicId(url);
    if (localId) return localId;
  }
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  if (typeof url !== 'string' || !cloud) return null;
  let parsed;
  let pathname;
  try {
    parsed = new URL(url);
    pathname = decodeURIComponent(parsed.pathname);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'res.cloudinary.com') return null;
  const prefix = `/${cloud}/image/upload/`;
  if (!pathname.startsWith(prefix)) return null;
  const rest = pathname.slice(prefix.length).replace(/^v\d+\//, '');
  if (!rest.startsWith(`${PROJECT_FOLDER}/`)) return null;
  const publicId = rest.replace(/\.[A-Za-z0-9]+$/, '');
  return isProjectPublicId(publicId) ? publicId : null;
};
