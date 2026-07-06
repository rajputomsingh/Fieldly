/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "viqthwxvysiuwzbhijuf.supabase.co",
      },
    ],
  },
};

module.exports = nextConfig;