import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=(), accelerometer=(), gyroscope=(), magnetometer=(), usb=(), payment=(), autoplay=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  { key: 'X-Download-Options', value: 'noopen' },
  { key: 'Origin-Agent-Cluster', value: '?1' },
  { key: 'Cache-Control', value: 'no-store, private, must-revalidate' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'none'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self'",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "manifest-src 'self'",
      "upgrade-insecure-requests",
    ].join('; '),
  },
];

const config: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
export default config;
