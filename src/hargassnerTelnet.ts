import net from 'net'
import fs from 'fs'

export type HargassnerOptions = {
  quiet?: boolean
  model?: string
  raw?: boolean
}

type callbackTypes = 'data' | 'connect'
type callbackFunctions = onDataCallbackFunction | onConnectCallbackFunction
type onDataCallbackFunction = (data: dynamicData | string) => void
type onConnectCallbackFunction = () => void

export class HargassnerTelnet {
  private ip: string
  private port: number
  private options: HargassnerOptions

  private client: net.Socket | undefined
  private callbacks: {
    data?: Array<onDataCallbackFunction>
    connect?: Array<onConnectCallbackFunction>
  } = { data: [], connect: [] }

  constructor(
    ip: string,
    port?: number,
    options: HargassnerOptions = {
      quiet: false,
      model: 'default'
    }
  ) {
    this.ip = ip
    this.port = port || 23
    this.options = options
  }

  connect(): void {
    // Start a connection with the heater
    this.client = new net.Socket()
    this.client.connect(this.port, this.ip, () => {
      if (!this.options.quiet) {
        console.log(`Connected to ${this.ip}:${this.port}`)
      }
    })

    // If the connection closed auto-reconnect
    this.client.on('close', () => {
      this.disconnect()
      this.connect()
    })

    // Handle the heater sending data
    this.client.on('data', (buffer) => {
      let data: dynamicData | string

      if (this.options.raw !== true) {
        // Raw not set parse data
        if (buffer.toString() === '0 \r\n') return
        const dataSplit = buffer.toString().split(' ')

        // Remove pm prefix
        if (dataSplit[0] === 'pm') dataSplit.shift()

        data = this.parse(dataSplit)
      } else {
        // Raw set just return the string
        data = buffer.toString()
      }

      this.callbacks.data?.forEach((callback) => callback(data))
    })
  }

  on(type: callbackTypes, callback: callbackFunctions): void {
    switch (type) {
      case 'data':
        this.callbacks.data?.push(callback as onDataCallbackFunction)
        break
      case 'connect':
        this.callbacks.connect?.push(callback as onConnectCallbackFunction)
        break
    }

    if (type === 'data') {
      this.callbacks.data?.push(callback)
    }
  }

  disconnect(): void {
    this.client?.destroy()
    this.client = undefined
  }

  parse(data: string[]): dynamicData {
    let modelString = ''
    try {
      modelString = fs.readFileSync(
        `${__dirname}/../lib/model/${this.options.model}.json`,
        'utf-8'
      )
    } catch (e) {
      console.log(`Model ${this.options.model} could not be found. Exiting...`)
      process.exit(1)
    }

    const model = JSON.parse(modelString)
    return parseModel(model, data)
  }
}

const isObject = (o: unknown) => o === Object(o) && !Array.isArray(o)

interface dynamicModel {
  // modelName?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

interface dynamicData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

function parseModel(model: dynamicModel, data: string[]) {
  const target: dynamicData = {}
  for (const key in model) {
    // If model entry is itself a object, then call this function recursively.
    if (isObject(model[key])) {
      target[key] = parseModel(model[key], data)
      continue
    }

    // Do the actual work
    let value
    const spec = model[key]

    // Ignore (used for documentation)
    if (typeof spec === 'string') {
      continue
    }

    // If spec is a number use that entry from the data array,
    // otherwise if the spec is a array, then digitally decode it.
    if (typeof spec === 'number') {
      value = data[spec]
    } else if (Array.isArray(spec)) {
      value = (parseInt(data[spec[0]], 16) & Number(spec[1])) > 0
    } // else: "Unexpected configuration!"
    target[key] = value
  }
  return target
}
