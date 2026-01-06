/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@tailfire/ui-public', '@tailfire/api-client'],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
