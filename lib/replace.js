'use strict';

//dependences
const fs = require('fs');
const path = require('path');
const xlsx = require('node-xlsx');
const babylon = require('babylon');
const recast = require('recast');
const colors = require('colors');
const n = recast.types.namedTypes;
const b = recast.types.builders;

const config = require('./config');
const utils = require('./util');

module.exports = function() {
  const xlsxBuffer = xlsx.parse(fs.readFileSync(`${process.cwd()}/${config.prefix}_autoTranslate_i18n.xlsx`));
  const callDef = config.customCall ? config.customCall : 'i18n';
  const i18nName = config.i18nName ? config.i18nName : 'i18n';
  let successCount = 0;
  const notMatchZhArr = [];
  const testList = [];
  const newChnMap = {};
  xlsxBuffer[0].data.slice(1).reduce((cur, next) => {
    if (!newChnMap[next[2]]) {
      newChnMap[next[3]] = next[2];
    }
  }, []);
  const files = utils.getFiles();
  files.map((file, i) => {
    if (/i18n\/en\.js$/g.test(file)) { // 不处理en.js文件
      return;
    }
    let hasImportI18n = [],
        hasI18nKey;
    // 替换中文字符串为i18n(key)
    let ast = utils.getAST(file);
    utils.visitAST(ast, (path, v) => {
      const value = String(v).trim();
      const loc = path.node.loc;
      const key = newChnMap[value];
      if (key){
        successCount++;
        hasI18nKey = true; // 用来判断该页面有国际化字段
        if (key.split('.').pop() === '') throw new Error(`${i18nName} key "${key}" should has unique end`);
        const i18nCall = b.callExpression(
            b.identifier(callDef),
            [b.literal(key)]
        );
        const parentType = path.parentPath.node.type;
        if (parentType === 'SwitchCase' || (parentType === 'ObjectProperty' && path.name === 'key')) {
          console.log(`【autoTranslate WARNING】: In ${file}, "${value}" at << Position: line ${loc.start.line}, from ${loc.start.column} to ${loc.end.column} >> can't replace to ${i18nName}('${key}'), please manually changing the code implementation`)
          return false;
        }else if (parentType === 'JSXElement' || parentType === 'JSXAttribute') {
          path.replace(b.jsxExpressionContainer(i18nCall));
        }else {
          path.replace(i18nCall);
        }
      } else if(utils.chnRegExp.test(v)) {
        notMatchZhArr.push(v.trim());
      }
    });
    // 判断页面有没有引入或者定义i18n
    recast.visit(ast, {
      visitImportDeclaration: function(path) {
        if (path.node.source.value === i18nName) {
          hasImportI18n.push(path);
        }
        this.traverse(path);
      },
      visitVariableDeclarator: function(path) {
        if (path.node.id.name === i18nName) {
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
              [b.literal(i18nName)]
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
    // 使用i18n的页面，如果没有引入，则添加引入
    if ( newCode.indexOf(`const ${callDef} = require(`) === -1 && newCode.indexOf(`import ${callDef} from `) === -1 && hasI18nKey) {
      newCode = `const ${callDef} = require("${i18nName}");\n` + newCode;
    }
    // 如果文件是zh-cn.js, 则用zh-cn覆盖对应的en
    if (/i18n\/zh-cn\.js$/g.test(file)) {
      const enFilePath = file.replace('zh-cn.js', 'en.js');
      testList.push({
        file: utils.p(enFilePath),
        code: newCode
      });
    }
    // 将所有需要执行的任务放在任务列表中，统一执行
    testList.push({
      file: utils.p(file),
      code: newCode
    });
    if (i === files.length -1) {
      if (notMatchZhArr.length) {
        console.log(`scanned count: ${successCount + notMatchZhArr.length}`);
        console.log(`success replace count: ${successCount}`);
        console.log('replace failed'.red);
        console.log(notMatchZhArr.toString().yellow);
      } else {
        testList.forEach((test, i) => {
          try {
            fs.writeFileSync(test.file, test.code);
            if (i === testList.length -1) {
              console.log('replace success'.green);
              console.log(`files count: ${i+1}`);
            }
          }catch(e) {
            throw new Error('replace failed');
          }
        })
      }
    }
  })
}
