/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // Exclude mapbox-gl from transpilation to allow proper worker loading
    config.module.rules.push({
      test: /\.js$/,
      include: /node_modules\/mapbox-gl/,
      use: ['babel-loader'],
      exclude: /node_modules\/mapbox-gl\/dist\/mapbox-gl\.js$/,
    })
    return config
  },
}

export default nextConfig
