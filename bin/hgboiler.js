#!/usr/bin/env node

const HargassnerTelnet = require('../index.js')

const { getopt } = require('stdio')
const options = getopt({
  ip: { description: 'IP address of the Hargassner boiler', args: 1, required: true },
  raw: { description: 'emit raw format instead of JSON' },
  model: { description: 'model name', args: 1, required: false, default: 'default' },
  once: { description: 'emit one reading and exit' },
  time: { description: 'add timestamp' },
  // list: { description: 'list available models' }
})

if (options.list) {
  // TODO
}

const heizung = new HargassnerTelnet({ IP: options.ip, model: options.model })

heizung.connect({ quiet: 1 })

heizung.on('data', data => {
  if (options.time) {
    data.timestamp = (new Date()).toISOString().substr(0, 19)
  }
  if (options.raw) {
    const row = heizung.raw.join(' ').trim()
    console.log(data.timestamp ? `${data.timestamp} ${row}` : row)
  } else {
    console.log(JSON.stringify(data))
  }
  if (options.once) {
    process.exit()
  }
})
