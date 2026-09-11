/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  turbopack: {
    root: __dirname,
  },

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