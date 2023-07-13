import { Subject } from 'rxjs';
import WalletConnectProvider from '@walletconnect/ethereum-provider';
import { IConnectorMessage, IProvider } from '../interface';
import { AbstractConnector } from '../abstract-connector';
import { ProviderAccounts, ProviderInfo, ProviderRpcError } from '@walletconnect/ethereum-provider/dist/types/types';
export declare class WalletsConnect extends AbstractConnector {
    connector: WalletConnectProvider;
    /**
     * Connect wallet to application using connect wallet via WalletConnect by scanning Qr Code
     * in your favourite crypto wallet.
     */
    constructor();
    /**
     * Connect WalletConnect to application. Create connection with connect wallet and return provider for Web3.
     *
     * @returns return connect status and connect information with provider for Web3.
     * @example this.connect().then((connector: IConnectorMessage) => console.log(connector),(err: IConnectorMessage) => console.log(err));
     */
    connect(provider: IProvider): Promise<IConnectorMessage>;
    onConnect(result: ProviderInfo): void;
    onDisconnect(error: ProviderRpcError): void;
    accountsChanged(accounts: ProviderAccounts): void;
    eventSubscriber(): Subject<unknown>;
    eventUnsubscribe(): void;
    /**
     * Get account address and chain information from connected wallet.
     *
     * @returns return an Observable array with data error or connected information.
     * @example this.getAccounts().subscribe((account: any)=> {console.log('account',account)});
     */
    getAccounts(): Promise<any>;
}
