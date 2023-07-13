import { Observable, Subject } from 'rxjs';
import { IConnectorMessage, IProvider, IEvent, IEventError } from '../interface';
export declare abstract class AbstractConnector {
    abstract connector: any;
    constructor();
    abstract connect(provider?: IProvider): Promise<IConnectorMessage>;
    abstract eventSubscriber(): Observable<IEvent | IEventError> | Subject<unknown>;
    abstract getAccounts(): Promise<any>;
    abstract eventUnsubscribe(): void;
}
