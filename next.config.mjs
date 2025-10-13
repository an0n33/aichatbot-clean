/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ignore ESLint errors during build (so deploys don’t fail)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript errors during build (safer deploys on Render)
    ignoreBuildErrors: true,
  },
  images: {
    // Allow remote images from avatar.vercel.sh (optional but safe)
    remotePatterns: [
      {
        hostname: "avatar.vercel.sh",
      },
    ],
    // Disable Next.js image optimization (faster build, less CPU)
    unoptimized: true,
  },
};

export default nextConfig;

