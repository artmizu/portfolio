import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  turbopack: {
    rules: {
      '*.frag': {
        loaders: ['ts-shader-loader'],
        as: '*.js',
      },
      '*.vert': {
        loaders: ['ts-shader-loader'],
        as: '*.js',
      },
    },
  },
};

export default nextConfig;
