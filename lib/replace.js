'user strict';

//dependences
const fs = require('fs');
const path = require('path');
const xlsx = require('node-xlsx');
const j = require('jscodeshift');
const n = j.types.namedTypes;
const b = j.types.builders;

const config = require('./config');
const utils = require('./util');

module.exports = function() {
  const newXlsxBuffer = xlsx.parse(fs.readFileSync(`${process.cwd()}/${config.prefix}_autoTranslate_i18n.xlsx`));
  const newChnMap = {};
  const newArr = newXlsxBuffer[0].data.slice(1).reduce((cur, next) => {
    if (!newChnMap[next[2]]) {
      newChnMap[next[3]] = next[2];
    }
  }, []);
  const files = utils.getFiles();
  files.map((file, i) => {
    const code = fs.readFileSync(utils.p(file), 'utf8');
    let hasI18nKey;
    // 替换中文字符串为i18n(key)
    let newCode = j(code).find(n.Literal).forEach(function(path) {
      console.log(path.value.start, path.value.end);
      const value = path.value.value;
      if (newChnMap[value]){
        hasI18nKey = true; // 用来判断该页面有国际化字段
        const key = newChnMap[value];
        const i18nCall = j.callExpression(
            j.identifier('i18n'),
            [j.literal(key)]
        );
        const parentType = path.parentPath.node.type;
        if (parentType === 'SwitchCase' || (parentType === 'Property' && path.name === 'key')) {
          return false;
        }else if (parentType === 'JSXElement' || parentType === 'JSXAttribute') {
          path.replace(b.jsxExpressionContainer(i18nCall));
        }else {
          path.replace(i18nCall);
        }
      }
    }).toSource();
    // 判断页面中有没有定义i18n变量，没有的话就引入
    const noI18nImport = j(newCode).findVariableDeclarators('i18n').length === 0;
    if (noI18nImport && hasI18nKey) {
      const importI18n = `const i18n = require("i18n"); \n`;
      newCode = importI18n + newCode;
    }
    try {
      //fs.writeFileSync(utils.p(file), newCode);
      if (i === files.length -1) {
        console.log('replace success');
        console.log(`files count: ${i+1}`);
      }
    }catch(e) {
      throw new Error('replace failed');
    }
  })
}
