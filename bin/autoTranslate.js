#!/usr/bin/env node

const program = require('commander');
const packageInfo = require('../package.json');
const build = require('../lib/build');
const replace = require('../lib/replace');

program
  .version(packageInfo.version)
  .usage('[option] <file ...>')
  .option('-b, --build <file ...></file>', 'automatic build excel')
  .option('-r, --replace <file ...></file>', 'automatic replace to i18nKey')

program
  .command('build')
  .action(function(env, options) {
    build();
  });

program
  .command('replace')
  .action(function(env, options) {
    replace();
  });
  
program.parse(process.argv);

if (program.build) {
  build();
}

if (program.replace) {
  replace();
}
