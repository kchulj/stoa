/*******************************************************************************

    The class that recovers data

    Copyright:
        Copyright (c) 2020 BOS Platform Foundation Korea
        All rights reserved.

    License:
        MIT License. See LICENSE for details.

*******************************************************************************/

import { Block, Hash, Height, PreImageInfo, handleNetworkError } from 'boa-sdk-ts';

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import URI from 'urijs';
import { URL } from 'url';

/**
 * The interface exposed by a full node
 *
 * See_Also: https://github.com/bpfkorea/agora/blob/v0.x.x/source/agora/api/FullNode.d
 */
export interface FullNodeAPI
{
    // getNodeInfo (): NodeInfo;
    // getLocalTime (): bigint;

    getBlockHeight (): Promise<Height>;
    getBlocksFrom (block_height: Height, max_blocks: number): Promise<Block[]>;
    // getMerklePath (block_height: Height, hash: Hash): Hash[];
    // hasTransactionHash (tx: Hash): boolean;
    // putTransaction (tx: Transaction): void;

    // enrollValidator (enroll: Enrollment): void;
    // getEnrollment (enroll_hash: Hash): Enrollment;
    getPreimage (enroll_key: Hash): Promise<PreImageInfo>;
    // receivePreimage (preimage: PreImageInfo): void;
}


/**
 * The class that recovers data
 */
export class AgoraClient implements FullNodeAPI
{
    /**
     * The network endpoint to connect to Agora
     */
    private endpoint: URL;

    /**
     * The instance of the axios
     */
    private client: AxiosInstance;

    /**
     * Constructor
     * @param endpoint - The network endpoint to connect to Agora
     */
    constructor (endpoint: URL)
    {
        this.endpoint = endpoint;
        this.client = axios.create({
            baseURL: endpoint.toString(),
            // Timeout are in ms, so 2s timeout
            timeout: 2000,
        });
    }

    /**
     * Request an Agora node's current block height.
     */
    public getBlockHeight (): Promise<Height>
    {
        return this.client.get(URI("/block_height").toString())
            .then((res) => { return new Height(res.data); });
    }

    /**
     * Requests and receives data needed for recovery from Agora.
     * @param block_height - The height of the block
     * @param max_blocks - The maximum number of block to request
     */
    public getBlocksFrom (block_height: Height, max_blocks: number): Promise<Block[]>
    {
        return new Promise<Block[]>((resolve, reject) =>
        {
            let uri = URI("/blocks_from")
                .addSearch("block_height", block_height.toString())
                .addSearch("max_blocks", max_blocks);

            this.client.get(uri.toString())
                .then((response: AxiosResponse) =>
                {
                    if (response.status == 200)
                        resolve(response.data.map((entry: any) => Block.reviver("", entry)));
                    else
                        reject(handleNetworkError({response: response}));
                })
                .catch((reason: any) => {
                    reject(handleNetworkError(reason));
                });
        });
    }

    /**
     * Request the latest PreImageInfo for an enrollment key
     *
     * @param enroll_key Hash of the UTXO used by the validator
     * @returns A `PreImageInfo` matching this `enroll_key`
     */
    public getPreimage (enroll_key: Hash): Promise<PreImageInfo>
    {
        return new Promise<PreImageInfo>((resolve, reject) =>
        {
            let uri = URI("/preimage")
                .addSearch("enroll_key", enroll_key);

            this.client.get(uri.toString())
                .then((response: AxiosResponse) =>
                {
                    if (response.status == 200)
                        resolve(PreImageInfo.reviver("", response.data));
                    else
                        reject(handleNetworkError({response: response}));
                })
                .catch((reason: any) => {
                    reject(handleNetworkError(reason));
                });
        });
    }
}
