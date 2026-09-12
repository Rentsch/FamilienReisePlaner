import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pvtrzslthjtfpruwwzlf.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      // Photos taken directly with a phone camera are often several MB;
      // the 1MB default made "Termin"-Fotos-Upload fail with a generic error.
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
