import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm, access, writeFile, mkdir, readFile } from 'node:fs/promises';
import express from 'express';
import request from 'supertest';
import { images, prisma, createContext, createOrderRecord, createUser } from './helpers.js';
import { createApp } from '../src/app.js';
import { resolveStorageDriver, saveLocalImage, upload } from '../src/config/cloudinary.js';
import { projectPublicIdFromUrl } from '../src/utils/imageIds.js';
import * as storage from '../src/services/storage.service.js';

const BASE = 'http://api.test:3101';
const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const INVALID_IMAGE = 'El archivo no es una imagen válida. Solo se permiten imágenes JPG, PNG y WEBP.';

let dir;
const exists = (file) => access(file).then(() => true, () => false);
const attach = (req, file, field = 'image') =>
  req.attach(field, file.buffer, { filename: file.filename, contentType: file.contentType });
const uploadProof = (app, ctx, orderId, file = images.png()) =>
  attach(request(app).post(`/api/payment/proof/${orderId}`).set('Authorization', `Bearer ${ctx.token}`), file);

beforeEach(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), 'fs-uploads-'));
  vi.stubEnv('STORAGE_DRIVER', 'local');
  vi.stubEnv('STORAGE_LOCAL_DIR', dir);
  vi.stubEnv('PUBLIC_API_URL', `${BASE}/`);
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(dir, { recursive: true, force: true });
});

describe('local storage driver', () => {
  it('saves under the project folder and returns an /uploads URL', async () => {
    const png = images.png();
    const result = await storage.uploadImageBuffer(png.buffer, { folder: 'franco-sport/payment-proofs' });

    expect(result.url).toMatch(new RegExp(`^${BASE}/uploads/franco-sport/payment-proofs/${UUID}\\.png$`));
    expect(result.public_id).toMatch(new RegExp(`^franco-sport/payment-proofs/${UUID}$`));
    expect(result).toMatchObject({ format: 'png', bytes: png.buffer.length });
    expect(await readFile(path.join(dir, `${result.public_id}.png`))).toEqual(png.buffer);
  });

  it('defaults the URL base to http://localhost:<PORT> without PUBLIC_API_URL', async () => {
    vi.stubEnv('PUBLIC_API_URL', '');
    vi.stubEnv('PORT', '3999');
    const result = await storage.uploadImageBuffer(images.webp().buffer);
    expect(result.url).toMatch(new RegExp(`^http://localhost:3999/uploads/franco-sport/products/${UUID}\\.webp$`));
  });

  it('deletes by public id (ok, then not found) and never outside the project folder', async () => {
    const result = await storage.uploadImageBuffer(images.jpeg().buffer);
    const file = path.join(dir, `${result.public_id}.jpg`);
    await mkdir(path.join(dir, 'other'), { recursive: true });
    await writeFile(path.join(dir, 'other', 'x.png'), 'keep');

    expect(await storage.deleteStoredImage(result.public_id)).toEqual({ result: 'ok' });
    expect(await exists(file)).toBe(false);
    for (const id of [result.public_id, 'other/x', 'franco-sport/../other/x']) {
      expect(await storage.deleteStoredImage(id)).toEqual({ result: 'not found' });
    }
    expect(await exists(path.join(dir, 'other', 'x.png'))).toBe(true);
  });

  it('rejects content that is not an image and folders outside the project, saving nothing', async () => {
    await expect(saveLocalImage(images.fakePng().buffer)).rejects.toThrow('no es una imagen válida');
    await expect(saveLocalImage(images.png().buffer, { folder: 'evil/x' })).rejects.toThrow('Carpeta de imágenes no permitida');
    await expect(saveLocalImage(images.png().buffer, { folder: 'franco-sport/../x' })).rejects.toThrow('Carpeta de imágenes no permitida');
    expect(await exists(path.join(dir, 'franco-sport'))).toBe(false);
  });

  it('the multer engine of the legacy routes sets req.file.path to the /uploads URL', async () => {
    const app = express();
    app.post('/x', upload.single('image'), (req, res) => res.json({ path: req.file.path }));

    const res = await attach(request(app).post('/x'), images.png());
    expect(res.status).toBe(200);
    expect(res.body.path).toMatch(new RegExp(`^${BASE}/uploads/franco-sport/products/${UUID}\\.png$`));
  });
});

