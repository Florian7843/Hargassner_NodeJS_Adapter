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
    demandOption: true,
    description: 'The IP-Address of the Hargassner oven.'
  })
  .option('port', {
    alias: 'p',
    default: 23,
    type: 'number',
    description: 'The endpoint port of the connection.'
  })
  .option('model', {
    alias: 'm',
    default: 'default',
    choices: ['default', 'nano2', 'classicLambda'],
    type: 'string',
    description: 'The model of the Hargassner oven.'
  })
  .option('once', {
    alias: 'o',
    type: 'boolean',
    description: 'Only read parameters once.'
  })
  .option('formatted', {
    alias: 'f',
    type: 'boolean',
    conflicts: 'raw',
    description: 'Output data formatted'
  })
  .option('raw', {
    alias: 'r',
    type: 'boolean',
    conflicts: 'formatted',
    description: 'Output data like Hargassner sends it.'
  })
  .option('array', {
    alias: 'a',
    choices: [true, 'numbered', 'raw', 'numbered-raw'],
    description: 'Output data as array/numbed-object.'
  })
  .option('quiet', {
    alias: 'q',
    type: 'boolean',
    description: "Do not display 'Connected to x.x.x.x:x'"
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

    string = JSON.stringify(array, null, argv.formatted ? 2 : 0)
  } else {
    // --array option is not specified

    // if --raw, then output as is, otherwise stringify. if --formatted then intent otherwise don't
    if (argv.raw) string = data
    else string = JSON.stringify(data, null, argv.formatted ? 2 : 0)
  }

  console.log(string)
  // Handle --once
  if (argv.once) process.exit(0)
})

client.connect()
