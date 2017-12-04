'user strict';

//dependences
const fs = require('fs');
const path = require('path');
const xlsx = require('node-xlsx');
const uuidv4 = require('uuid/v4');

const config = require('./config');
const utils = require('./util');

/**
 * @param {Array} files
 * @return chnArr
 * chnArr example
 * [
 *  ['recruit-fbi.pages.companyPackageManagement.packageManagement.6513.6516', '是']
 * ]
 *
 */
function generateChnArr(files) {
  const chnArr = [];
  files.map((file, i) => {
    const ast = utils.getAST(file);
    utils.visitAST(ast, (path) => {
      const pathNode = path.node;
      const value = pathNode.value;
      let key = `${config.prefix}.${file.split('/').slice(2, -1).join('.')}.${!config.customKey ? `${pathNode.start}-${pathNode.end}` : ''}`;
      if(utils.chnRegExp.test(value)) {
        chnArr.push([key, `${pathNode.start}-${pathNode.end}`, value.trim()]);
      }
    });
  })
  return chnArr;
}

/**
 * @param {Array} chnArr
 * 根据chnMap生成excel
 */
function generateMCMSxlsx(chnArr) {
  const template = xlsx.parse(fs.readFileSync(`${path.resolve(__dirname)}/template/mcms_intl-i18nadmin_en_US.xlsx`));
  const columns = template[0].data[0];
  let dyadicArr = chnArr;
  if (config.uniqueValue) {
    // 二维数组去重
    const cacheMap = {};
    dyadicArr = dyadicArr.reduce((cur, next) => {
      cacheMap[next[2]] ? '' : cacheMap[next[2]] = true && cur.push(next);
      return cur;
    }, []);
  }
  dyadicArr = dyadicArr.map(n => {
    return [config.prefix, ''].concat(n);
  })
  columns.splice(3, 0, 'location');
  template[0].data = template[0].data.concat(dyadicArr);
  const newBuffer = xlsx.build(template);
  try {
    fs.writeFileSync(`${process.cwd()}/${config.prefix}_autoTranslate_i18n.xlsx`, newBuffer);
    console.timeEnd('generate MCMSxlsx');
    console.log('build success');
    console.log(`words count: ${dyadicArr.length}`);
  }catch(e) {
    throw new Error(`build failed: ${e}`);
  }
}


module.exports = function() {
  const files = utils.getFiles();
  console.time('generate ChnMap');
  const chnArr = generateChnArr(files);
  console.timeEnd('generate ChnMap');
  console.time('generate MCMSxlsx')
  generateMCMSxlsx(chnArr);
  console.log(`file count: ${files.length}`);
};