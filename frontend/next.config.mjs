/** @type {import('next').NextConfig} */
// En développement, NEXT_PUBLIC_API_BASE_URL pointe directement sur le backend
// Django (ex. http://localhost:8000/api/v1) et le CORS l'autorise. En production,
// Nginx sert le front et proxifie /api/ vers Django (voir infra/nginx).
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  skipTrailingSlashRedirect: true,
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
