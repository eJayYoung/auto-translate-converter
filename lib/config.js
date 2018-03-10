'use strict';

const fs = require('fs');

// default config
const DEFAULT_CONFIG = {
  root: './src',
  ignore: ['app', 'i18n', 'images', 'lib', 'util'],
  basename: ['js', 'jsx'],
  options: {},
  argvPath: process.argv[3] ? `./${process.argv[3]}` : './src',
  prefix: process.cwd().split('/').pop(),
  autoKey: true,
};


let customConfig = {};

if (fs.existsSync(`${process.cwd()}/autoTranslate.config.js`)) {
  customConfig = require(`${process.cwd()}/autoTranslate.config.js`);
}

const config = Object.assign(DEFAULT_CONFIG, customConfig)
module.exports = config;
