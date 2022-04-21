const {Command, flags} = require('@oclif/command')
const fetch = (...args) => import("node-fetch").then(module => module.default(...args))

class OclifExampleSingleJsCommand extends Command {

  static strict = false

  previousPrices = {}

  priceFrame = 0

  notify = async function () {
    let currPrices = {}
    for (const [pair, prevPrice] of Object.entries(this.previousPrices)) {
      let currPrice = (await (await fetch(`https://api.uphold.com/v0/ticker/${pair}`)).json())["ask"]
      if (prevPrice != 0 && Math.abs(currPrice - prevPrice) >= this.priceFrame * prevPrice / 100) {
        if (currPrice > prevPrice) {
          this.log(`Price is up for pair ${pair} with more than ${this.priceFrame}%. The old price was ${prevPrice}, while the new price is ${currPrice}.`)
        } else {
          this.log(`Price is down for pair ${pair} with more than ${this.priceFrame}%. The old price was ${prevPrice}, while the new price is ${currPrice}.`)
        }
      }
      currPrices[pair] = currPrice
    }
    this.previousPrices = currPrices
  }

  async run() {
    const {argv, flags} = this.parse(OclifExampleSingleJsCommand)
    const time = Number(flags.time || '5')
    this.priceFrame = Number(flags.price || '0.01')
    argv.forEach(pair => {(this.previousPrices)[pair] = 0})
    this.notify()
    setInterval(this.notify.bind(this), time * 1000)
  }
}

OclifExampleSingleJsCommand.description = `Starts the alert notification bot
...
Notify for every interval of '--time' seconds if price oscillatated (up or down) more than '--price' (percentage-wise) for the pairs in args.
Example: uphold-bot --time 5 --price 0.01 BTC-USD ETH-EUR
Or equivalently: uphold-bot -t 5 -p 0.01 BTC-USD ETH-EUR
`

OclifExampleSingleJsCommand.flags = {
  version: flags.version({char: 'v'}),
  help: flags.help({char: 'h'}),
  time: flags.string({char: 't', description: 'time interval (in seconds) for Uphold API price fetching'}),
  price: flags.string({char: 'p', description: 'price change interval (in percentages) for which a notification will be fired'})
}

module.exports = OclifExampleSingleJsCommand
