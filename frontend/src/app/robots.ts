import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/privacy', '/terms', '/icon.svg'],
      disallow: [
        '/',
        '/login',
        '/register',
        '/accounts',
        '/transactions',
        '/imports',
        '/budgets',
        '/settings',
      ],
    },
  };
}
