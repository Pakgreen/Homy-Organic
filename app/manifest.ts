import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Homy Organic Store',
    short_name: 'Homy Organic',
    description: 'Where Beauty Meets Wellness - Organic Products, Clothing & Premium Collection',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/homyorganic.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/homyorganic.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
