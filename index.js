#! /usr/bin/env node
// noinspection RequiredAttributes

const { program, Option } = require('commander')
const figlet = require('figlet')
const chalk = require('chalk')
const spawn = require('cross-spawn')
const exec = require('child_process').exec;

const list = require('./commands/list')
const add = require('./commands/add')
const markDone = require('./commands/markDone')
const removeDone = require('./commands/removeDone')

program.version('0.0.1', '--version', 'output the current version')
program.addHelpText('beforeAll', chalk.yellow(figlet.textSync('Glow', { horizontalLayout: 'full' })))
program.addHelpText('beforeAll', 'Glow v0.0.1')
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
    .command('git')
    .description('Execute git commands')
    .option('-u, --username', 'Show git username')
    .option('-e, --email', 'Show git email')
    .action((options) => {
        let executed = false
		function getGitUsername(callback) {
			execute("git config --global user.name", (name) => {
                callback(name.replace("\n", ""))
			})
		}        
		function getGitEmail(callback) {
            execute("git config --global user.email", (email) => {
                callback(email.replace("\n", ""))
            })
		}
        if (options.username) {
            executed = true
            getGitUsername((name, error) => {
                if (name && name?.length > 0) console.log(name)
                if (error && error?.length > 0) console.log(error)
            })
        }
        if (options.email) {
            executed = true
            getGitEmail((email, error) => {
                if (email && email?.length > 0) console.log(email)
                if (error && error?.length > 0) console.log(error)
            })
        }
        if (executed === false) {
            console.log(chalk.yellow('No valid option found! Use "glow git -h" for help'))
            program.help({ error: true })
        }
    })

program
    .command('gitversion').alias('gv')
    .description('Execute dotnet gitversion')
    .addOption(new Option('-v, --variable <var>', 'Which variable to use')
        .default('SemVer').choices(['SemVer', 'MajorMinorPatch', 'NuGetVersionV2']))
    .action((options) => {
        function getGitVersion(cb) {
            execute(`dotnet gitversion "${process.cwd()}" /showvariable ${options['variable']}`, (version, stdout, stderr) => {
                cb(version.replace("\n", ""), stdout, stderr)
            })
        }
        getGitVersion((version, error) => {
            if (version && version?.length > 0) console.log(version)
            if (error && error?.length > 0) console.log(error)
        })
    })
    .addHelpText('after', `
Examples:
  $ glow gv
  $ glow gv -v MajorMinorPatch`
)

program
    .command('dotnet').alias('d')
    .description('Execute dotnet --version command')
    .action(() => {
        console.log(chalk.grey('dotnet --version'))
        spawn.sync('dotnet --version', { stdio: 'inherit' })
    })

//spawn.sync('dotnet gitversion \"' + process.cwd() + '\"', ['/showvariable', 'semver'], { stdio: 'inherit' })

function execute(command, callback){
    console.log(chalk.grey(command))
    exec(command, (error, stdout, stderr) => {
        if (stderr && stderr?.length > 0) {
            callback(stdout, chalk.red(error), chalk.red(stderr))
        } else {
            callback(stdout)
        }
    })
}

program.parse()