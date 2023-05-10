import { Resource } from "./resource";
import { BigNumber } from "ethers";
type ConfigType = {
    resource: Resource;
    poolAddress: string;
    chainId: number;
};
export type PoolData = {
    baseToken: string;
    quoteToken: string;
    cToken: string;
    dTokens: string[];
    cTokenPrice: number;
    states: any;
    powers: number[];
    basePrice: string;
    poolAddress: string;
    baseId: number;
    quoteId: number;
    logic: string;
};
export declare class CurrentPool {
    resource: Resource;
    baseToken: string;
    quoteToken: string;
    cToken: string;
    TOKEN_R: string;
    TOKEN: string;
    dTokens: string[];
    logicAddress?: string;
    cTokenPrice: number;
    states: any;
    powers: number[];
    basePrice: string;
    poolAddress: string;
    baseId: number;
    quoteId: number;
    chainId: number;
    constructor(configs: ConfigType);
    setPoolAddress(address: string): void;
    initCurrentPoolData(poolData: PoolData): void;
    getTokenByPower(power: number | string): any;
    getIdByAddress(address: string): BigNumber;
}
export {};
