/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config, options) {
    const { isServer } = options;
    const prefix = nextConfig.assetPrefix || '';
    const basePath = nextConfig.basePath || '';
  
    config.module.rules.push({
      test: /\.(mp4|webm|mov|ogg|swf|ogv)$/,
      use: [
        {
          loader: require.resolve('file-loader'),
          options: {
            publicPath: `${prefix || basePath}/_next/static/videos/`,
            outputPath: `${isServer ? '../' : ''}static/videos/`,
            name: '[name]-[hash].[ext]',
          },
        },
      ],
    });

    config.module.rules.push({
      test: /\.(frag|vert)$/,
      use: [
        {
          loader: require.resolve('ts-shader-loader')
        },
      ],
    });
    
    return config;
  },
  sassOptions: {
    silenceDeprecations: ['legacy-js-api'],
  }
}

module.exports = nextConfig
