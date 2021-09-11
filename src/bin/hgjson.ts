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
  array: true | 'numbered' | 'raw' | 'numbered-raw' | undefined
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
  .option('array', {
    alias: 'a',
    choices: [true, 'numbered', 'raw', 'numbered-raw']
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
  raw: argv.raw || argv.array !== undefined
})

client.on('data', (data) => {
  let string: unknown

  // if --array option is specified
  if (argv.array) {
    // create array
    let array: Array<string> = data.split(' ')

    // if array is not supposed to be raw remove the static pm entry
    if (argv.array !== 'numbered-raw' && argv.array !== 'raw') array.shift()

    // if array is supposed to be numbered add add index to every entry and output as object
    if (argv.array === 'numbered' || argv.array === 'numbered-raw') {
      array = Object.assign({}, array)
    }

    string = argv.formatted ? array : JSON.stringify(array)
  } else {
    // --array option is not specified

    // if formatted or raw is set output data as is, otherwise stringify
    string = argv.formatted || argv.raw ? data : JSON.stringify(data)
  }

  console.log(string)
  // Handle --once
  if (argv.once) process.exit(0)
})

client.connect()
