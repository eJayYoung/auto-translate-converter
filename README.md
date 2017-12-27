## autoTranslate

a tools for nowa Project automatic replace hard code literal to i18n(key)

## Install

via npm
```
npm install autotranslate -g
```

local install
```
git clone https://github.com/eJayYoung/autoTranslate.git
cd autoTranslate
npm link
```

then you can use command `auto-translate` in cli.

## Usage

there's few command for this tools.
### **`auto-translate -h`**

  ```
    Usage: autoTranslate [option] <file ...>


    Options:

      -V, --version  output the version number
      -b, --build    automatic build excel
      -r, --replace  automatic replace to i18nKey
      -h, --help     output usage information


    Commands:

      build
      replace
  ```

### **`auto-translate build`** <br>
  build excel file contain project chinese words, combine with the data in `zh-cn.js`. 

### **`auto-translate replace`** <br>
  replace i18n(key) to chinese words that needs to translate
> the cli also support relative path after `build` or `replace` command.

## Config

the default config in the cli
```javascript
{
  root: './src',
  ignore: ['app', 'i18n', 'images', 'lib', 'util'],
  basename: ['js', 'jsx'],
  options: {},
  prefix: process.cwd().split('/').pop(),
  autoKey: true,
}
```

you can also add a json file require named as `autoTranslate.config.js` in the root of your project, then you can cover the default config.


| property | type | default | description |
| --------- | ---- | ------- | ----------- |
| `root` | String | './src' | the root parse file path in project |
| `ignore` | Array | `['app', 'i18n', 'images', 'lib', 'util']` | default ignore catelog, support relative path |
| `prefix` | String | `process.cwd().split('/').pop()` | use your Project Name as default for the front part of key |
| `autoKey` | Boolean | `true` | if `true` automatic according defalut chinese translate to pinyin rule to generate the last part of key, otherwise `false` you can also custom fill the last part of key keep unique in single file so that you can better manage your code. |
| `customCall` | String | null | custom definition the replace callExpression. |

