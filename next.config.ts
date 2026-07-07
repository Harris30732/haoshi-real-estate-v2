import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // /api/* 代理到 n8n webhook。
  // 原本放在 vercel.json，但 Zeabur 不讀 vercel.json，故移到 next.config（Next.js
  // rewrite 在任何 host 都生效）。N8N_WEBHOOK_BASE 可用環境變數覆蓋，預設指向生產 n8n。
  async rewrites() {
    const n8nBase = process.env.N8N_WEBHOOK_BASE ?? 'https://findmyhome.zeabur.app/webhook'
    return [
      {
        source: '/api/:path*',
        destination: `${n8nBase}/:path*`,
      },
    ]
  },
};

export default nextConfig;
