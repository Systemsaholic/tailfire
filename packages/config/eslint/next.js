module.exports = {
  extends: [
    './base.js',
    'next/core-web-vitals',
  ],
  rules: {
    '@next/next/no-html-link-for-pages': 'off',
  },
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
}
