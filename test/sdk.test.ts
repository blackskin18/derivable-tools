import { DerionSDK } from '../src/sdk/sdk'
import { groupBy, throwError } from '../src/sdk/utils'
import { Interceptor } from './shared/libs/interceptor'
import { AssistedJsonRpcProvider } from 'assisted-json-rpc-provider'
import { hexZeroPad } from 'ethers/lib/utils'
import { JsonRpcProvider } from '@ethersproject/providers'
import { NATIVE_ADDRESS, POOL_IDS } from '../src/utils/constant'
import { numberToWei } from '../src/utils/helper'
import { Wallet } from 'ethers'
import { calcPositionState, formatPositionView } from '../src/sdk/utils/positions'

const interceptor = new Interceptor()

describe('Derion SDK', () => {
  beforeEach(() => {
    interceptor.setContext(expect.getState().currentTestName)
  })

  test('sdk-flow', async () => {
    const chainId = 137
    const accountAddress = '0xE61383556642AF1Bd7c5756b13f19A63Dc8601df'

    const rpcUrl = process.env['RPC_' + chainId] ?? throwError()
    const scanApi = process.env['SCAN_API_' + chainId] ?? throwError()

    const sdk = new DerionSDK({ chainId })
    await sdk.init()

    const provider = new AssistedJsonRpcProvider(
      new JsonRpcProvider(rpcUrl), {
        url: scanApi,
        apiKeys: process.env['SCAN_API_KEY_' + chainId]?.split(',') ?? throwError(),
      }
    )
    const accTopic = hexZeroPad(accountAddress, 32)
    const logs = await provider.getLogs({
      fromBlock: 0,
      toBlock: Number.MAX_SAFE_INTEGER,
      topics: [
        [],
        [null, accTopic],
        [null, null, accTopic],
        [null, null, null, accTopic],
      ],
    })

    const txLogs = Object.values(groupBy(logs, 'transactionHash'))
    const poolAdrs = sdk.extractPoolAddresses(txLogs)

    const stateLoader = sdk.getStateLoader(rpcUrl)

    const pools = await stateLoader.loadPools(poolAdrs)

    const account = sdk.createAccount(accountAddress)
    account.processLogs(txLogs)
    account.processLogs(txLogs) // the second call does nothing
    
    const posViews = Object.values(account.positions).map(pos => calcPositionState(pos, pools))


    console.log(posViews)

    console.log(...posViews.map(pv => formatPositionView(pv)))

    // await stateLoader.update({ pools }) // not nessesary here
    // console.log(Object.values(pools))
    // console.log(Object.values(account.positions))
  })
    test('derion-sdk-swap', async () => {
      const chainId = 42161
      const accountAddress = '0xD42d6d58F95A3DA9011EfEcA086200A64B266c10'
      const poolsLoad = ['0x3ed9997b3039b4A000f1BAfF3F6104FB05F4e53B', '0xAaf8FAC8F5709B0c954c9Af1d369A9b157e31FfE']
      const rpcUrl = process.env['RPC_' + chainId] ?? throwError()
      const scanApi = process.env['SCAN_API_' + chainId] ?? throwError()
      const privateKey = process.env['PRIVATE_KEY'] ?? throwError()
      const sdk = new DerionSDK({ chainId })
      await sdk.init()
  
      const provider = new AssistedJsonRpcProvider(
        new JsonRpcProvider(rpcUrl), {
          url: scanApi,
          apiKeys: process.env['SCAN_API_KEY_' + chainId]?.split(',') ?? throwError(),
        }
      )
      const signer = new Wallet(privateKey, provider);

      const accTopic = hexZeroPad(accountAddress, 32)
      const logs = await provider.getLogs({
        fromBlock: 0,
        toBlock: Number.MAX_SAFE_INTEGER,
        topics: [
          [],
          [null, accTopic],
          [null, null, accTopic],
          [null, null, null, accTopic],
        ],
      })
      console.log(logs.length)
      const txLogs = Object.values(groupBy(logs, 'transactionHash'))
      const poolAdrs = sdk.extractPoolAddresses(txLogs)
      console.log(poolAdrs)

      const stateLoader = sdk.getStateLoader(rpcUrl)
      const pools = await stateLoader.loadPools(poolAdrs)
      const account = sdk.createAccount(accountAddress)
      account.processLogs(txLogs)
      const swapper = sdk.createSwapper(rpcUrl)
      // console.log(account.positions, pools)
      try {
        const swapResult = await swapper.simulate({
          tokenIn: NATIVE_ADDRESS,
          tokenOut: `0xf3cE4cbfF83AE70e9F76b22cd9b683F167d396dd-${POOL_IDS.A}`,
          amount: numberToWei(0.00001, 18),
          deps: {
            signer,
            pools
          }
        })
        expect(swapResult.length).toEqual(0)
      } catch (error) {
        console.log(error)
      }
    })
    test('derion-sdk-swap-use-agg', async () => {
      const chainId = 42161
      const accountAddress = '0xD42d6d58F95A3DA9011EfEcA086200A64B266c10'
      const poolsLoad = ['0x3ed9997b3039b4A000f1BAfF3F6104FB05F4e53B', '0xAaf8FAC8F5709B0c954c9Af1d369A9b157e31FfE']
      const rpcUrl = process.env['RPC_' + chainId] ?? throwError()
      const scanApi = process.env['SCAN_API_' + chainId] ?? throwError()
      const privateKey = process.env['PRIVATE_KEY'] ?? throwError()
      const sdk = new DerionSDK({ chainId })
      await sdk.init()
  
      const provider = new AssistedJsonRpcProvider(
        new JsonRpcProvider(rpcUrl), {
          url: scanApi,
          apiKeys: process.env['SCAN_API_KEY_' + chainId]?.split(',') ?? throwError(),
        }
      )
      const signer = new Wallet(privateKey, provider);

      const accTopic = hexZeroPad(accountAddress, 32)
      const logs = await provider.getLogs({
        fromBlock: 0,
        toBlock: Number.MAX_SAFE_INTEGER,
        topics: [
          [],
          [null, accTopic],
          [null, null, accTopic],
          [null, null, null, accTopic],
        ],
      })
      console.log(logs.length)
      const txLogs = Object.values(groupBy(logs, 'transactionHash'))
      const poolAdrs = sdk.extractPoolAddresses(txLogs)
      console.log(poolAdrs)

      const stateLoader = sdk.getStateLoader(rpcUrl)
      const pools = await stateLoader.loadPools(poolAdrs)
      const account = sdk.createAccount(accountAddress)
      account.processLogs(txLogs)
      const swapper = sdk.createSwapper(rpcUrl)
      // console.log(account.positions, pools)
      try {
        const swapResult = await swapper.simulate({
          tokenIn: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC
          tokenOut: `0xf3cE4cbfF83AE70e9F76b22cd9b683F167d396dd-${POOL_IDS.A}`,
          amount: '100',
          deps: {
            signer,
            pools
          }
        })
        expect(swapResult.length).toEqual(0)
      } catch (error) {
        console.log(error)
      }
    })
})
