'user strict';

//dependences
const fs = require('fs');
const path = require('path');
const xlsx = require('node-xlsx');
const babylon = require('babylon');
const recast = require('recast');
const n = recast.types.namedTypes;
const b = recast.types.builders;

const config = require('./config');
const utils = require('./util');

module.exports = function() {
  const xlsxBuffer = xlsx.parse(fs.readFileSync(`${process.cwd()}/${config.prefix}_autoTranslate_i18n.xlsx`));
  const newChnMap = {};
  xlsxBuffer[0].data.slice(1).reduce((cur, next) => {
    if (!newChnMap[next[2]]) {
      newChnMap[next[3]] = next[2];
    }
  }, []);
  const files = utils.getFiles();
  files.map((file, i) => {
    let i18nImport = [],
        hasI18nKey;
    // 替换中文字符串为i18n(key)
    let ast = utils.getAST(file);
    utils.visitAST(ast, (path) => {
      const value = String(path.value.value).trim();
      const loc = path.node.loc;
      const key = newChnMap[value];
      if (key){
        hasI18nKey = true; // 用来判断该页面有国际化字段
        if (key.split('.').pop() === '') throw new Error(`i18n key "${key}" should has unique end`);
        const i18nCall = b.callExpression(
            b.identifier('i18n'),
            [b.literal(key)]
        );
        const parentType = path.parentPath.node.type;
        if (parentType === 'SwitchCase' || (parentType === 'ObjectProperty' && path.name === 'key')) {
          console.log(`【WARNING】: In ${file}, "${value}" at << Position: line ${loc.start.line}, from ${loc.start.column} to ${loc.end.column} >> can't replace to i18n('${key}')`)
          return false;
        }else if (parentType === 'JSXElement' || parentType === 'JSXAttribute') {
          path.replace(b.jsxExpressionContainer(i18nCall));
        }else {
          path.replace(i18nCall);
        }
      } 
    });
    recast.visit(ast, {
      visitVariableDeclarator: function(path) {
        if (path.node.id.name === 'i18n') {
          i18nImport.push(path);
        }
        this.traverse(path);
      }
    })
    let newCode = recast.print(ast).code;
    // 判断页面中有没有定义i18n变量，没有的话就引入
    const noI18nImport = i18nImport.length === 0;
    if (noI18nImport && hasI18nKey) {
      const importI18n = `const i18n = require("i18n"); \n`;
      newCode = importI18n + newCode;
    }
    try {
      fs.writeFileSync(utils.p(file), newCode);
      if (i === files.length -1) {
        console.log('replace success');
        console.log(`files count: ${i+1}`);
      }
    }catch(e) {
      throw new Error('replace failed');
    }
  })
}
