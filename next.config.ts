import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  async redirects() {
    return [
      {
        source: '/perfil',
        destination: '/profile',
        permanent: true,
      },
      {
        source: '/torneo/:id',
        destination: '/tournament/:id',
        permanent: true,
      },
      {
        source: '/torneos',
        destination: '/tournaments',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
