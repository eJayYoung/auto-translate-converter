//dependences
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const babylon = require('babylon');
const xlsx = require('node-xlsx');

const types = require('ast-types');
const b = types.builders;

const utils = require('./util');
const { p } = utils;

// 匹配中文正则 https://stackoverflow.com/questions/21109011/javascript-unicode-string-chinese-character-but-no-punctuation
const chnRegExp = /[\u4E00-\u9FCC\u3400-\u4DB5\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]|[\ud840-\ud868][\udc00-\udfff]|\ud869[\udc00-\uded6\udf00-\udfff]|[\ud86a-\ud86c][\udc00-\udfff]|\ud86d[\udc00-\udf34\udf40-\udfff]|\ud86e[\udc00-\udc1d]/g;

// config
const DEFAULT_CONFIG = {
  root: './src',
  ignore: ['app', 'i18n', 'images', 'lib', 'util'],
  prefix: process.cwd().split('/').pop(),
  unique: true,
};

const config = fs.existsSync('./autoTranslate.config.js')
  ? JSON.parse(fs.readFileSync('./autoTranslate.config.js'))
  : DEFAULT_CONFIG;

class Translate {
  constructor() {
    this.config = config;
    this.files = [];
    this.chnMap = {};
  }
  /**
   * for command build, -b, --build
   */
  build() {
    console.log('build');
    const me = this;
    me.getFiles();
    me.generateChnMap();
    me.generateMCMSxlsx();
  }

  /**
   * for command replace, -r, --replace
   */
  replace() {
    const me = this;

  }

  /**
   * 获取文件
   */
  getFiles() {
    const me = this;
    const { config } = me;
    let childrenPath = config.ignore.map(n => {
      return `${p(config.root)}/${n}/**/*.js`;
    });
    me.files = glob.sync(`${p(config.root)}/**/*.js`, {
      ignore: childrenPath
    }).map(v => v.substring(process.cwd().length));
  }

  /**
   * 生成文件内所有中文Map
   * chnMap example
   * {
   *  "recruit-fbi.components.Common.Record": ['请求纪录失败'],
   * }
   */
  generateChnMap() {
    const me = this;
    const { config, files } = me;

    const chnList = files.map(file => {
      // file : /src/page/reportDetail/reportDetail.js
      const ast = me.getAST(file); //每个文件的ast
      const key = `${config.prefix}.${file.split('/').slice(2, -1).join('.')}.`;
      const singleFileChn = me.matchChnFromAST(ast);
      if (singleFileChn.length > 0) {
        me.chnMap[key] = me.matchChnFromAST(ast);
      }
    })
  }

  /**
   * 根据chnMap生成excel
   */
  generateMCMSxlsx() {
    const me = this;
    const { chnMap, config } = me;
    const template = xlsx.parse(fs.readFileSync(`${__dirname}/template/mcms_intl-i18nadmin_en_US.xlsx`));
    const columns = template[0].data[0];
    
    let dyadicArr = [];
    for(let [key, value] of Object.entries(me.chnMap)) {
      value.forEach(n => {
        dyadicArr.push([key, n]);
      })
    }
    if (config.unique) {
      // 二维数组去重
      const cacheMap = {};
      dyadicArr = dyadicArr.reduce((cur, next) => {
        cacheMap[next[1]] ? '' : cacheMap[next[1]] = true && cur.push(next);
        return cur;
      }, []);
    }
    dyadicArr = dyadicArr.map(n => {
      return [config.prefix, ''].concat(n);
    })
    template[0].data = template[0].data.concat(dyadicArr);
    const newBuffer = xlsx.build(template);
    fs.writeFileSync(`${process.cwd()}/${config.prefix}_autoTranslate_i18n.xlsx`, newBuffer);
  }

  /**
   * 将文件转换为AST
   * @param {string} file
   */
  getAST(file) {
    const code = fs.readFileSync(p(file), 'utf8');
    let ast;
    try {
      ast = babylon.parse(code, {
        allowImportExportEverywhere: true,
        plugins: ['jsx', 'objectRestSpread', 'decorators', 'exportExtensions', 'classProperties']
      });
    }catch(e) {
      throw new Error(`file${file} parse ast error`);
    }
    return ast;
  }

  /**
   * 遍历AST，正则匹配出中文
   */
  matchChnFromAST(ast) {
    const me = this;
    let result = [];
    types.visit(ast, {
      visitLiteral: function(path){
        const v = path.node.value;
        if(chnRegExp.test(v)){
          result.push(v.trim());
        }
        this.traverse(path);
      },
      visitJSXText: function(path){
        const v = path.node.value;
        if(chnRegExp.test(v)){
          result.push(v.trim());
        }
        this.traverse(path);
      }
    });
    return result;
  }

  /**
   * 
   */

}

module.exports = Translate;