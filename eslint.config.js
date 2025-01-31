const { FlatCompat } = require('@eslint/eslintrc');
const airbnb = require('eslint-config-airbnb');
const prettier = require('eslint-plugin-prettier');

const compat = new FlatCompat({
  baseDirectory: __dirname, // 필수: 현재 디렉토리 설정
});

module.exports = [
  ...compat.extends('airbnb'),
  ...compat.extends('plugin:prettier/recommended'),
  {
    rules: {
      'prettier/prettier': ['error'],
      'no-console': 'off',
    },
    ignores: [
      'node_modules/',
      'package.json',
      'package-lock.json',
      'yarn-error.json',
      'yarn.lock',
      '*.md',
      '*.log',
    ],
  },
];
