'user strict';

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
      newChnMap[next[3]] = next[2];
    }
  }, []);
  const files = utils.getFiles();
  files.map(file => {
    const code = fs.readFileSync(utils.p(file), 'utf8');
    const newCode = j(code).find(n.Literal).forEach(function(path) {
      const value = path.value.value;
      if (newChnMap[value]){
        const key = newChnMap[value];
        const i18nCall = j.callExpression(
            j.identifier('i18n'),
            [j.literal(key)]
        );
        const parentType = path.parentPath.node.type;
        if (parentType === 'SwitchCase') {
          return false;
        }else if (parentType === 'JSXElement') {
          path.replace(b.jsxExpressionContainer(i18nCall));
        }else {
          path.replace(i18nCall);
        }
      }
    }).toSource();
    try {
      fs.writeFileSync(utils.p(file), newCode);
      console.log('replace success');
    }catch(e) {
      throw new Error('replace failed');
    }
  })
}
