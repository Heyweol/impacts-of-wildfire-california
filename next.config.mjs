/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure allowed image domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'opengeo.ncep.noaa.gov',
        port: '',
        pathname: '/geoserver/**',
      },
    ],
  },
};

export default nextConfig;
