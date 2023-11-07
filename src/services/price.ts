import { ethers } from 'ethers'
import ReserveTokenPrice from '../abi/ReserveTokenPrice.json'
import { JsonRpcProvider } from '@ethersproject/providers'
import { bn, div, formatPercent, numberToWei, sub } from '../utils/helper'
import { TokenType } from '../types'
import { MINI_SECOND_PER_DAY } from '../utils/constant'
import historyProvider from '../historyProvider'
import { IEngineConfig } from '../utils/configs'
import { Profile } from '../profile'
import { isAddress } from 'ethers/lib/utils'

export class Price {
  chainId: number
  scanApi?: string
  provider: ethers.providers.Provider
  rpcUrl: string
  reserveTokenPrice: string
  config: IEngineConfig
  profile: Profile

  constructor(config: IEngineConfig, profile: Profile) {
    this.reserveTokenPrice = '0x' + ReserveTokenPrice.deployedBytecode.slice(-40)
    this.chainId = config.chainId
    this.scanApi = profile.configs.scanApi
    this.provider = new JsonRpcProvider(profile.configs.rpc)
    this.rpcUrl = profile.configs.rpc
    this.profile = profile
  }

  async get24hChange({
    baseToken,
    cToken,
    quoteToken,
    chainId,
    currentPrice,
  }: {
    baseToken: TokenType
    cToken: string
    chainId: string
    quoteToken: TokenType
    currentPrice: string
  }) {
    try {
      const toTime = Math.floor((new Date().getTime() - MINI_SECOND_PER_DAY) / 1000)
      let result = await historyProvider.getBars({
        to: toTime,
        limit: 1,
        chainId,
        resolution: '1',
        route: `${baseToken.address}/${cToken}/${quoteToken.address}`,
        outputToken: quoteToken,
        inputToken: baseToken,
        barValueType: 'string',
      })
      if (result?.length > 0) {
        const beforePrice = result[0].open
        return formatPercent(div(sub(currentPrice, beforePrice), beforePrice))
      }
      result = await historyProvider.getBars({
        from: toTime,
        limit: 1,
        chainId,
        resolution: '1',
        route: `${baseToken.address}/${cToken}/${quoteToken.address}`,
        outputToken: quoteToken,
        inputToken: baseToken,
        barValueType: 'string',
      })
      if (result?.length > 0) {
        const beforePrice = result[0].open
        console.log('zerg', beforePrice, result[0])
        return formatPercent(div(sub(currentPrice, beforePrice), beforePrice))
      }
      return undefined
    } catch (e) {
      throw e
    }
  }

  async getTokenPrices(tokens: string[]) {
    try {
      const provider = new JsonRpcProvider(this.rpcUrl)
      // @ts-ignore
      provider.setStateOverride({
        [this.reserveTokenPrice]: {
          code: ReserveTokenPrice.deployedBytecode,
        },
      })

      const pairDetailContract = new ethers.Contract(this.reserveTokenPrice, ReserveTokenPrice.abi, provider)

      const whiteListToken = this.profile.configs.tokens
      const _tokensToFetch = tokens.filter((t) => {
        return !whiteListToken?.[t]?.price && isAddress(t)
      })

      const res = await pairDetailContract.functions.fetchMarketBatch(
        _tokensToFetch,
        this.profile.configs.uniswap.v3Factory,
        this.profile.configs.stablecoins,
        this.profile.configs.wrappedTokenAddress,
        this.profile.configs.stablecoins[0],
      )

      const result = {}
      for (let i in _tokensToFetch) {
        result[_tokensToFetch[i]] = res.sqrtPriceX96[i]
      }

      if (whiteListToken) {
        for (let address in whiteListToken) {
          if (whiteListToken[address].price) {
            result[address] = bn(whiteListToken[address].price ?? '0x01000000000000000000000000')
          }
        }
      }

      return result
    } catch (e) {
      throw e
    }
  }
}
