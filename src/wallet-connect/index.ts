import { Subject } from 'rxjs';
import WalletConnectProvider from '@walletconnect/ethereum-provider';
import { IConnectorMessage, IProvider } from '../interface';
import { parameters } from '../helpers';
import { AbstractConnector } from '../abstract-connector';
import EthereumProvider from '@walletconnect/ethereum-provider';
import {
    ProviderAccounts,
    ProviderInfo,
    ProviderRpcError,
} from '@walletconnect/ethereum-provider/dist/types/types';
const subject = new Subject();

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
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<any>(async (resolve, reject) => {
            const providerOptions = provider.provider[provider.useProvider];
            if (providerOptions) {
                if (!this.connector) {
                    this.connector = await EthereumProvider.init(providerOptions);
                }
                await this.connector
                    .enable()
                    .then(() => {
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
                    })
                    .catch(() => {
                        reject({
                            code: 5,
                            connected: false,
                            message: {
                                title: 'Error',
                                subtitle: 'Error connect',
                                text: `User closed qr modal window.`,
                            },
                        });
                    });
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

    onConnect(result: ProviderInfo) {
        const address = this.connector.accounts[0];
        const network = {
            chainId: parseInt(result.chainId),
        };
        subject.next({ address, network, name: 'connect' });
    }

    onDisconnect(error: ProviderRpcError) {
        this.connector = undefined;
        if (error) {
            subject.error({
                code: 6,
                message: {
                    title: 'Error',
                    subtitle: 'Disconnect',
                    message: 'Wallet disconnected',
                },
            });
        }
    }

    accountsChanged(accounts: ProviderAccounts) {
        subject.next({
            address: accounts[0],
            network: parameters.chainsMap[parameters.chainIDMap[this.connector.chainId]],
            name: 'accountsChanged',
        });
    }

    public eventSubscriber() {
        this.connector.on('connect', this.onConnect);
        this.connector.on('disconnect', this.onDisconnect);
        this.connector.on('accountsChanged', this.accountsChanged);
        return subject;
    }

    public eventUnsubscribe() {
        this.connector.disconnect();
        if (this.connector) {
            this.connector.off('connect', this.onConnect);
            this.connector.off('disconnect', this.onDisconnect);
            this.connector.off('accountsChanged', this.accountsChanged);
        }
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
                network: parameters.chainsMap[parameters.chainIDMap[this.connector.chainId]],
            });
        });
    }
}
