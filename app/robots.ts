import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nawiratraders.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/product/', '/policies'],
        disallow: ['/admin', '/api/', '/account'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
