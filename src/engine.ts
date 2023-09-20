import {PoolsType, Storage, SwapLog, TokenType} from './types'
import {ethers} from 'ethers'
import {Price} from './services/price'
import {Resource} from './services/resource'
import {BnA} from './services/balanceAndAllowance'
import {UniV2Pair} from './services/uniV2Pair'
import {History} from './services/history'
import {Swap} from './services/swap'
import {CurrentPool} from './services/currentPool'
import {CreatePool} from './services/createPool'
import {UniV3Pair} from './services/uniV3Pair'
import {IEngineConfig} from './utils/configs'
import {Profile} from "./profile";


export class Engine {
  chainId: number
  scanApi?: string
  rpcUrl: string
  account?: string
  signer?: ethers.providers.JsonRpcSigner
  provider: ethers.providers.Provider
  storage?: Storage
  PRICE: Price
  RESOURCE: Resource
  BNA: BnA
  UNIV2PAIR: UniV2Pair
  UNIV3PAIR: UniV3Pair
  HISTORY: History
  SWAP: Swap
  CURRENT_POOL: CurrentPool
  CREATE_POOL: CreatePool
  enginConfigs: IEngineConfig
  constructor(
    enginConfigs: IEngineConfig,
    profile = Profile,
  ) {
    this.enginConfigs = enginConfigs
    this.account = enginConfigs.account
    // this.providerToGetLog = this.config.providerToGetLog
    this.profile = new profile(enginConfigs)
  }

  profile: Profile

  async initServices() {
    await this.profile.loadConfig()
    this.UNIV2PAIR = new UniV2Pair(this.enginConfigs, this.profile)
    this.UNIV3PAIR = new UniV3Pair(this.enginConfigs, this.profile)
    this.BNA = new BnA(this.enginConfigs, this.profile)
    this.RESOURCE = new Resource(this.enginConfigs, this.profile)
    this.PRICE = new Price(this.enginConfigs, this.profile)
    this.CURRENT_POOL = new CurrentPool(this.enginConfigs)
    this.HISTORY = new History({
      ...this.enginConfigs,
      RESOURCE: this.RESOURCE,
      CURRENT_POOL: this.CURRENT_POOL,
    }, this.profile)
    this.SWAP = new Swap({
      ...this.enginConfigs,
      CURRENT_POOL: this.CURRENT_POOL,
    }, this.profile)
    this.CREATE_POOL = new CreatePool(this.enginConfigs, this.profile)
  }

  setCurrentPool(poolData: any) {
    this.CURRENT_POOL.initCurrentPoolData(poolData)
  }
}
