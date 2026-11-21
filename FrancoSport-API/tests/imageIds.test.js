import { afterEach, describe, expect, it } from 'vitest';
import { projectPublicIdFromUrl } from '../src/utils/imageIds.js';

const original = process.env.CLOUDINARY_CLOUD_NAME;

afterEach(() => {
  process.env.CLOUDINARY_CLOUD_NAME = original;
});

describe('projectPublicIdFromUrl', () => {
  it('returns the public id of an image of this cloud and project folder', () => {
    process.env.CLOUDINARY_CLOUD_NAME = 'francosport';

    expect(
      projectPublicIdFromUrl('https://res.cloudinary.com/francosport/image/upload/v1712/franco-sport/payment-proofs/abc.png'),
    ).toBe('franco-sport/payment-proofs/abc');
  });

  it('ignores URLs of another host or another cloud, even with the project folder in the path', () => {
    process.env.CLOUDINARY_CLOUD_NAME = 'francosport';

    for (const url of [
      'https://evil.example.com/francosport/image/upload/v1/franco-sport/products/shoe.png',
      'https://res.cloudinary.com/othercloud/image/upload/v1/franco-sport/products/shoe.png',
      'http://res.cloudinary.com/francosport/image/upload/v1/franco-sport/products/shoe.png',
      'https://res.cloudinary.com/francosport/raw/upload/v1/franco-sport/products/shoe.png',
    ]) {
      expect(projectPublicIdFromUrl(url), url).toBeNull();
    }
  });

  it('returns null when the cloud name is not configured', () => {
    process.env.CLOUDINARY_CLOUD_NAME = '';

    expect(
      projectPublicIdFromUrl('https://res.cloudinary.com/francosport/image/upload/v1/franco-sport/payment-proofs/abc.png'),
    ).toBeNull();
  });
});
