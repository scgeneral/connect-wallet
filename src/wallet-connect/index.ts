import { Observable } from 'rxjs';
import WalletConnectProvider from '@walletconnect/ethereum-provider';

import {
  IConnectorMessage,
  IProvider,
  IEvent,
  IEventError,
} from '../interface';
import { parameters } from '../helpers';
import { AbstractConnector } from '../abstract-connector';
import EthereumProvider from '@walletconnect/ethereum-provider';
import {ProviderAccounts, ProviderInfo} from '@walletconnect/ethereum-provider/dist/types/types';

export class WalletsConnect extends AbstractConnector {
  public connector: WalletConnectProvider;

  /**
   * Connect wallet to application using connect wallet via WalletConnect by scanning Qr Code
   * in your favourite crypto wallet.
   */
  constructor() {
    super();
  }

  /**
   * Connect WalletConnect to application. Create connection with connect wallet and return provider for Web3.
   *
   * @returns return connect status and connect information with provider for Web3.
   * @example this.connect().then((connector: IConnectorMessage) => console.log(connector),(err: IConnectorMessage) => console.log(err));
   */
  public async connect(provider: IProvider): Promise<IConnectorMessage> {
    return new Promise<any>(async (resolve, reject) => {
      const providerOptions = provider.provider[provider.useProvider];
      if (providerOptions) {
        this.connector = await EthereumProvider.init(providerOptions);
        await this.connector.enable().then(() => {
          resolve({
            code: 1,
            connected: true,
            provider: this.connector,
            message: {
              title: 'Success',
              subtitle: 'Wallet Connect',
              text: `Wallet Connect connected.`,
            },
          });
        }).catch((error) => {
          reject({
            code: 5,
            connected: false,
            message: {
              title: 'Error',
              subtitle: 'Error connect',
              text: `User closed qr modal window.`,
            },
          });
        })
      } else {
        reject({
          code: 6,
          connected: false,
          message: {
            title: 'Error',
            subtitle: 'Error connect',
            text: 'Project Id is required',
          },
        });
      }
    });
  }

  public eventSubscriber(): Observable<IEvent | IEventError> {
    return new Observable((observer) => {
      this.connector.on('connect', (result: ProviderInfo) => {
        console.log('connect', result);
        const address = this.connector.accounts[0];
        const network = {
          chainId: parseInt(result.chainId),
        }
        observer.next({ address, network, name: 'connect' });
      });

      this.connector.on('disconnect', (error) => {
        if (error) {
          observer.error({
            code: 6,
            message: {
              title: 'Error',
              subtitle: 'Disconnect',
              message: 'Wallet disconnected',
            },
          });
        }
      });

      this.connector.on(
        'accountsChanged',
        (accounts: ProviderAccounts) => {
          observer.next({
            address: accounts[0],
            network:
              parameters.chainsMap[
                parameters.chainIDMap[this.connector.chainId]
              ],
            name: 'accountsChanged',
          });
        },
      );

      this.connector.on('chainChanged', (chainId) => {
        console.log('WalletConnect chain changed:', chainId);
      });
    });
  }

  /**
   * Get account address and chain information from connected wallet.
   *
   * @returns return an Observable array with data error or connected information.
   * @example this.getAccounts().subscribe((account: any)=> {console.log('account',account)});
   */
  public getAccounts(): Promise<any> {
    return new Promise((resolve) => {
      resolve({
        address: this.connector.accounts[0],
        network:
          parameters.chainsMap[parameters.chainIDMap[this.connector.chainId]],
      });
    });
  }
}
