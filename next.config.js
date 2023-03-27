/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/lounge-library/index',
        destination: '/lounge-library/index'
      }
    ]
  }
}

module.exports = nextConfig
