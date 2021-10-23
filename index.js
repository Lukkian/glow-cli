#! /usr/bin/env node

const { program, Option, Argument, InvalidArgumentError } = require('commander')
const figlet = require('figlet')
const chalk = require('chalk')
const spawn = require('cross-spawn')
const exec = require('child_process').exec
const semver = require('semver')

const list = require('./commands/list')
const add = require('./commands/add')
const markDone = require('./commands/markDone')
const removeDone = require('./commands/removeDone')

program.version('0.0.1', '--version', 'output the current version')
program.option('-d, --debug', 'output extra debugging information and does not execute external commands')
program.option('--unsafe', 'bypass enforced debug mode on pre-release versions, please be careful and do not use indiscriminately')
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
			}, true)
		}        
		function getGitEmail(callback) {
            execute("git config --global user.email", (email) => {
                callback(email.replace("\n", ""))
            }, true)
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
            }, true)
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
    .action(() => executeSpawn('dotnet --version'))

program
    .command('feature').alias('f')
    .addArgument(new Argument('[action]', 'the git flow feature action').choices(['start', 'publish', 'track', 'finish']))
    .argument('[feature-name]', 'the name of the feature')
    .description('Execute git flow feature workflow')
    .action((action, featureName) => {
        if (action) {
            if (featureName) {
                executeSpawn('git flow feature ' + action + ' ' + featureName)
            } else {
                console.error(chalk.red('error: missing required argument \'feature-name\''))
            }
        } else {
            executeSpawn('git flow feature', true)
        }
    })

program
    .command('release').alias('r')
    .addArgument(new Argument('[action]', 'the git flow release action').choices(['start', 'publish', 'finish']))
    .argument('[version]', 'the release version, must be a valid semantic version', validateVersion)
    .description('Execute git flow release workflow')
    .action((action, version) => {
        if (action) {
            if (semver.valid(version)) {
                executeSpawn('git flow release ' + action + ' ' + version)
            } else {
                console.error(chalk.red('error: please inform a valid semantic version'))
                program.help({ error: true })
            }
        } else {
            executeSpawn('git flow release', true)
        }
    })

function validateVersion(value) {
    const parsedValue = semver.valid(value)
    if (parsedValue) {
        return parsedValue
    }
    throw new InvalidArgumentError('error: please inform a valid semantic version')
}

function executeSpawn(command, byPassDebugMode) {
    console.log(chalk.grey(command))
    // byPassDebugMode should be used for safe and (basically) read-only commands
    if (program.opts().unsafe || byPassDebugMode) { } else
    if (program.opts().debug) {
        console.log(chalk.yellowBright(`DEBUG MODE will not allow ${chalk.underline('most')} external commands`))
        return
    }
    //spawn.sync('command', ['--options...'], { stdio: 'inherit' })
    spawn.sync(command, { stdio: 'inherit' })
}

function execute(command, callback, byPassDebugMode){
    console.log(chalk.grey(command))
    // byPassDebugMode should be used for safe and (basically) read-only commands
    if (program.opts().unsafe || byPassDebugMode) { } else
    if (program.opts().debug) {
        console.log(chalk.yellowBright(`DEBUG MODE will not allow ${chalk.underline('most')} external commands`))
        return
    }
    exec(command, (error, stdout, stderr) => {
        if (stderr && stderr?.length > 0) {
            callback(stdout, chalk.red(error), chalk.red(stderr))
        } else {
            callback(stdout)
        }
    })
}

// debug mode is enabled by default until we get a stable version
program.setOptionValue('debug', true)
program.parse()