'user strict';

const fs = require('fs');

// default config
const DEFAULT_CONFIG = {
  root: './src',
  ignore: ['app', 'i18n', 'images', 'lib', 'util'],
  filePath: process.argv[3] && `./${process.argv[3]}`,
  prefix: process.cwd().split('/').pop(),
  unique: true,
  uuid: true,
};

const config = fs.existsSync(`${process.cwd()}/autoTranslate.config.js`)
  ? JSON.parse(fs.readFileSync(`${process.cwd()}/autoTranslate.config.js`))
  : DEFAULT_CONFIG;

module.exports = config;
