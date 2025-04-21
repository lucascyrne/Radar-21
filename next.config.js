/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["lh3.googleusercontent.com", "avatars.githubusercontent.com"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        // Rewrite para o subdomínio org
        {
          source: "/:path*",
          has: [
            {
              type: "host",
              value: "org.localhost|org.radar21.com.br",
            },
          ],
          destination: "/org/:path*",
        },
      ],
    };
  },
  async redirects() {
    return [
      {
        source: "/",
        has: [
          {
            type: "host",
            value: "org.localhost:3000",
          },
        ],
        destination: "/org/dashboard",
        permanent: true,
      },
      {
        source: "/",
        has: [
          {
            type: "host",
            value: "org.radar21.com.br",
          },
        ],
        destination: "/org/dashboard",
        permanent: true,
      },
    ];
  },
  webpack: (config) => {
    return config;
  },
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
