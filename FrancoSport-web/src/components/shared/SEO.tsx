import React from 'react';
import { Helmet } from 'react-helmet-async';
import { APP_CONFIG } from '@/constants/config';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  schema?: Record<string, any>;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  schema,
}) => {
  const siteTitle = APP_CONFIG.NAME;
  const fullTitle = title ? `${title} | ${siteTitle}` : `${siteTitle} - ${APP_CONFIG.SLOGAN}`;
  const metaDescription = description || 'Tienda oficial de Franco Sport. Ropa deportiva, calzado y accesorios de las mejores marcas.';
  const metaKeywords = keywords?.join(', ') || 'deportes, ropa deportiva, calzado, accesorios, franco sport';
  const metaImage = image || '/og-image.jpg'; // Make sure this exists or use a remote URL
  const metaUrl = url || window.location.href;

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      <link rel="canonical" href={metaUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:url" content={metaUrl} />
      <meta property="og:site_name" content={siteTitle} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />

      {/* Schema.org JSON-LD */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};
