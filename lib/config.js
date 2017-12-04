'user strict';

const fs = require('fs');

// default config
const DEFAULT_CONFIG = {
  root: './src',
  ignore: ['app', 'i18n', 'images', 'lib', 'util'],
  argvPath: process.argv[3] && `./${process.argv[3]}`,
  prefix: process.cwd().split('/').pop(),
  uniqueValue: true,
  customKey: false,
};

const config = fs.existsSync(`${process.cwd()}/autoTranslate.config.json`)
  ? Object.assign(DEFAULT_CONFIG, JSON.parse(fs.readFileSync(`${process.cwd()}/autoTranslate.config.json`)))
  : DEFAULT_CONFIG;

module.exports = config;
