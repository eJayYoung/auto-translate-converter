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
  const callDef = config.customCall ? config.customCall : 'i18n';
  const newChnMap = {};
  xlsxBuffer[0].data.slice(1).reduce((cur, next) => {
    if (!newChnMap[next[2]]) {
      newChnMap[next[3]] = next[2];
    }
  }, []);
  const files = utils.getFiles();
  files.map((file, i) => {
    let hasImportI18n = [],
        hasI18nKey;
    // 替换中文字符串为i18n(key)
    let ast = utils.getAST(file);
    utils.visitAST(ast, (path, v) => {
      const value = String(v).trim();
      const loc = path.node.loc;
      const key = newChnMap[value];
      if (key){
        hasI18nKey = true; // 用来判断该页面有国际化字段
        if (key.split('.').pop() === '') throw new Error(`i18n key "${key}" should has unique end`);
        const i18nCall = b.callExpression(
            b.identifier(callDef),
            [b.literal(key)]
        );
        const parentType = path.parentPath.node.type;
        if (parentType === 'SwitchCase' || (parentType === 'ObjectProperty' && path.name === 'key')) {
          console.log(`【autoTranslate WARNING】: In ${file}, "${value}" at << Position: line ${loc.start.line}, from ${loc.start.column} to ${loc.end.column} >> can't replace to i18n('${key}'), please manually changing the code implementation`)
          return false;
        }else if (parentType === 'JSXElement' || parentType === 'JSXAttribute') {
          path.replace(b.jsxExpressionContainer(i18nCall));
        }else {
          path.replace(i18nCall);
        }
      } 
    });
    // 判断页面有没有引入或者定义i18n
    recast.visit(ast, {
      visitImportDeclaration: function(path) {
        if (path.node.source.value === 'i18n') {
          hasImportI18n.push(path);
        }
        this.traverse(path);
      },
      visitVariableDeclarator: function(path) {
        if (path.node.id.name === 'i18n') {
          hasImportI18n.push(path);
        }
        this.traverse(path);
      }
    });
    // 添加i18n定义
    recast.visit(ast, {
      visitImportDeclaration: function(path) {
        const parentPathValue = path.parentPath.value;
        const importNum = parentPathValue.filter(n => n.type === 'ImportDeclaration');
        const i18nImportDef = b.variableDeclaration("const", [
          b.variableDeclarator(
            b.identifier(callDef),
            b.callExpression(
              b.identifier("require"),
              [b.literal("i18n")]
            )
          ) 
        ]);
        // 页面没有引入i18n则在最后一个import后面插入
        if (hasImportI18n.length === 0 && path.name === importNum.length - 1) {
          path.parentPath.get(path.name).insertAfter(i18nImportDef);
        }
        this.traverse(path);
      }
    })
    let newCode = recast.print(ast, config.options).code;
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
