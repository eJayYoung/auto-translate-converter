const fs = require('fs');
const path = require('path');

const utils = {
  /**
   * 获取脚本执行绝对路径
   * @param {array} args 
   */
  p(...args) {
    return path.join(process.cwd(), ...args);
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
  /**
   * 数组转MAP
   */
  arr2Map(key) {

  }
};

module.exports = utils;
