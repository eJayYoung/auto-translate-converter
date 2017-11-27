#!/usr/bin/env node

const program = require('commander');
const packageInfo = require('../package.json');
const build = require('../src/cli/build');
const replace = require('../src/cli/replace');
const recovery = require('../src/cli/recovery');

program
  .version(packageInfo.version)
  .usage('[option] <file ...>')
  .option('-b, --build', 'automatic build excel')
  .option('-r, --replace', 'automatic replace to i18nKey')
  .option('-R, --recovery', 'recovery replace');

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

program
  .command('recovery')
  .action(function(env, options) {
    recovery();
  })
  
program.parse(process.argv);

if (program.build) {
  build();
}

if (program.replace) {
  replace();
}

if (program.recovery) {
  recovery();
}
