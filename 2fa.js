#!/sr/bin/env node

import envPaths from 'env-paths'
import { readFile, writeFile } from 'fs/promises'
import { existsSync as exists } from 'fs'
import TOML from '@iarna/toml'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import inquirer from 'inquirer'
import { authenticator } from '@otplib/preset-default'
import qrcode from 'qrcode'

async function main () {
  const configFile = envPaths('2facli', { suffix: '' }).config
  let config = {}
  if (exists(configFile)) {
    config = TOML.parse(await readFile(configFile, 'utf8'))
  }
  config.secrets = config.secrets || {}

  yargs(hideBin(process.argv))
    .command(['code <name>', '$0 <name>'], 'Outputs a 2FA code', () => {}, ({ name }) => {
      if (!config.secrets[name]) {
        console.error(`No secret stored for "${name}".`)
        process.exit(1)
      }

      console.log(authenticator.generate(config.secrets[name]))
    })
    .command('add <name> <secret>', 'Add a new 2FA secret', y => {
      y.option('yes', {
        alias: 'y',
        type: 'boolean',
        description: 'Answer yes to all prompts'
      })
    }, async ({ secret, name, yes }) => {
      if (['code', 'qr', 'add', 'ls', 'completion'].includes(name)) {
        console.error(`"${name}" is a reserved command. Please calll it something else.`)
        process.exit(1)
      }

      if (config.secrets[name] && !yes) {
        const { ok } = await inquirer.prompt([{ name: 'ok', type: 'confirm', default: false, message: `"${name}" already exists. Are you sure you want to overwrite it?` }])
        if (!ok) {
          process.exit(1)
        }
      }

      config.secrets[name] = secret
      await writeFile(configFile, TOML.stringify(config))
      console.log(`"${name}" added.`)
    })
    .command('qr <name> [login]', 'Output a QR code for the secret', () => {}, ({ name, login = 'username' }) => {
      if (!config.secrets[name]) {
        console.error(`No secret stored for "${name}".`)
        process.exit(1)
      }
      const otpauth = authenticator.keyuri(login, name, config.secrets[name])
      qrcode.toString(otpauth, (err, imageUrl) => {
        if (err) {
          console.log('Error with QR')
          return
        }
        console.log(imageUrl)
      })
    })
    .command('ls', 'Show names of saved keys', () => {}, a => {
      console.log('These accounts have been saved:\n')
      console.log(Object.keys(config.secrets).join('\n') + '\n')
    })
    .completion('completion', (current, argv, done) => {
      if (argv._.length === 2) {
        return done(['code', 'qr', 'add', 'ls', 'completion'])
      }
      if (argv._.length === 3) {
        if (['code', 'qr'].includes(argv._[1])) {
          return done(Object.keys(config.secrets))
        }
      }
      done([])
    })
    .demandCommand(1)
    .alias('v', 'version')
    .alias('h', 'help')
    .example('$0 google', 'Get code for account named "google"')
    .example('$0 add google t1jmgt96g1dhvc4tv9819oak3xzs513r', 'Add a 2FA secret to get tokens')
    .example('$0 qr google', 'Generate a QR code on the console')
    .parse()
}
main()
