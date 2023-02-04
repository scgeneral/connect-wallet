/* eslint-disable class-methods-use-this */
/* eslint-disable prefer-promise-reject-errors */
import { AbstractConnector } from "abstract-connector";
import { IConnectorMessage, IEvent, IEventError, INativeCurrency, INetwork } from "interface";
import { Observable } from "rxjs";

import { codeMap, parameters } from "../helpers";

interface IWindow extends Window {
  gamestop: any
}

export class GameStopConnect implements AbstractConnector {
  public connector: any;

  public name = "GameStop";

  private chainID: number;

  private chainName: string;

  private nativeCurrency: INativeCurrency;

  private rpc: string;

  private blockExplorerUrl: string;

  /**
   * GameStop class to connect browser metamask extension to your application
   * using connect wallet.
   */
  constructor(network: INetwork) {
    this.chainID = network.chainID;
    if (network.chainName) this.chainName = network.chainName;
    if (network.nativeCurrency) this.nativeCurrency = network.nativeCurrency;
    if (network.rpc) this.rpc = network.rpc;
    if (network.blockExplorerUrl) this.blockExplorerUrl = network.blockExplorerUrl;
  }

  /**
   * Connect GameStop browser or mobile extension to application. Create connection with connect
   * wallet and return provider for Web3.
   *
   * @returns return connect status and connect information with provider for Web3.
   * @example this.connect().then((connector: IConnectorMessage) => console.log(connector),(err: IConnectorMessage) => console.log(err));
   */
  public connect(): Promise<IConnectorMessage> {
    return new Promise<any>((resolve, reject) => {
      const { gamestop } = window as unknown as IWindow;
      if (typeof gamestop !== "undefined") {
        this.connector = gamestop;
        resolve({
          code: 1,
          connected: true,
          provider: this.connector,
          message: {
            title: "Success",
            subtitle: "Connect success",
            text: `Gamestop found and connected.`,
          },
        } as IConnectorMessage);
      }

      reject({
        code: 2,
        connected: false,
        message: {
          title: "Error",
          subtitle: "Error connect",
          text: `Onto not found, please install it from <a href='https://onto.app/' target="_blank">onto.app</a>.`,
        },
      } as IConnectorMessage);
    });
  }

  private ethRequestAccounts(): Promise<any> {
    return this.connector.request({ method: "eth_requestAccounts" });
  }

  private getChainId(): Promise<any> {
    return this.connector.request({ method: "eth_chainId" });
  }

  private async checkNet(): Promise<any> {
    try {
      const currentChain = await this.getChainId();

      if (this.chainID !== parseInt(currentChain, 16)) {
        try {
          await this.connector.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${this.chainID.toString(16)}` }],
          });
          return true;
        } catch (err: any) {
          if (err.code === 4902) {
            if (!this.chainName || !this.nativeCurrency || !this.rpc || !this.blockExplorerUrl) {
              return true;
            }
            try {
              await this.connector.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: `0x${this.chainID.toString(16)}`,
                    chainName: this.chainName,
                    nativeCurrency: this.nativeCurrency,
                    rpcUrls: [this.rpc],
                    blockExplorerUrls: [this.blockExplorerUrl],
                  },
                ],
              });
              return true;
            } catch (err) {
              throw new Error("user reject add chain");
            }
          }
          throw new Error(`user reject switch network`);
        }
      }
      return true;
    } catch (err) {
      throw new Error(err);
    }
  }

  public eventSubscriber(): Observable<IEvent | IEventError> {
    return new Observable((observer) => {
      this.connector.on("chainChanged", async (chainId: string) => {
        const accounts = await this.ethRequestAccounts();

        if (this.chainID !== parseInt(chainId, 16)) {
          observer.error({
            code: 4,
            address: accounts[0],
            message: {
              title: "Error",
              subtitle: "chainChanged error",
              message: codeMap[4].name,
            },
          });
        }
        observer.next({
          address: accounts[0],
          network: parameters.chainsMap[chainId],
          name: "chainChanged",
        });
      });

      this.connector.on("accountsChanged", (address: Array<any>) => {
        if (address.length) {
          observer.next({
            address: address[0],
            network: parameters.chainsMap[parameters.chainIDMap[+this.chainID]],
            name: "accountsChanged",
          });
        } else {
          observer.error({
            code: 3,
            message: {
              title: "Error",
              subtitle: "Authorized error",
              message: codeMap[3].name,
            },
          });
        }
      });
    });
  }

  /**
   * Get account address and chain information from metamask extension.
   *
   * @returns return an Observable array with data error or connected information.
   * @example this.getAccounts().subscribe((account: any)=> {console.log('account',account)});
   */

  public getAccounts(): Promise<any> {
    const error = {
      code: 3,
      message: {
        title: "Error",
        subtitle: "Authorized error",
        message: "You are not authorized.",
      },
    };

    return new Promise((resolve, reject) => {
      if (!(window as unknown as IWindow).gamestop) {
        reject({
          code: 4,
          message: {
            title: "Error",
            subtitle: "Provider error",
            message: "No extension",
          },
          type: "GameStop",
        });
      }
      this.checkNet()
        .then(() => {
          this.ethRequestAccounts()
            .then((accounts) => {
              if (accounts[0]) {
                this.connector
                  .request({
                    method: "eth_chainId",
                  })
                  .then((chainID: string) => {
                    resolve({
                      address: accounts[0],
                      network: parameters.chainsMap[parameters.chainIDMap[+chainID]],
                    });
                  });
              } else {
                reject(error);
              }
            })
            .catch(() => {
              reject({
                code: 3,
                message: {
                  title: "Error",
                  subtitle: "User rejected the request",
                  message: "User rejected the connect",
                },
              });
            });
        })
        .catch((err: any) => {
          error.code = 4;
          error.message = err.message;
          reject(error);
        });
    });
  }

  public disconnect(): Promise<void> {
    // eslint-disable-next-line no-promise-executor-return
    return new Promise((resolve) => resolve(null));
  }
}
