import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://homyorganic.store';
  const routes = [
    '/',
    '/products',
    '/cart',
    '/checkout',
    '/orders',
    '/profile',
    '/auth/signin',
    '/auth/signup',
  ];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '/' ? 1 : 0.7,
  }));
}
