/** @type {import('next').NextConfig} */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  async rewrites() {
    // En dev, proxifie les appels /api vers le backend Django.
    if (process.env.NODE_ENV === "development") {
      return [{ source: "/api/:path*", destination: `${API_BASE.replace(/\/api\/v1$/, "")}/api/:path*` }];
    }
    return [];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
