import { ACTION, MESSAGE } from './comms';
import OrderBookWebSocket, { OrderBookUpdate } from './orderBookWebSocket';

declare const self: DedicatedWorkerGlobalScope;
let ws: OrderBookWebSocket | undefined;

/**
 * Notify the UI thread whenever a new connection is opened.
 *
 * @param {string} subscription The name of the input stream that has been subscribed to.
 */
function onOpen(subscription: string): void {
    postMessage({ type: MESSAGE.CONNECTED, value: subscription });
}

/**
 * Notify the UI thread that the connection has been closed and self-terminate the worker process.
 */
function onClose(): void {
    postMessage({ type: MESSAGE.CLOSED });

    // clear the ws reference
    ws = undefined;

    // terminate the web worker
    self.close();
}

/**
 * Notify the UI thread that a connection error has occurred.
 *
 * @param {string} message The human-readable error message.
 */
function onError(message: string): void {
    postMessage({ type: MESSAGE.CONNECTION_ERROR, value: message });
}

/**
 * Pass the latest state of the order book onto the UI thread.
 *
 * @param {OrderBookUpdate} value The latest state of the order book.
 */
function onUpdate(value: OrderBookUpdate): void {
    postMessage({ type: MESSAGE.UPDATE, value });
}

/**
 * Open a new web socket connection and subscribe to the specified input stream.
 *
 * @param   {string}             subscription The name of the input stream to subscribe to upon connecting.
 * @returns {OrderBookWebSocket} The order book state manager.
 */
function openConnection(subscription: string) {
    return new OrderBookWebSocket(subscription, { onOpen, onClose, onError, onUpdate });
}

/**
 * Handle messages received from the main UI thread.
 *
 * @param {MessageEvent} event The message event.
 */
self.onmessage = (event: MessageEvent) => {
    const { type, value } = event.data;

    switch (type) {
        case ACTION.CONNECT: {
            if (!ws) {
                // there is no open connection, open a new one
                ws = openConnection(value);
            } else {
                // there is alread a connection open - don't create another
                postMessage({ type: MESSAGE.ACTION_ERROR, value: 'Already connected to a stream.' });
            }
            break;
        }

        case ACTION.CLOSE: {
            // close existing connection
            ws?.close();
            break;
        }

        case ACTION.CHANGE_SUBSCRIPTION: {
            ws?.changeSubscription(value);
            postMessage({ type: MESSAGE.SUBSCRIPTION_CHANGED, value });
            break;
        }

        default: break;
    }
};

const exports = {};
export default exports;
