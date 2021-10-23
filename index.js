#! /usr/bin/env node
const { program } = require('commander')
const figlet = require('figlet')
const chalk = require('chalk')
const spawn = require('cross-spawn')

const list = require('./commands/list')
const add = require('./commands/add')
const markDone = require('./commands/markDone')
const removeDone = require('./commands/removeDone')

//console.log(chalk.yellow(figlet.textSync('Glow', { horizontalLayout: 'full' })))

program.version('0.0.1', '-v, --version', 'output the current version')
program.option('-c, --config <path>', 'set config path', './deploy.conf')
program.showSuggestionAfterError()

program
    .command('list')
    .description('List all the TODO tasks')
    .action(list)

program
    .command('add <task>')
    .description('Add a new TODO task')
    .action(add)

program
    .command('mark-done')
    .description('Mark task done')
    .requiredOption('-t, --tasks <tasks numbers separeted by space>', 'The tasks to mark done.')
    .action(markDone)

program
    .command('remove-done')
    .description('Remove all tasks marked as done')
    .action(removeDone)

program
    .command('dotnet').alias('d')
    .description('Execute dotnet --version command')
    .action(() => {
        console.log(chalk.cyan('dotnet --version'))
        spawn.sync('dotnet --version', { stdio: 'inherit' })
    })

program
  .command('setup [env]')
  .description('run setup commands for all envs')
  .option('-s, --setup_mode <mode>', 'Which setup mode to use', 'normal')
  .action((env, options) => {
    env = env || 'all';
    console.log('read config from %s', program.opts().config);
    console.log('setup for %s env(s) with %s mode', env, options.setup_mode);
  });

program
    .command('exec <script>')
    .alias('ex')
    .description('execute the given remote cmd')
    .option('-e, --exec_mode <mode>', 'Which exec mode to use', 'fast')
    .action((script, options) => {
      console.log('read config from %s', program.opts().config);
      console.log('exec "%s" using %s mode and config %s', script, options.exec_mode, program.opts().config);
    }).addHelpText('after', `
  Examples:
    $ deploy exec sequential
    $ deploy exec async`
    );

program.parse()