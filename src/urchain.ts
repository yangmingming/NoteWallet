import type { AxiosError, AxiosResponse } from "axios";
import axios from "axios";

import type { IBroadcastResult, IFees, IToken, IUtxo } from "./types";

const MaxRetries = 1000
const RetryDelay = 5000

export class Urchain {
  private _httpClient;
  constructor(host: string, apiKey = "1234567890") {
    this._httpClient = axios.create({
      baseURL: host,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
  }

  _parseResponse(response: AxiosResponse) {
    return response.data;
  }

  _parseError(error: AxiosError) {
    if (error.response) {
      // server return error
      console.log(
        "🚀 ~ file: urchain.ts:32 ~ Urchain ~ _parseError",
        `${error.config?.baseURL}${error.config?.url}`,
        error.response.status,
        error.response.headers,
        error.response.data,
      );
      throw new Error(JSON.stringify(error.response.data));
    } else if (error.request) {
      // console.warn( error.message )
      throw new Error(error.message);
    } else {
      // console.warn( 'Error', error )
      throw error;
    }
  }

  async _get(command, params, maxRetries = MaxRetries, retryDelay = RetryDelay) {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            // 创建具有给定参数的查询，如果适用
            params = params || {};
            const options = {
                params,
            };
            const response = await this._httpClient.get(command, options);
            return this._parseResponse(response);
        } catch (error) {
            retries++;
            if (retries === maxRetries) {
                // 如果达到最大重试次数，抛出异常
                throw error;
            }
            // 重试时打印消息
            console.log(`Error occurred, retrying... Retry attempt: ${retries}`);
            // 睡眠指定的延迟时间
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }
}

async _post(command, data, maxRetries = MaxRetries, retryDelay = RetryDelay) {
  let retries = 0;
  while (retries < maxRetries) {
      try {
          const options = {
              headers: {
                  "Content-Type": "application/json",
              },
          };
          const response = await this._httpClient.post(command, data, options);
          return this._parseResponse(response);
      } catch (error) {
          retries++;
          if (retries === maxRetries) {
              // 如果达到最大重试次数，抛出异常
              throw error;
          }
          // 重试时打印消息
          console.log(`Error occurred, retrying... Retry attempt: ${retries}`);
          // 睡眠指定的延迟时间
          await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
  }
}

  async health(): Promise<string> {
    return await this._get("health", {});
  }

  async getFeePerKb(): Promise<IFees> {
    return await this._get("fees", {});
  }

  balance(scriptHash: string): Promise<{
    confirmed: bigint;
    unconfirmed: bigint;
  }> {
    return this._post("balance", {
      scriptHash,
    });
  }

  tokenBalance(
    scriptHash: string,
    tick: string,
  ): Promise<{
    confirmed: bigint;
    unconfirmed: bigint;
  }> {
    return this._post("token-balance", {
      scriptHash,
      tick,
    });
  }

  tokenList(scriptHash: string): Promise<IToken[]> {
    return this._post("token-list", {
      scriptHash,
    });
  }

  async utxos(scriptHashs: string[], _satoshis?: bigint): Promise<IUtxo[]> {
    return await this._post("utxos", {
      scriptHashs,
      ...(typeof _satoshis !== "undefined" ? { satoshis: _satoshis } : {}),
    });
  }

  async tx(txId: string): Promise<{
    txId: string;
    height: number;
    txHex: string;
    address: string;
    time: number;
    blockHash: string;
    blockTime: number;
    indexInBlock: number;
  }> {
    return await this._post("tx", {
      txId,
    });
  }

  async refresh(scriptHash: string): Promise<{
    message: string;
    code: string | number;
  }> {
    return await this._post("fetch-history", {
      scriptHash,
    });
  }

  async reset(scriptHash: string): Promise<{
    message: string;
    code: string | number;
  }> {
    return await this._post("reset", {
      scriptHash,
    });
  }

  async txo(txId: string, outputIndex: number) {
    return await this._post("txo", {
      txId,
      outputIndex,
    });
  }

  async txos(address: string, type: string) {
    return await this._post("txos", {
      address,
      type,
    });
  }

  async broadcast(rawHex: string): Promise<IBroadcastResult> {
    return await this._post("broadcast", {
      rawHex,
    });
  }

  async bestBlock() {
    return await this._post("best-header", {});
  }

  async allTokens() {
    return await this._post("all-n20-tokens", {});
  }

  async tokenInfo(tick: string) {
    return await this._post("token-info", { tick });
  }
}
