import { IEW, NUM, bn } from '../src/utils/helper'
import { calcAmountOuts } from './logic/calcAmountOuts'
import { getBalanceAndAllowance } from './logic/getBalanceAndAllowance'
import { getLargestPoolAddress } from './logic/getPairAddress'
import { getPairDetailV3 } from './logic/getPairDetailV3'
import { getResource } from './logic/getResource'
import { history } from './logic/history'
import { swap } from './logic/swap'
import _ from "lodash";
import { TestConfiguration } from './shared/configurations/configurations'

import { Interceptor } from './shared/libs/interceptor'
import { Engine } from '../src/engine'
const interceptor = new Interceptor()

const confs = new TestConfiguration()

function genConfig(chainId, account) {
  return {
    ...confs.get(chainId),
    account,
  }
}

describe('Derivable Tools', () => {
  beforeEach(() => {
    interceptor.setContext(expect.getState().currentTestName)
  })

  test('AmountOut-arb', async () => {
    const [ res, gasUsed ] = await calcAmountOuts(
      genConfig(42161, '0xE61383556642AF1Bd7c5756b13f19A63Dc8601df'),
      ['0xBb8b02f3a4C3598e6830FC6740F57af3a03e2c96'],
      0.1,
    )
    const amountOut = res[res.length-1].amountOut
    expect(gasUsed.toNumber()).toBeCloseTo(3900000, -7)
    expect(amountOut.toNumber()).toBeCloseTo(41750, -3)
  })

  test('AmountOut-bsc', async () => {
    const [ res, gasUsed ] = await calcAmountOuts(
      genConfig(56, '0xE61383556642AF1Bd7c5756b13f19A63Dc8601df'),
      ['0x2C3d0F3dcD28b5481a50E1DD0071378f92D56954'],
      0.1,
    )
    const amountOut = res[res.length-1].amountOut
    expect(gasUsed.toNumber()).toEqual(298063)
    expect(amountOut.toNumber()).toEqual(99973)
  })

  test('AmountOut-openingfee-opbnb', async () => {
    const [res, gasUsed] = await calcAmountOuts(
      genConfig(204, '0x0e2e52eFCF2207Bce876924810beb7f83CcA2D2F'),
      ['0x68b2663e8b566c6ec976b2719ddee750be318647'],
      0.1
    )
    const amountOut = res[res.length - 1].amountOut
    expect(gasUsed.toNumber()).toBeCloseTo(3900000, -7)
    expect(NUM(amountOut)).toBeCloseTo(99965, -3)
  })

  test('AmountOut-closingfee-opbnb', async () => { // 101456
    const [res, gasUsed] = await calcAmountOuts(
      genConfig(204, '0x0e2e52eFCF2207Bce876924810beb7f83CcA2D2F'),
      ['0x63A6eA7677d45d0120ed8C72D55876069f295B95'],
      0.1
    )
    const amountOut = res[res.length - 1].amountOut
    expect(gasUsed.toNumber()).toBeCloseTo(3900000, -7)
    expect(NUM(IEW(amountOut, 9))).toBeCloseTo(130, -2)
  })

  test('AmountOut-fee-opbnb', async () => { // 97999
    const [res, gasUsed] = await calcAmountOuts(
      genConfig(204, '0x0e2e52eFCF2207Bce876924810beb7f83CcA2D2F'),
      ['0x920A140a3F2c3aE7940A392b51815e273b115A53'],
      0.1
    )
    const amountOut = res[res.length - 1].amountOut
    expect(gasUsed.toNumber()).toBeCloseTo(3900000, -7)
    expect(NUM(IEW(amountOut, 12))).toBeCloseTo(45, -1)
  })
  test('BnA-base', async () => {
    const { balances, allowances, maturities } = await getBalanceAndAllowance(
      genConfig(8453, '0xE61383556642AF1Bd7c5756b13f19A63Dc8601df'),
      [],
    )
    expect(balances['0x5f41DdC103d4Bf07aec45C3EEbEEf47520b98fD2']).toEqual(bn('0x010f0cccddeae95f0000'))
    expect(allowances['0xF9afc64E5Dde15E941e2C01dd848b2EC67FD08b8-16']).toEqual(bn('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'))
    expect(maturities['0x44C46037AD3621f95a488d898c1e9CFDa0F58e95-32']).toEqual(bn('0x6504358b'))
  })

  test('BnA-bsc', async () => {
    const { balances, allowances, maturities } = await getBalanceAndAllowance(
      genConfig(56, '0xE61383556642AF1Bd7c5756b13f19A63Dc8601df'),
      [],
    )
    expect(balances['0xBa95100a0c3abaD1e10414Be77347D3D0900D8c2']).toEqual(bn('0xbfa90a51783ee28500f8'))
    expect(allowances['0x55d398326f99059fF775485246999027B3197955']).toEqual(bn('0x1ac36bad4d8dbc4cfb'))
    expect(maturities['0x2C3d0F3dcD28b5481a50E1DD0071378f92D56954-48']).toBeUndefined()
  })

  test('BnA-arb', async () => {
    const { balances, allowances, maturities } = await getBalanceAndAllowance(
      genConfig(42161, '0xE61383556642AF1Bd7c5756b13f19A63Dc8601df'),
      [],
    )
    expect(balances['0x7df120445BfDd80A3c9fbFd3acC3b22123b58D1e']).toEqual(bn('0x08ffedfb595975900000'))
    expect(allowances['0x867A3c9256911AEF110f4e626936Fa3BBc750cBE-48']).toEqual(bn('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'))
    expect(maturities['0x867A3c9256911AEF110f4e626936Fa3BBc750cBE-16']).toEqual(bn('0x658aa708'))
  })

  test('LargestPool', async () => {
    const chainId = 42161
    const baseToken = '0x82af49447d8a07e3bd95bd0d56f35241523fbab1'
    const quoteTokens = ['0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8']
    const pairAddress = await getLargestPoolAddress(chainId, baseToken, quoteTokens)
    expect(pairAddress).toEqual('0xC31E54c7a869B9FcBEcc14363CF510d1c41fa443')
  })

  // test('PairDetailV2', async () => {
  //   const pairDetail = await getPairDetail(
  //     genConfig(42161, ''),
  //     '0x8165c70b01b7807351EF0c5ffD3EF010cAbC16fB',
  //     ['0x8165c70b01b7807351EF0c5ffD3EF010cAbC16fB', '0x905dfCD5649217c42684f23958568e533C711Aa3'],
  //   )
  //   expect(pairDetail).toBeDefined()
  // })

  test('PairDetailV3', async () => {
    const { pairInfo } = await getPairDetailV3(
      genConfig(42161, ''),
      '0xC31E54c7a869B9FcBEcc14363CF510d1c41fa443'
    )
    expect(pairInfo.token0.name).toEqual('Wrapped Ether')
    expect(pairInfo.token1.name).toEqual('USD Coin (Arb1)')
  })

  test('Resource-arb', async () => {
    const poolAddress = '0x867A3c9256911AEF110f4e626936Fa3BBc750cBE'
    const resource = await getResource(
      genConfig(42161, '0xE61383556642AF1Bd7c5756b13f19A63Dc8601df'),
      [poolAddress],
    )

    const pool = resource.newResource.pools[poolAddress] ?? resource.whiteListResource.pools[poolAddress] ?? resource.cacheResource.pools[poolAddress]
    expect(pool).toBeDefined()
    expect(pool?.riskFactor).toEqual('0.006344299538270911')
  })

  test('Resource-bsc', async () => {
    const poolAddress = '0x2C3d0F3dcD28b5481a50E1DD0071378f92D56954'
    const resource = await getResource(
      genConfig(56, '0xE61383556642AF1Bd7c5756b13f19A63Dc8601df'),
      [poolAddress],
    )

    const pool = resource.newResource.pools[poolAddress] ?? resource.whiteListResource.pools[poolAddress] ?? resource.cacheResource.pools[poolAddress]
    expect(pool).toBeDefined()
    expect(pool?.riskFactor).toEqual('-0.005637139247406234')
  })

  test('Resource-opbnb', async () => {
    const poolAddress = '0x425a2D1Bb983614d0866410A5fB14ac9ddE7927e'
    const resource = await getResource(
      genConfig(204, '0xE61383556642AF1Bd7c5756b13f19A63Dc8601df'),
      [poolAddress],
    )

    const pool = resource.newResource.pools[poolAddress] ?? resource.whiteListResource.pools[poolAddress] ?? resource.cacheResource.pools[poolAddress]
    expect(pool).toBeDefined()
    expect(pool?.riskFactor).toEqual('14.238916024088980636')
  })

  test('search-bsc', async () => {
    const configs = genConfig(56, '0xE61383556642AF1Bd7c5756b13f19A63Dc8601df')
    const engine = new Engine(configs)
    await engine.initServices()

    const idxs = await engine.RESOURCE.searchIndex('CAKE')

    const keys = Object.keys(idxs)
    expect(keys.length).toEqual(2)
    expect(idxs[keys[1]].pools.length).toEqual(4)
  })

  test('search-opbnb', async () => {
    const configs = genConfig(204, '0xE61383556642AF1Bd7c5756b13f19A63Dc8601df')
    const engine = new Engine(configs)
    await engine.initServices()

    const idxs = await engine.RESOURCE.searchIndex('UI')

    const keys = Object.keys(idxs)
    expect(keys.length).toEqual(1)
    expect(idxs[keys[0]].pools.length).toEqual(1)
  })

  test('History', async () => {
    const { swapTxs, positions } = await history(
      genConfig(42161, '0xE61383556642AF1Bd7c5756b13f19A63Dc8601df'),
      [],
      '0x9E37cb775a047Ae99FC5A24dDED834127c4180cD'
    )
    const keys = Object.keys(positions)
    expect(keys.length).toEqual(3)
    expect(positions[keys[0]].avgPriceR).toEqual('2195.511006')
    expect(positions[keys[1]].avgPrice).toEqual('0.000380553119609019')
    expect(positions[keys[2]].amountR).toEqual(bn('0x01100ffba9e0c7'))
  })

  test('History-bsc', async () => {
    const { swapTxs, positions } = await history(
      genConfig(56, '0x5555a222c465b1873421d844e5d89ed8eb3E5555'),
      [],
      '0x1F3fdE32c8Cc19a0BE30a94EDeaD9cE34279b1FF'
    )
    const keys = Object.keys(positions)
    expect(keys.length).toEqual(5)
    expect(positions['0xcd7FEDD23ae8F12FCBC3bdC86e09Fd2c184c7c4a-48'].avgPriceR).toEqual('316.145668790469279013')
    expect(positions['0xf8BA6a71BB47Ea6c43a18071b78422576B5B295c-48'].avgPrice).toEqual('2.49178155904397899')
    expect(positions['0x2C3d0F3dcD28b5481a50E1DD0071378f92D56954-48'].balanceForPriceR).toEqual(bn('0x1c8f2c56a54f6b9e'))
    expect(positions['0x63187130DdBF058F5167dDAD551920199D1D8de5-48'].balanceForPrice).toEqual(bn('0x22e339714c045d3b'))
    expect(positions['0x1F3fdE32c8Cc19a0BE30a94EDeaD9cE34279b1FF-48'].amountR).toEqual(bn('0x29a2241af62c0000'))
  })

  test('Swap', async () => {
    await swap(
      genConfig(42161, '0xE61383556642AF1Bd7c5756b13f19A63Dc8601df'),
      ['0xBb8b02f3a4C3598e6830FC6740F57af3a03e2c96'],
      '0xBb8b02f3a4C3598e6830FC6740F57af3a03e2c96',
      0.1,
    )
  })
})
