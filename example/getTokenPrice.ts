import {Engine} from '../src/engine'
import {getTestConfigs} from './shared/testConfigs'

const test = async () => {
  const configs = getTestConfigs(42161)
  const engine = new Engine(configs)
  await engine.initServices()

  const changedIn24h = await engine.PRICE.get24hChange({
    baseToken: {
      address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      decimal: 18,
      name: '',
      symbol: '',
    },
    quoteToken: {
      address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
      decimal: 6,
      name: '',
      symbol: '',
    },
    cToken: '0xC31E54c7a869B9FcBEcc14363CF510d1c41fa443',
    currentPrice: '1900',
    chainId: '42161'
  })

  const res = await engine.PRICE.getTokenPrices([
    '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
    '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0',
    '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
  ])

  console.log(res)
}

test()