describe('production refusal', () => {
  it('resolveStorageDriver: cloudinary by default, local in development, error in production or for unknown values', () => {
    expect(resolveStorageDriver({})).toBe('cloudinary');
    expect(resolveStorageDriver({ STORAGE_DRIVER: 'cloudinary', NODE_ENV: 'production' })).toBe('cloudinary');
    expect(resolveStorageDriver({ STORAGE_DRIVER: 'local', NODE_ENV: 'development' })).toBe('local');
    for (const NODE_ENV of ['production', ' Production ']) {
      expect(() => resolveStorageDriver({ STORAGE_DRIVER: 'local', NODE_ENV })).toThrow('development only');
    }
    expect(() => resolveStorageDriver({ STORAGE_DRIVER: 's3' })).toThrow('STORAGE_DRIVER inválido');
  });

  it('the API cannot start with local storage in production, and an upload refuses at first use', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.resetModules();
    await expect(import('../src/config/cloudinary.js')).rejects.toThrow('development only');
    await expect(storage.uploadImageBuffer(images.png().buffer)).rejects.toThrow('development only');
    await expect(storage.deleteStoredImage('franco-sport/products/x')).rejects.toThrow('development only');
    expect(await exists(path.join(dir, 'franco-sport'))).toBe(false);
  });

  it('never serves /uploads in production, even if the driver were set', async () => {
    const result = await storage.uploadImageBuffer(images.png().buffer);
    vi.stubEnv('NODE_ENV', 'production');
    const res = await request(createApp()).get(new URL(result.url).pathname);
    expect(res.status).toBe(404);
  });
});

