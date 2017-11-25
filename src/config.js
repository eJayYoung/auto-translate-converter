'user strict';

const fs = require('fs');

// config
const DEFAULT_CONFIG = {
  root: './src',
  ignore: ['app', 'i18n', 'images', 'lib', 'util'],
  prefix: process.cwd().split('/').pop(),
  unique: true,
};

const config = fs.existsSync(`${process.cwd()}/autoTranslate.config.js`)
  ? JSON.parse(fs.readFileSync(`${process.cwd()}/autoTranslate.config.js`))
  : DEFAULT_CONFIG;

module.exports = config;
