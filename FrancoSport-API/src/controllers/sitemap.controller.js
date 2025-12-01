/**
 * Sitemap Controller
 * Franco Sport API
 */

import prisma from '../utils/prisma.js';

export const getSitemap = async (req, res, next) => {
  try {
    const baseUrl = process.env.FRONTEND_URL || 'https://francosport.com';

    // Fetch dynamic data
    const [products, categories] = await Promise.all([
      prisma.product.findMany({ select: { slug: true, updated_at: true } }),
      prisma.category.findMany({ select: { slug: true, updated_at: true } }),
    ]);

    // Static routes
    const staticRoutes = [
      '',
      '/productos',
      '/categorias',
      '/marcas',
      '/login',
      '/registro',
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

    // Add static routes
    staticRoutes.forEach((route) => {
      xml += `
        <url>
          <loc>${baseUrl}${route}</loc>
          <changefreq>weekly</changefreq>
          <priority>0.8</priority>
        </url>`;
    });

    // Add products
    products.forEach((product) => {
      xml += `
        <url>
          <loc>${baseUrl}/producto/${product.slug}</loc>
          <lastmod>${new Date(product.updated_at).toISOString()}</lastmod>
          <changefreq>daily</changefreq>
          <priority>1.0</priority>
        </url>`;
    });

    // Add categories
    categories.forEach((category) => {
      xml += `
        <url>
          <loc>${baseUrl}/categoria/${category.slug}</loc>
          <lastmod>${new Date(category.updated_at).toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.9</priority>
        </url>`;
    });

    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    next(error);
  }
};
