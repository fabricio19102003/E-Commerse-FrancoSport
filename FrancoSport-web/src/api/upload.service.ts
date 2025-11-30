/**
 * Upload Service
 * Franco Sport E-Commerce
 * 
 * Servicio para upload de imágenes
 */

import { api } from './axios';

export interface UploadedImage {
  url: string;
  public_id: string;
  width?: number;
  height?: number;
  format?: string;
  size?: number;
}

/**
 * Upload single image
 */
export const uploadImage = async (file: File): Promise<UploadedImage> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await api.post<{ success: boolean; data: UploadedImage }>(
    '/upload/image',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data.data;
};

/**
 * Upload multiple images
 */
export const uploadMultipleImages = async (files: File[]): Promise<UploadedImage[]> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('images', file);
  });

  const response = await api.post<{ success: boolean; data: UploadedImage[] }>(
    '/upload/images',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data.data;
};

/**
 * Delete image from Cloudinary
 */
export const deleteImage = async (publicId: string): Promise<void> => {
  await api.delete(`/upload/image/${publicId}`);
};
