/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['qxuggtkugcguyunbbdcr.supabase.co'],
  },
  experimental: {
    webVitalsAttribution: ['CLS', 'LCP']
  }
}

module.exports = nextConfig