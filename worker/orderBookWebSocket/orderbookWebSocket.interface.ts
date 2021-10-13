export interface PriceLevelData {
    price: number;
    size: number;
    total: number;
}

export interface OrderBookUpdate {
    bids: PriceLevelData[];
    asks: PriceLevelData[];
    maxTotal: number;
    spread: number;
    margin: number | null;
}

export type PriceLevelUpdatePacket = [number, number];
export interface WebSocketMessage {
    feed: string;
    event?: string;
    message?: string;
    product_ids?: string[];
    product_id?: string;
    bids?: PriceLevelUpdatePacket[];
    asks?: PriceLevelUpdatePacket[];
}

export type PriceLevelMap = Map<number, number>;

export interface OrderBookState {
    bids: PriceLevelMap;
    asks: PriceLevelMap;
}

export interface OrderBookWebSocketOptions {
    onOpen?: (subscription: string, event: Event) => void;
    onClose?: () => void;
    onError?: (message: string) => void;
    onUpdate?: (message: OrderBookUpdate) => void;
}
