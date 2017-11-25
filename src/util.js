const fs = require('fs');
const path = require('path');
const glob = require('glob');
const babylon = require('babylon');
const types = require('ast-types');
const config = require('./config');

// 匹配中文正则 https://stackoverflow.com/questions/21109011/javascript-unicode-string-chinese-character-but-no-punctuation
const chnRegExp = /[\u4E00-\u9FCC\u3400-\u4DB5\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]|[\ud840-\ud868][\udc00-\udfff]|\ud869[\udc00-\uded6\udf00-\udfff]|[\ud86a-\ud86c][\udc00-\udfff]|\ud86d[\udc00-\udf34\udf40-\udfff]|\ud86e[\udc00-\udc1d]/g;

const utils = {
  /**
   * 获取脚本执行绝对路径
   * @param {array} args 
   */
  p(...args) {
    return path.join(process.cwd(), ...args);
  },
  /**
   * 获取要替换的文件路径
   */
  getFiles() {
    const ignorePath = config.ignore.map(n => {
      return `${utils.p(config.root)}/${n}/**/*.js`;
    });
    return glob.sync(`${utils.p(config.root)}/**/*.js`, {
      ignore: ignorePath
    }).map(v => v.substring(process.cwd().length));
  },
  /**
   * 将文件转换为AST
   * @param {string} file
   */
  getAST(file) {
    const code = fs.readFileSync(utils.p(file), 'utf8');
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
  },
  /**
   * 遍历AST，正则匹配出中文
   */
  matchChnFromAST(ast) {
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
  },
  /**
   * 深拷贝对象
   * @param {*} args
   */
  assign(...args) {
    const target = args.splice(0, 1)[0];
    for (let i = 0, l = args.length; i < l; i += 1) {
      const source = args[i];
      Object.keys(source).forEach((key) => {
        if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          target[key] = target[key] || {};
          utils.assign(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      });
    }
  },
  /**
   * 判断路径是否为文件
   * @param {string} path
   */
  isFile(fp) {
    return fs.statSync(fp).isFile();
  },
  /**
   * 判断路径是否为文件夹
   * @param {string} path
   */
  isFolder(fp) {
    return fs.statSync(fp).isDirectory();
  },
};

module.exports = utils;
