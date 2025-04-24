/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Enables static exports
  basePath: '/impacts-of-wildfire-california', // Sets the base path for the project
  assetPrefix: '/impacts-of-wildfire-california/', // Sets the prefix for assets like JS/CSS
  images: {
    unoptimized: true, // Disables Next.js Image Optimization (required for static export without a server)
  },
  // Optional: Add other Next.js configurations here if needed
};

export default nextConfig;
