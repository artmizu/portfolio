// .eslintrc.js
process.env.ESLINT_TSCONFIG = 'tsconfig.json'

module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [  
    'next',
    'next/core-web-vitals',
  ],
  rules: {
    indent: ['error', 2],
  },
}
