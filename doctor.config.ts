import { defineConfig } from 'react-doctor/api';

export default defineConfig({
  ignore: {
    overrides: [
      {
        // RichText is the single place that injects our own static, non-user HTML
        files: ['ui/RichText/index.tsx'],
        rules: ['react-doctor/dangerous-html-sink'],
      },
    ],
  },
});
