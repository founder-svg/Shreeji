/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three'],
  output: 'export',
  basePath: '/adipur/3d-viewer',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
