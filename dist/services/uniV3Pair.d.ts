import { ethers } from 'ethers';
import { ConfigType } from './setConfig';
import { Multicall } from "ethereum-multicall";
import { DerivableContractAddress } from "../utils/configs";
import { CallReturnContext } from "ethereum-multicall/dist/esm/models/call-return-context";
export declare class UniV3Pair {
    chainId: number;
    scanApi?: string;
    provider: ethers.providers.Provider;
    rpcUrl: string;
    pairsV3Info: string;
    addresses: Partial<DerivableContractAddress>;
    constructor(config: ConfigType);
    getLargestPoolAddress({ baseToken, quoteTokens, }: {
        baseToken: string;
        quoteTokens: string[];
    }): Promise<string>;
    /**
     *
     * @param baseToken
     * @param pools
     * poolsType: {
     *   [`${baseAddress-quoteAddress-fee}`]: poolAddress
     * }
     */
    _getLargestPoolByPools(baseToken: string, pools: {
        [key: string]: string;
    }): Promise<string>;
    _parsePoolBalanceReturnContext(returnContexts: CallReturnContext[]): string;
    _generatePoolBalanceContext(baseToken: string, pools: {
        [key: string]: string;
    }): {
        reference: string;
        contractAddress: string;
        abi: ({
            inputs: {
                internalType: string;
                name: string;
                type: string;
            }[];
            stateMutability: string;
            type: string;
            anonymous?: undefined;
            name?: undefined;
            outputs?: undefined;
        } | {
            anonymous: boolean;
            inputs: {
                indexed: boolean;
                internalType: string;
                name: string;
                type: string;
            }[];
            name: string;
            type: string;
            stateMutability?: undefined;
            outputs?: undefined;
        } | {
            inputs: {
                internalType: string;
                name: string;
                type: string;
            }[];
            name: string;
            outputs: {
                internalType: string;
                name: string;
                type: string;
            }[];
            stateMutability: string;
            type: string;
            anonymous?: undefined;
        })[];
        calls: any;
    }[];
    getPairAddress({ baseToken, quoteTokens, }: {
        baseToken: string;
        quoteTokens: string[];
    }): Promise<{
        [key: string]: string;
    }>;
    _parsePoolAddressReturnContext(returnContexts: CallReturnContext[]): {};
    _generatePoolAddressContext(baseToken: string, quoteTokens: string[]): {
        reference: string;
        contractAddress: string | undefined;
        abi: ({
            inputs: never[];
            stateMutability: string;
            type: string;
            anonymous?: undefined;
            name?: undefined;
            outputs?: undefined;
        } | {
            anonymous: boolean;
            inputs: {
                indexed: boolean;
                internalType: string;
                name: string;
                type: string;
            }[];
            name: string;
            type: string;
            stateMutability?: undefined;
            outputs?: undefined;
        } | {
            inputs: {
                internalType: string;
                name: string;
                type: string;
            }[];
            name: string;
            outputs: {
                internalType: string;
                name: string;
                type: string;
            }[];
            stateMutability: string;
            type: string;
            anonymous?: undefined;
        })[];
        calls: any;
    }[];
    getPairInfo({ pairAddress, flag, }: {
        pairAddress: string;
        flag?: string;
    }): Promise<any>;
    getPairsInfo({ pairAddresses, flag, }: {
        flag?: string;
        pairAddresses: string[];
    }): Promise<{}>;
    _getMulticall(): Multicall;
}