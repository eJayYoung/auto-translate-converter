#!/usr/bin/env node

const program = require('commander');
const packageInfo = require('../../package.json');
const Translate = require('../Translate.js');

const t = new Translate();

program
  .version(packageInfo.version)
  .usage('[option] <file ...>')
  .option('-b, --build', 'automatic build excel')
  .option('-r, --replace', 'automatic replace i18n');

program
  .command('build')
  .action(function(env, options) {
    t.build();
  });

program
  .command('replace')
  .action(function(env, options) {
    t.replace();
  });

program.parse(process.argv);

if (program.build) {
  t.build();
}

if (program.replace) {
  t.replace();
}
