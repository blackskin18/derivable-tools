import { Engine } from '../src/engine'
import { getTestConfigs } from './shared/testConfigs'
import { BigNumber } from 'ethers'
import { FixedPoint } from '../src/utils/number'
import {Profile} from "../src/profile";

const testLocal = async () => {
  const configs = getTestConfigs(8453)
  const engine = new Engine(configs.account, configs, 8453)
  await engine.RESOURCE.fetchResourceData(
    '0xE3C75f8963E4CA02ea9a281c32b41FdfC248e07f',
  )

  // const a = new Profile(8453, {})
  // const b = a.getAbi('BnA')
  // console.log(b);

  console.log({
    poolGroups: engine.RESOURCE.poolGroups,
    pools: engine.RESOURCE.pools,
    tokens: engine.RESOURCE.tokens,
    swapLogs: engine.RESOURCE.swapLogs,
  })
}

const _r = (xk: BigNumber, v: BigNumber, R: BigNumber): BigNumber => {
  let r = v.mul(xk).div(FixedPoint.Q128)
  if (r.lt(R.div(2))) {
    const denominator = v.mul(xk.div(4)).div(FixedPoint.Q128)
    const minuend = R.mul(R).div(denominator)
    r = R.sub(minuend)
  }
  return r
}

testLocal()
