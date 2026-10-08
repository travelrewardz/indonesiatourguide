import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "thumb.wikimedia.org" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async redirects() {
    return [
      // Legacy site URLs preserved for SEO (see docs/deployment.md)
      { source: "/tours-package/:slug", destination: "/tours/:slug", permanent: true },
      { source: "/destination/:slug", destination: "/destinations/:slug", permanent: true },
      { source: "/for-agencies", destination: "/agents", permanent: true },
      { source: "/partner-portal", destination: "/agents", permanent: true },
      { source: "/guides", destination: "/blog", permanent: true },
    ];
  },
};

export default nextConfig;
