#!/usr/bin/env node
import * as yargs from 'yargs'
import { HargassnerOptions, HargassnerTelnet } from '../hargassnerTelnet'

type arguments = {
  ip: string
  port: number
  model: HargassnerOptions['model']
  once: true | undefined
  formatted: true | undefined
  raw: true | undefined
  quiet: true | undefined
}

// Get arguments form CLI command
const argv: arguments = yargs
  .scriptName('hgjson')
  .option('ip', {
    type: 'string',
    demandOption: true
  })
  .option('port', {
    alias: 'p',
    default: 23,
    type: 'number'
  })
  .option('model', {
    alias: 'm',
    default: 'default',
    choices: ['default', 'nano2', 'classicLambda'],
    type: 'string'
  })
  .option('once', { alias: 'o', type: 'boolean' })
  .option('formatted', {
    alias: 'f',
    type: 'boolean',
    conflicts: 'raw'
  })
  .option('raw', {
    alias: 'r',
    type: 'boolean',
    conflicts: 'formatted'
  })
  .option('quiet', {
    alias: 'q',
    type: 'boolean'
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .help().argv as any

const client = new HargassnerTelnet(argv.ip, argv.port, {
  model: argv.model,
  quiet: argv.quiet,
  raw: argv.raw
})

client.on('data', (data) => {
  console.log(argv.formatted ? data : JSON.stringify(data))
  // Handle --once
  if (argv.once) process.exit(0)
})

client.connect()
