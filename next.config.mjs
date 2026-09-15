/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  eslint: {
    // No bloquejar el build per avisos d'estil durant el desenvolupament inicial del MVP.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
