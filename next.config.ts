import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
  }
};

export default nextConfig;
