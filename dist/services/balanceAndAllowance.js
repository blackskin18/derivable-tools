"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BnA = exports.keyFromTokenId = void 0;
const helper_1 = require("../utils/helper");
const ethers_1 = require("ethers");
const constant_1 = require("../utils/constant");
const BnA_json_1 = __importDefault(require("../abi/BnA.json"));
const providers_1 = require("@ethersproject/providers");
const utils_1 = require("ethers/lib/utils");
const multicall_1 = require("../utils/multicall");
const NonfungiblePositionManager_json_1 = __importDefault(require("../abi/NonfungiblePositionManager.json"));
const TOPICS = (0, helper_1.getTopics)();
function keyFromTokenId(id) {
    const s = id.toHexString();
    const side = Number.parseInt(s.substring(2, 4), 16);
    const pool = (0, utils_1.getAddress)('0x' + s.substring(4));
    return pool + '-' + side;
}
exports.keyFromTokenId = keyFromTokenId;
class BnA {
    constructor(config, profile) {
        this.provider = new providers_1.JsonRpcProvider(profile.configs.rpc);
        this.bnAAddress = `0x${BnA_json_1.default.deployedBytecode.slice(-40)}`;
        this.profile = profile;
        this.RESOURCE = config.RESOURCE;
    }
    // TODO: change tokens to a bool flag for native balance
    async getBalanceAndAllowance(account, withNative = false) {
        if (!account) {
            throw new Error('missing account');
        }
        try {
            // get native balance
            let nativeBalancePromise;
            if (withNative) {
                nativeBalancePromise = this.provider.getBalance((account) || '');
            }
            const balances = {};
            const allowances = {};
            const maturities = {};
            const logs = this.RESOURCE.bnaLogs;
            for (const log of logs) {
                if (!log.args) {
                    console.error('Unparsed log', log);
                    continue;
                }
                const token = log.address;
                if (TOPICS.Transfer.includes(log.topics[0])) {
                    const { from, to, value } = log.args;
                    if (to == account) {
                        balances[token] = (balances[token] ?? (0, helper_1.bn)(0)).add(value);
                    }
                    if (from == account) {
                        balances[token] = (balances[token] ?? (0, helper_1.bn)(0)).sub(value);
                    }
                    if (!balances[token] || balances[token].isZero()) {
                        delete balances[token];
                    }
                }
                if (TOPICS.Approval.includes(log.topics[0])) {
                    const { owner, spender, value } = log.args;
                    if (owner == account && spender == this.profile.configs.helperContract.utr) {
                        if (value.isZero()) {
                            delete allowances[token];
                        }
                        else {
                            allowances[token] = value;
                        }
                    }
                }
                if (token != this.profile.configs.derivable.token) {
                    // not our 1155 token, don't care
                    continue;
                }
                if (TOPICS.TransferSingle.includes(log.topics[0])) {
                    const { from, to, id, value } = log.args;
                    const key = keyFromTokenId(id);
                    allowances[key] = (0, helper_1.bn)(constant_1.LARGE_VALUE);
                    if (to == account) {
                        balances[key] = (balances[key] ?? (0, helper_1.bn)(0)).add(value);
                        maturities[key] = (0, helper_1.bn)(log.timeStamp);
                    }
                    if (from == account) {
                        balances[key] = (balances[key] ?? (0, helper_1.bn)(0)).sub(value);
                        if (balances[key].isZero()) {
                            delete balances[key];
                        }
                    }
                }
                if (TOPICS.TransferBatch.includes(log.topics[0])) {
                    const { from, to, ids, } = log.args;
                    // TODO: where is log.args.values?
                    const values = log.args['4'];
                    for (let i = 0; i < ids.length; ++i) {
                        const value = values[i];
                        const key = keyFromTokenId(ids[i]);
                        allowances[key] = (0, helper_1.bn)(constant_1.LARGE_VALUE);
                        if (to == account) {
                            balances[key] = (balances[key] ?? (0, helper_1.bn)(0)).add(value);
                            maturities[key] = (0, helper_1.bn)(log.timeStamp);
                        }
                        if (from == account) {
                            balances[key] = (balances[key] ?? (0, helper_1.bn)(0)).sub(value);
                            if (balances[key].isZero()) {
                                delete balances[key];
                            }
                        }
                    }
                }
                if (TOPICS.ApprovalForAll.includes(log.topics[0])) {
                    // TODO: handle 1155 Approval events
                }
            }
            // calculate the MATURITY assume that each 
            for (const key of Object.keys(balances)) {
                if (!(0, helper_1.isErc1155Address)(key)) {
                    continue;
                }
                const [poolAddress] = key.split('-');
                const MATURIY = this.RESOURCE.pools[poolAddress]?.MATURITY;
                if (MATURIY) {
                    maturities[key] = MATURIY.add(maturities[key] ?? 0);
                }
            }
            // await the native balance response
            if (nativeBalancePromise) {
                balances[constant_1.NATIVE_ADDRESS] = await nativeBalancePromise;
            }
            return {
                chainId: this.profile.chainId,
                account,
                balances,
                allowances,
                maturities,
            };
        }
        catch (error) {
            throw error;
        }
    }
    async loadUniswapV3Position(assetsOverride) {
        const assets = assetsOverride || this.RESOURCE.assets;
        const uniPosV3 = Object.keys(assets[721].balance).map(key721 => key721.split('-')).filter(keyWithId => keyWithId[0] === this.profile.configs.uniswap.v3Pos);
        const uniPosV3Data = {};
        const res = await (0, multicall_1.multicall)(this.RESOURCE.provider, [
            ...uniPosV3.map(([uni3PosAddress, uni3PosId]) => ({
                reference: `position-${uni3PosId}`,
                contractAddress: uni3PosAddress,
                abi: NonfungiblePositionManager_json_1.default.abi,
                calls: [
                    {
                        reference: uni3PosId,
                        methodName: 'positions',
                        methodParameters: [uni3PosId],
                    },
                ], context: (callsReturnContext) => {
                    for (const ret of callsReturnContext) {
                        const values = ret.returnValues;
                        uniPosV3Data[[uni3PosAddress, uni3PosId].join('-')] = {
                            tickLower: parseInt(values[5].toString(), 10),
                            tickUpper: parseInt(values[6].toString(), 10),
                            liquidity: ethers_1.BigNumber.from(values[7].hex).toString(),
                            feeGrowthInside0LastX128: ethers_1.BigNumber.from(values[8].hex).toString(),
                            feeGrowthInside1LastX128: ethers_1.BigNumber.from(values[9].hex).toString(),
                            fee: values[4].toString(),
                            tokensOwed0: ethers_1.BigNumber.from(values[10].hex).toString(),
                            tokensOwed1: ethers_1.BigNumber.from(values[11].hex).toString(),
                            token0: values[2],
                            token1: values[3],
                        };
                    }
                },
            }))
        ]);
        return uniPosV3Data;
    }
}
exports.BnA = BnA;
//# sourceMappingURL=balanceAndAllowance.js.map