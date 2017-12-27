#!/usr/bin/env node

const program = require('commander');
const pkg = require('../package.json');
const build = require('../lib/build');
const replace = require('../lib/replace');

program
  .version(pkg.version)
  .usage('[option] <file ...>')
  .option('-b, --build', 'automatic build excel')
  .option('-r, --replace', 'automatic replace to i18nKey')
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
