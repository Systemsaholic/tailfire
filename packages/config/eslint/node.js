module.exports = {
  extends: ['./base.js'],
  env: {
    node: true,
    es2022: true,
  },
  rules: {
    '@typescript-eslint/no-var-requires': 'off',
  },
}
