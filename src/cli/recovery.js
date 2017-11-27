'use strict';

//dependences
const fs = require('fs');
const path = require('path');
const xlsx = require('node-xlsx');
const j = require('jscodeshift');
const n = j.types.namedTypes;

const config = require('../config');
const utils = require('../util');

module.exports = function() {
  const newXlsxBuffer = xlsx.parse(fs.readFileSync(`${process.cwd()}/${config.prefix}_autoTranslate_i18n.xlsx`));
  const newChnMap = {};
  const newArr = newXlsxBuffer[0].data.slice(1).reduce((cur, next) => {
    if (!newChnMap[next[2]]) {
      newChnMap[next[2]] = next[3];
    }
  }, []);
  const files = utils.getFiles();
  files.map(file => {
    const code = fs.readFileSync(utils.p(file), 'utf8');
    const newCode = j(code).find(n.CallExpression).forEach(function(path) {
      const node = path.node;
      if (node.callee.name === 'i18n') {
        const key = node.arguments[0].value;
        const literal = j.literal(newChnMap[key]);
        path.replace(literal);
      }
    }).toSource({quote: 'single'});
    try {
      fs.writeFileSync(utils.p(file), newCode);
      console.log('recovery success');
    }catch(e) {
      throw new Error('recovery failed');
    }
  })
}