describe('GET /uploads (real app)', () => {
  let ctx;

  beforeEach(async () => {
    ctx = await createContext();
  });

  it('serves a payment proof uploaded by the customer at the returned URL, with its content type', async () => {
    const app = createApp();
    const order = await createOrderRecord(ctx, { payment_method: 'QR_TRANSFER' });
    const png = images.png();

    const up = await uploadProof(app, ctx, order.id, png);
    expect(up.status).toBe(200);
    const url = up.body.data.payment_proof_url;
    expect(url).toMatch(new RegExp(`^${BASE}/uploads/franco-sport/payment-proofs/${UUID}\\.png$`));
    expect((await prisma.order.findUnique({ where: { id: order.id } })).payment_proof_url).toBe(url);

    const served = await request(app).get(new URL(url).pathname).buffer(true).parse((res, cb) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => cb(null, Buffer.concat(chunks)));
    });
    expect(served.status).toBe(200);
    expect(served.headers['content-type']).toBe('image/png');
    expect(served.body).toEqual(png.buffer);
  });

  it('replacing a proof deletes the previous local file', async () => {
    const app = createApp();
    const order = await createOrderRecord(ctx, { payment_method: 'BANK_TRANSFER' });
    const first = (await uploadProof(app, ctx, order.id)).body.data.payment_proof_url;
    const firstFile = path.join(dir, `${projectPublicIdFromUrl(first)}.png`);
    expect(await exists(firstFile)).toBe(true);

    const second = (await uploadProof(app, ctx, order.id, images.jpeg())).body.data.payment_proof_url;
    expect(second).not.toBe(first);
    await vi.waitFor(async () => expect(await exists(firstFile)).toBe(false));
    expect((await request(app).get(new URL(second).pathname)).status).toBe(200);
  });

  it('does not serve parent paths, encoded traversal, dotfiles or directory listings', async () => {
    const app = createApp();
    const result = await storage.uploadImageBuffer(images.png().buffer, { folder: 'franco-sport/payment-proofs' });
    await writeFile(path.join(dir, '.secreto.png'), 'CONTENIDO-PRIVADO-1');
    await writeFile(path.join(path.dirname(dir), 'fuera.txt'), 'CONTENIDO-PRIVADO-2');

    for (const url of [
      '/uploads/../fuera.txt',
      '/uploads/%2e%2e/fuera.txt',
      '/uploads/..%2ffuera.txt',
      '/uploads/franco-sport/..%2f..%2ffuera.txt',
      '/uploads/.secreto.png',
      '/uploads/franco-sport/payment-proofs/',
      '/uploads/franco-sport/payment-proofs',
      '/uploads/',
    ]) {
      const res = await request(app).get(url);
      expect(res.status, url).not.toBe(200);
      expect(res.text ?? '', url).not.toMatch(/CONTENIDO-PRIVADO/);
    }
    await rm(path.join(path.dirname(dir), 'fuera.txt'), { force: true });
    expect((await request(app).get(new URL(result.url).pathname)).status).toBe(200);
  });

  it('the route does not exist when the driver is cloudinary (default)', async () => {
    const result = await storage.uploadImageBuffer(images.png().buffer);
    vi.stubEnv('STORAGE_DRIVER', '');
    const res = await request(createApp()).get(new URL(result.url).pathname);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('projectPublicIdFromUrl with the local driver', () => {
  it('recognises the /uploads URLs of this API in the project folder', () => {
    expect(projectPublicIdFromUrl(`${BASE}/uploads/franco-sport/payment-proofs/abc.png`)).toBe('franco-sport/payment-proofs/abc');
  });

  it('ignores other hosts, other folders and traversal', () => {
    for (const url of [
      'http://evil.example.com/uploads/franco-sport/payment-proofs/abc.png',
      `${BASE}/uploads/other/abc.png`,
      `${BASE}/uploads/franco-sport/../abc.png`,
      `${BASE}/uploads/franco-sport/%2e%2e/abc.png`,
      `${BASE}/otra/franco-sport/payment-proofs/abc.png`,
      'no es una url',
    ]) {
      expect(projectPublicIdFromUrl(url), url).toBeNull();
    }
    expect(projectPublicIdFromUrl(undefined)).toBeNull();
  });

  it('ignores local URLs when the driver is cloudinary', () => {
    vi.stubEnv('STORAGE_DRIVER', '');
    expect(projectPublicIdFromUrl(`${BASE}/uploads/franco-sport/payment-proofs/abc.png`)).toBeNull();
  });
});

describe('legacy multer routes with the local driver (admin brands)', () => {
  let admin;
  const slugs = [];

  beforeEach(async () => {
    admin = await createUser({ role: 'ADMIN' });
  });
  afterEach(async () => {
    await prisma.brand.deleteMany({ where: { slug: { in: slugs.splice(0) } } });
  });

  const createBrand = (app, file, slug) => {
    slugs.push(slug);
    return attach(
      request(app).post('/api/admin/brands').set('Authorization', `Bearer ${admin.token}`).field('name', 'Marca Demo').field('slug', slug),
      file,
    );
  };

  it('stores a real image and saves its /uploads URL as the brand logo', async () => {
    const res = await createBrand(createApp(), images.png(), 'marca-local-ok');
    expect(res.status).toBe(201);
    expect(res.body.data.logo_url).toMatch(new RegExp(`^${BASE}/uploads/franco-sport/products/${UUID}\\.png$`));
    expect(await exists(path.join(dir, `${projectPublicIdFromUrl(res.body.data.logo_url)}.png`))).toBe(true);
  });

  it('answers 400 with the usual Spanish message for a fake PNG, saving nothing and creating no brand', async () => {
    const res = await createBrand(createApp(), images.fakePng(), 'marca-local-falsa');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, error: { code: 'INVALID_IMAGE', message: INVALID_IMAGE } });
    expect(await prisma.brand.count({ where: { slug: 'marca-local-falsa' } })).toBe(0);
    expect(await exists(path.join(dir, 'franco-sport'))).toBe(false);
  });

  it('keeps the previous answer for a wrong file type (cloudinary driver, rejected before any upload)', async () => {
    vi.stubEnv('STORAGE_DRIVER', '');
    const res = await createBrand(createApp(), images.text(), 'marca-tipo-malo');
    expect(res.status).toBe(500);
    expect(res.body.error.message).toBe('Tipo de archivo no permitido. Solo se permiten imágenes JPG, PNG y WEBP.');
    expect(await prisma.brand.count({ where: { slug: 'marca-tipo-malo' } })).toBe(0);
  });
});
