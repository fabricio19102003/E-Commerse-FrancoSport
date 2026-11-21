import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api, images, createUser } from './helpers.js';
import * as storage from '../src/services/storage.service.js';

// Only the storage adapter is mocked: Cloudinary is never reached
vi.mock('../src/services/storage.service.js', () => {
  let n = 0;
  return {
    uploadImageBuffer: vi.fn(async (buffer, { folder }) => ({
      url: `https://cdn.test/${folder}/img-${++n}.png`,
      public_id: `${folder}/img-${n}`,
      width: 1,
      height: 1,
      format: 'png',
      bytes: buffer.length,
    })),
    deleteStoredImage: vi.fn(async () => ({ result: 'ok' })),
  };
});

const FORBIDDEN = 'Acceso denegado. Se requieren permisos de administrador.';

describe('generic upload routes are admin only', () => {
  let admin;
  let customer;

  beforeEach(async () => {
    vi.clearAllMocks();
    admin = await createUser({ role: 'ADMIN' });
    customer = await createUser();
  });

  it.each([
    ['/api/upload/image', 'image'],
    ['/api/upload/images', 'images'],
  ])('a customer gets 403 on POST %s and nothing is stored', async (path, field) => {
    const res = await api.upload(path, customer.token, field, [images.png()]);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(res.body.error.message).toBe(FORBIDDEN);
    expect(storage.uploadImageBuffer).not.toHaveBeenCalled();
  });

  it.each([
    ['/api/upload/image', 'image'],
    ['/api/upload/images', 'images'],
  ])('a guest gets 401 on POST %s and nothing is stored', async (path, field) => {
    const res = await api.upload(path, null, field, [images.png()]);
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('No se proporcionó token de autenticación');
    expect(storage.uploadImageBuffer).not.toHaveBeenCalled();
  });

  it('a customer and a guest get the same answers on DELETE and nothing is deleted', async () => {
    const asCustomer = await api.delete('/api/upload/image/franco-sport/products/x', customer.token);
    expect(asCustomer.status).toBe(403);
    expect(asCustomer.body.error.message).toBe(FORBIDDEN);
    const asGuest = await api.delete('/api/upload/image/franco-sport/products/x', null);
    expect(asGuest.status).toBe(401);
    expect(storage.deleteStoredImage).not.toHaveBeenCalled();
  });

  it('an admin still uploads one image (png, jpeg, webp)', async () => {
    for (const make of [images.png, images.jpeg, images.webp]) {
      const res = await api.upload('/api/upload/image', admin.token, 'image', [make()]);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Imagen subida exitosamente');
      expect(res.body.data.url).toMatch(/^https:\/\/cdn\.test\/franco-sport\/products\//);
      expect(res.body.data.public_id).toMatch(/^franco-sport\/products\//);
    }
    expect(storage.uploadImageBuffer).toHaveBeenCalledTimes(3);
  });

  it('an admin still uploads several images', async () => {
    const res = await api.upload('/api/upload/images', admin.token, 'images', [images.png(), images.jpeg()]);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('2 imágenes subidas exitosamente');
    expect(res.body.data).toHaveLength(2);
  });

  it('an admin upload without a file is rejected with the existing message', async () => {
    const res = await api.post('/api/upload/image', admin.token, {});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('NO_FILE');
    expect(res.body.error.message).toBe('No se ha enviado ningún archivo');
  });

  it('rejects text renamed .png (real content is checked)', async () => {
    const res = await api.upload('/api/upload/image', admin.token, 'image', [images.fakePng()]);
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('El archivo no es una imagen válida. Solo se permiten imágenes JPG, PNG y WEBP.');
    expect(storage.uploadImageBuffer).not.toHaveBeenCalled();
  });

  it('rejects files that are not jpg/png/webp (text, gif)', async () => {
    for (const make of [images.text, images.gif]) {
      const res = await api.upload('/api/upload/image', admin.token, 'image', [make()]);
      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Tipo de archivo no permitido. Solo se permiten imágenes JPG, PNG y WEBP.');
    }
    expect(storage.uploadImageBuffer).not.toHaveBeenCalled();
  });

  it('rejects images over 5 MB', async () => {
    const res = await api.upload('/api/upload/image', admin.token, 'image', [images.oversizePng()]);
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('La imagen no puede superar los 5 MB');
    expect(storage.uploadImageBuffer).not.toHaveBeenCalled();
  });
});

describe('admin image delete', () => {
  let admin;

  beforeEach(async () => {
    vi.clearAllMocks();
    admin = await createUser({ role: 'ADMIN' });
  });

  it('deletes a public id that contains slashes', async () => {
    const res = await api.delete('/api/upload/image/franco-sport/products/x', admin.token);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Imagen eliminada exitosamente');
    expect(storage.deleteStoredImage).toHaveBeenCalledWith('franco-sport/products/x');
  });

  it('deletes a url-encoded public id', async () => {
    const res = await api.delete('/api/upload/image/franco-sport%2Fproducts%2Fx', admin.token);
    expect(res.status).toBe(200);
    expect(storage.deleteStoredImage).toHaveBeenCalledWith('franco-sport/products/x');
  });

  it.each([
    ['another folder', 'otra-cuenta/products/x'],
    ['no folder', 'x'],
    ['a look-alike folder', 'franco-sport-evil/x'],
    ['path traversal', 'franco-sport/%2e%2e/otra/x'],
    ['an empty segment', 'franco-sport//x'],
  ])('rejects %s and deletes nothing', async (_name, publicId) => {
    const res = await api.delete(`/api/upload/image/${publicId}`, admin.token);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_PUBLIC_ID');
    expect(res.body.error.message).toBe('Identificador de imagen inválido');
    expect(storage.deleteStoredImage).not.toHaveBeenCalled();
  });

  it('answers 404 when the image does not exist', async () => {
    storage.deleteStoredImage.mockResolvedValueOnce({ result: 'not found' });
    const res = await api.delete('/api/upload/image/franco-sport/products/missing', admin.token);
    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Imagen no encontrada');
  });
});
