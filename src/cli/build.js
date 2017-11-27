'user strict';

//dependences
const fs = require('fs');
const path = require('path');
const xlsx = require('node-xlsx');
const uuidv4 = require('uuid/v4');

const config = require('../config');
const utils = require('../util');



/**
 * @param {Array} files
 * @return chnMap
 * chnMap example
 * {
 *  "recruit-fbi.components.Common.Record": ['请求纪录失败', '失败'],
 * }
 */
function generateChnMap(files) {
  const chnMap = {};
  files.map(file => {
    // file : /src/page/reportDetail/reportDetail.js
    const ast = utils.getAST(file); //每个文件的ast
    const key = `${config.prefix}.${file.split('/').slice(2, -1).join('.')}.`;
    const singleFileChn = utils.matchChnFromAST(ast);
    if (singleFileChn.length > 0) {
      chnMap[key] = chnMap[key] ? chnMap[key].concat(singleFileChn) : singleFileChn;
    }
  })
  return chnMap;
}

/**
 * @param {Map} chnMap
 * 根据chnMap生成excel
 */
function generateMCMSxlsx(chnMap) {
  const template = xlsx.parse(fs.readFileSync(`${path.resolve(__dirname, '..')}/template/mcms_intl-i18nadmin_en_US.xlsx`));
  const columns = template[0].data[0];
  
  let dyadicArr = [];
  for(let [key, value] of Object.entries(chnMap)) {
    value.forEach(n => {
      dyadicArr.push([`${key}${config.uuid ? uuidv4() : ''}`, n]);
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
  try {
    fs.writeFileSync(`${process.cwd()}/${config.prefix}_autoTranslate_i18n.xlsx`, newBuffer);
    console.log('build success');
  }catch(e) {
    throw new Error(`build failed ${e}`);
  }
}


module.exports = function() {
  const files = utils.getFiles();
  const chnMap = generateChnMap(files);
  generateMCMSxlsx(chnMap);
};