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

then you can use command `autoTranslate` in cli.

## Usage

there's few command for this tools.

- `autoTranslate build` build excel file contain project chinese words

- `autoTranslate replace` replace i18n(key) to chinese words that needs to translate

> the cli also support relative path after `build` or `replace` command.

- `autoTranslate -h`

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

## config

the default config in the cli
```js
{
  root: './src',
  ignore: ['app', 'i18n', 'images', 'lib', 'util'],
  basename: ['js', 'jsx'],
  options: {},
  prefix: process.cwd().split('/').pop(),
  autoKey: true,
}
```

you can also add a json file must named as `autoTranslate.config.js` in the root of your project, then you can cover the default config.

### `root`

`String`

the root file path in project for the cli

### `ignore`

`Array`

the file path, both support catelog or relative path

default ignore the nowa project catelog, such as `app`, `i18n`, `images`, `lib`, `util`

### `prefix`

`String`

default use Project Name as the front part of key

### `autoKey`

`Boolean`

if `true` automatic according defalut chinese translate to pinyin rule to generate the last part of key, otherwise `false` you can also custom unique the last part of key so that you can better manage your code.




