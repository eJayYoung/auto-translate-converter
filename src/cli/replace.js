'user strict';

//dependences
const fs = require('fs');
const path = require('path');
const xlsx = require('node-xlsx');

const config = require('../config');
const utils = require('../util');

module.exports = function() {
  const newXlsxBuffer = xlsx.parse(fs.readFileSync(`${process.cwd()}/${config.prefix}_autoTranslate_i18n.xlsx`));
  console.log(newXlsxBuffer);
}
