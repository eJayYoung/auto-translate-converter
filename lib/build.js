'user strict';

//dependences
const fs = require('fs');
const path = require('path');
const xlsx = require('node-xlsx');
const pinyin = require('pinyin');

const config = require('./config');
const utils = require('./util');

/**
 * @param {Array} files
 * @return chnArr
 * chnArr example
 * [
 *  ['recruit-fbi.pages.companyPackageManagement.packageManagement.', '是']
 * ]
 *
 */
function generateChnArr(files) {
  const cacheMap = {};
  let chnArr = [];
  files.map((file, i) => {
    const ast = utils.getAST(file);
    utils.visitAST(ast, (path) => {
      const pathNode = path.node;
      const value = pathNode.value;
      if(utils.chnRegExp.test(value)) {
        value.replace(/(\:|\：|)$/g, '');
        const prefix = `${config.prefix ? `${config.prefix}.` : ''}${file.split('/').slice(2, -1).join('.')}.`;
        chnArr.push([prefix, value.trim()]);
      }
    });
  })
  // 二维数组去重
  chnArr = chnArr.reduce((cur, next) => {
    cacheMap[next[1]] ? '' : cacheMap[next[1]] = true && cur.push(next);
    return cur;
  }, []);
  return config.autoKey ? uniquePinyinKey(chnArr) : chnArr;
}

/**
 * 
 * @param {Array} arr 二维数组
 * [
 *  ['recruit-fbi.pages.companyPackageManagement.packageManagement.', '成功']
 * ]
 * @return {Array} 二维数组 
 * [
 *  ['recruit-fbi.pages.companyPackageManagement.packageManagement.cheng_gong', '成功']
 * ]
 */

function uniquePinyinKey(arr) {
  const chnMap = {};
  const res = [];
  arr.map(([prefix, chn]) => {
    if (chnMap[prefix]) {
      chnMap[prefix][chn] = true;
    } else {
      chnMap[prefix] = {};
      chnMap[prefix][chn] = true;
    }
  });
  Object.entries(chnMap)
    .map(([prefix, sgChnMap]) => {
      //针对每个页面添加一个对象cacheMap用来缓存去重
      const cacheMap = {};
      Object.keys(sgChnMap)
        .sort((x, y) => x.length - y.length)
        .map(chn => {
          let limit = 2;
          let pinyinKey;
          let singleRepeat = false;
          let count = 0;
          const symbolReg = /[\u3002|\uff1f|\uff01|\uff0c|\u3001|\uff1b|\uff1a|\u201c|\u201d|\u2018|\u2019|\uff08|\uff09|\u300a|\u300b|\u3008|\u3009|\u3010|\u3011|\u300e|\u300f|\u300c|\u300d|\ufe43|\ufe44|\u3014|\u3015|\u2026|\u2014|\uff5e|\ufe4f|\uffe5|\u002d|\u005f|\u0028|\u0029)]/g;
          do {
            // 默认按limit个数来生成pinyinKey
            pinyinKey = generatePinyinKey(chn.replace(symbolReg, ''), limit);
            if (cacheMap[pinyinKey]) {
              // 若在cacheMap中有相同的pinyinKey，有以下两种情况：
              // 1. 中文的length比limit还要长，就limit += 2,继续往后取两个拼音字符连接
              // 2. 中文为同音词,长度一样，就在pinyinKey后面加上递加的数字
              singleRepeat = true;
              if (limit < chn.length) {
                limit += 2
              }else {
                // 假设cacheMap已有ce_shi(测试)的key，这时再来一个同音词(侧室),将生成ce_shi1的key,然后存入cacheMap
                // 若再来一个同音词(侧视),
                count ++;
                pinyinKey += String(count);
                cacheMap[pinyinKey] = true;
                singleRepeat = false;
              }
            }else {
              //若没缓存在cacheMap里的话，就存进去
              cacheMap[pinyinKey] = true;
              singleRepeat = false;
            }
          } while(singleRepeat) // 若在当前页面，cacheMap里有重复的pinyinKey,就返回到do中生成新的pinyinKey
          res.push([config.prefix, '', `${prefix}${pinyinKey}`, chn]);
        })
    })
  return res;
}

function generatePinyinKey(chn, limit) {
  const pinyinArr = pinyin(chn, {
    style: pinyin.STYLE_NORMAL
  });
  return pinyinArr.slice(0, Math.min(pinyinArr.length, limit)).join('_');
}


/**
 * @param {Array} chnArr
 * 根据chnMap生成excel
 */
function generateMCMSxlsx(chnArr) {
  const template = xlsx.parse(fs.readFileSync(config.templatePath ? config.templatePath : `${path.resolve(__dirname)}/template/mcms_intl-i18nadmin_en_US.xlsx`));
  template[0].data = template[0].data.concat(chnArr);
  const newBuffer = xlsx.build(template);
  try {
    fs.writeFileSync(`${process.cwd()}/${config.prefix}_autoTranslate_i18n.xlsx`, newBuffer);
    console.timeEnd('generate MCMSxlsx');
    console.log('build success');
    console.log(`words count: ${chnArr.length}`);
  }catch(e) {
    throw new Error(`build failed: ${e}`);
  }
}


module.exports = function() {
  const files = utils.getFiles();
  console.time('generate ChnArr');
  const chnArr = generateChnArr(files);
  console.timeEnd('generate ChnArr');
  console.time('generate MCMSxlsx')
  generateMCMSxlsx(chnArr);
  console.log(`file count: ${files.length}`);
};