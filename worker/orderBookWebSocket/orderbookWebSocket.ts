import { calculateSpread } from '../../util';
import {
    PriceLevelData,
    OrderBookUpdate,
    PriceLevelMap,
    OrderBookState,
    OrderBookWebSocketOptions,
    WebSocketMessage,
    PriceLevelUpdatePacket
} from './orderbookWebSocket.interface';

const SOCKET_URL = 'wss://www.cryptofacilities.com/ws/v1';
const BOOK_UI_FEED = 'book_ui_1';

const THROTTLE_PERIOD = 500; // update the UI every 2 seconds
const INIT_PERIOD = 1000; // allow 2 second after subscribing to populate the orderbook

/**
 * Convert an order book page into a sorted list of orders, appending the total sum of derived
 * contracts from open orders at each level.
 *
 * @param   {ProcessedOrderBookUpdates} orders The state of this page of the order book.
 * @param   {bool}                      desc   True if the list should be in descending order, false otherwise.
 * @returns {PriceLevelData[]} The sorted list of orders, each with the appended total sum of derived contracts from
 *                                open orders.
 */
function listOrders(orders: PriceLevelMap, desc = false): PriceLevelData[] {
    return Array.from(orders, ([price, size]) => ({ price, size }))
    .sort((a, b) => (desc ? a.price - b.price : b.price - a.price))
    .reduce((reduced: PriceLevelData[], { price, size }, idx: number): PriceLevelData[] => {
        const total = idx !== 0 ? reduced[reduced.length - 1].total + size : size;
        return [...reduced, { price, size, total }];
    },
    []);
}

export default class OrderBookWebSocket {
    private ws: WebSocket;

    private orderBookState: OrderBookState;

    private silenceUntil: number;

    private options: OrderBookWebSocketOptions;

    private subscription: string;

    constructor(subscription: string, options: OrderBookWebSocketOptions = {}) {
        this.ws = new WebSocket(SOCKET_URL);
        this.silenceUntil = 0;
        this.options = options;
        this.subscription = subscription;
        this.orderBookState = { bids: new Map(), asks: new Map() };

        /**
         * Subscribe to the specified channel when the websocket connection is successfully opened.
         *
         * @param {Event} event The websocket open event.
         */
        this.ws.onopen = (event: Event) => {
            this.subscribe(subscription);

            if (this.options.onOpen) {
                this.options.onOpen(subscription, event);
            }
        };

        /**
         * Update the state of the orderbook whenever a new message is received.
         *
         * @param {MessageEvent} event The websocket message event.
         */
        this.ws.onmessage = ({ data }: MessageEvent) => {
            const parsedData: WebSocketMessage = JSON.parse(data);
            const { asks, bids, event, feed, message, product_id: productId, product_ids: productIds } = parsedData;

            if (event === 'subscribed' && productIds && productIds?.indexOf(this.subscription) >= 0) {
                this.silenceUntil = Math.max(Date.now() + INIT_PERIOD, this.silenceUntil);
            }

            if ((asks || bids) && feed === BOOK_UI_FEED && productId === this.subscription) {
                // update the state of the order book with the latest data
                this.processOrders('bids', bids || []);
                this.processOrders('asks', asks || []);

                // throttle the message handling unless in the first 1s after connecting (i.e. init period)
                const now = Date.now();
                if (this.silenceUntil < now) {
                    // silence for the next 2s
                    this.silenceUntil = now + THROTTLE_PERIOD;
                    this.triggerUpdate();
                }
            } else if (event === 'alert') {
                this.handleError(message);
            }
        };

        /**
         * Handle an error with the websocket.
         */
        this.ws.onerror = () => {
            this.handleError('A connection error occurred');
        };

        /**
         * Handle the websocket closing.
         */
        this.ws.onclose = () => {
            if (this.options.onClose) {
                this.options.onClose();
            }
        };
    }

    /**
     * Handle an error (either a connection error or received over the input stream).
     *
     * @param {string} message The human-readable error message.
     */
    handleError(message = 'An error occurred'): void {
        if (this.options.onError) {
            this.options.onError(message);
        }

        // make sure the websocket is closed
        this.ws.close();
    }

    /**
     * Clear the order book to its original state.
     */
    resetOrderBookState(): void {
        this.orderBookState = { bids: new Map(), asks: new Map() };
    }

    /**
     * Send a message over the web socket connection.
     *
     * @param {*} data The message to be sent.
     */
    send(data: { [key: string]: unknown }): void {
        this.ws.send(JSON.stringify(data));
    }

    /**
     * Subscribe to an input stream.
     *
     * @param {string} subscription The name of the new input stream to subscribe to.
     */
    subscribe(subscription: string): void {
        this.send({ event: 'subscribe', feed: BOOK_UI_FEED, product_ids: [subscription] });
        this.subscription = subscription;
    }

    /**
     * Unsubscribe from the current input stream.
     */
    unsubscribe(): void {
        const unsubscribe = { event: 'unsubscribe', feed: 'book_ui_1', product_ids: [this.subscription] };
        this.send(unsubscribe);
        this.resetOrderBookState();
    }

    /**
     * Programmatically close the websocket connection.
     */
    close(): void {
        this.unsubscribe();
        this.ws.close();
    }

    /**
     * Update the state of one side of the orderbook.
     *
     * @param {string}        type             The type of orders being processed (bids or asks).
     * @param {PriceLevelMap} prevOrders       The previous state of this page of the order book.
     * @param {Order[]}       newOrderMessages The updated orders for this page of the order book.
     */
    processOrders(type: keyof OrderBookState, orderMessages: PriceLevelUpdatePacket[]): void {
        const existingOrders = this.orderBookState[type];
        if (orderMessages) {
            orderMessages.forEach(([price, size]) => {
                if (existingOrders.get(price) !== undefined && size === 0) {
                    existingOrders.delete(price);
                } else if (size > 0) {
                    existingOrders.set(price, size);
                }
            });
        }
    }

    /**
     * Send the latest state of the order book to the UI thread to be rendered.
     */
    triggerUpdate(): void {
        if (this.options.onUpdate) {
            const { bids, asks } = this.orderBookState;

            // convert the order book state into ordered lists
            const bidsList = listOrders(bids);
            const asksList = listOrders(asks, true);

            // calculate the max total of the entire order book
            const maxBidsTotal = bidsList.length > 0 ? bidsList[bidsList.length - 1].total : 0;
            const maxAsksTotal = asksList.length > 0 ? asksList[asksList.length - 1].total : 0;
            const maxTotal = Math.max(maxBidsTotal, maxAsksTotal);

            // calculate the highest bid and the lowest ask
            const highestBid: number = bidsList[0]?.price || 0;
            const lowestAsk: number = asksList[0]?.price || 0;

            // calculate the bid-ask spread and margin
            const { spread, margin } = calculateSpread(highestBid, lowestAsk);

            // pass the latest information to the window
            const value: OrderBookUpdate = { bids: bidsList, asks: asksList, maxTotal, spread, margin };
            this.options.onUpdate(value);
        }
    }

    /**
     * Unsubscribe from the current input stream and subscribe to a different one.
     *
     * @param {string} subscription The name of the new input stream to subscribe to.
     */
    changeSubscription(subscription: string): void {
        this.unsubscribe();
        this.subscribe(subscription);
    }
}
