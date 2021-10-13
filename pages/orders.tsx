import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Button, useMediaQuery, useTheme, Theme, Typography, styled, Stack, CircularProgress } from '@mui/material';
import ReportProblemIcon from '@mui/icons-material/ReportProblemRounded';
import { useWindowHeight } from '@react-hook/window-size';
import Page from '../components/Page';
import { TABLE_DIVIDER_HEIGHT } from '../components/TableDivider';
import ButtonBar, { BUTTON_BAR_MIN_HEIGHT } from '../components/ButtonBar';
import { OrderBookUpdate } from '../worker/orderBookWebSocket';
import { ACTION, MESSAGE } from '../worker/comms';
import useWindowFocus from '../hooks/useWindowFocus';
import OrderBook from '../components/OrderBook';
import { displayNumber } from '../util';
import DisconnectedOverlay from '../components/DisconnectedOverlay';
import { TABLE_HEADER_HEIGHT, TABLE_ROW_HEIGHT } from '../components/OrderTable';

const DEFAULT_SUBSCRIPTION = 'PI_XBTUSD';
const ALTERNATIVE_SUBSCRIPTION = 'PI_ETHUSD';

const Container = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
});

const ErrorIcon = styled(ReportProblemIcon)(({ theme }) => ({
    fontSize: theme.typography.pxToRem(136),
    marginBottom: theme.spacing(3)
}));

function Orders(): JSX.Element | null {
    const theme: Theme = useTheme();
    const height = useWindowHeight({ wait: 300 });
    const sideBySideView: boolean = useMediaQuery(theme.breakpoints.up('sm'));
    const [isConnected, setConnectionOpen] = useState<boolean>(false);
    const [isConnecting, setConnecting] = useState<boolean>(false);
    const [orderBook, setOrderBook] = useState<OrderBookUpdate | undefined>();
    const [currentSubscription, setCurrentSubscription] = useState<string>(DEFAULT_SUBSCRIPTION);
    const [isChangingSubscription, setChangingSubscription] = useState<boolean>(false);
    const [maxRows, setMaxRows] = useState<number | undefined>();
    const orderBookWorkerRef = useRef<Worker | undefined>();
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [error, setError] = useState<string | null>(null);
    const isWindowInFocus = useWindowFocus();

    /**
     * Calculate the maximum number of table rows that can be displayed
     * whenever the page height changes or if the page layout changes.
     */
    useEffect(() => {
        if (containerRef.current) {
            const dividerHeight = sideBySideView ? 0 : TABLE_DIVIDER_HEIGHT;
            const containerSpace = containerRef.current.offsetHeight;
            const spaceForRows = containerSpace - dividerHeight - TABLE_HEADER_HEIGHT - BUTTON_BAR_MIN_HEIGHT;

            const spaceForEachTable = sideBySideView ? spaceForRows : spaceForRows / 2;
            setMaxRows(Math.round(spaceForEachTable / TABLE_ROW_HEIGHT));
        }
    },
    [height, sideBySideView]);

    /**
     * Open a new connection to the web worker thread and listen for incoming messages.
     */
    const connect = useCallback((subscription) => {
        setError(null);
        setConnecting(true);

        // create a new web worker
        orderBookWorkerRef.current = new Worker(new URL('../worker/orderbook.worker', import.meta.url));

        // set the message handler for the new webworker
        orderBookWorkerRef.current.onmessage = (event) => {
            const { type, value } = event.data;

            switch (type) {
                case MESSAGE.CONNECTED: {
                    setConnecting(false);
                    setConnectionOpen(true);
                    break;
                }

                case MESSAGE.CLOSED: {
                    setConnectionOpen(false);
                    orderBookWorkerRef.current?.terminate();
                    orderBookWorkerRef.current = undefined;
                    break;
                }

                case MESSAGE.SUBSCRIPTION_CHANGED: {
                    setChangingSubscription(false);
                    setCurrentSubscription(value);
                    break;
                }

                case MESSAGE.UPDATE: {
                    setOrderBook(value);
                    break;
                }

                case MESSAGE.CONNECTION_ERROR: {
                    setError(value);
                    break;
                }

                case MESSAGE.ACTION_ERROR: {
                    setError(value);
                    break;
                }

                default: break;
            }
        };

        // instruct the webworker to connect the websocket to the specified subscription
        orderBookWorkerRef.current?.postMessage({ type: ACTION.CONNECT, value: subscription });
    },
    [setConnecting]);

    /**
     *  When the page loads tell the worker to connect to the webhook and subscribe to the default channel.
     */
    useEffect(() => {
        connect(DEFAULT_SUBSCRIPTION);

        return () => {
            // terminate the web worker
            orderBookWorkerRef.current?.terminate();
        };
    },
    [connect]);

    // set 'renderAdornment' function if showing the side-by-side view so that
    // the spread and margin information is displayed in the page's app bar.
    const renderAdornment = !orderBook || !sideBySideView ? undefined : () => {
        const { spread, margin } = orderBook;
        return (
            <Typography
                component="div"
                variant="body2"
                color="text.secondary"
                align="center"
            >
                {`Spread: ${displayNumber(spread, 2)}${margin !== null ? ` (${displayNumber(margin, 2)}%)` : ''}`}
            </Typography>
        );
    };

    /**
     * Instuct the web worker to disconnect the connection.
     */
    const handleDisconnect = useCallback(() => orderBookWorkerRef.current?.postMessage({ type: ACTION.CLOSE }), []);

    /**
     * Start up a new connection.
     */
    const handleReconnect = useCallback(() => connect(currentSubscription), [currentSubscription, connect]);

    /**
     * Alternate the input stream. NOTE: This can be done instantly if there is no active connection.
     */
    const handleToggle = useCallback(() => {
        const value = currentSubscription === DEFAULT_SUBSCRIPTION ? ALTERNATIVE_SUBSCRIPTION : DEFAULT_SUBSCRIPTION;

        if (!isConnected) {
            // change the subscription instantly
            setCurrentSubscription(value);
            setOrderBook(undefined);
        } else {
            // change the subscription via the worker (and wait for confirmation that the change was successful)
            orderBookWorkerRef.current?.postMessage({ type: ACTION.CHANGE_SUBSCRIPTION, value });
            setChangingSubscription(true);
        }
    },
    [isConnected, currentSubscription, setCurrentSubscription, setChangingSubscription]);

    /**
     * Reset the state of the orderbook data whenever the subscription is changing or the websocket is connecting.
     */
    useEffect(() => {
        if (isChangingSubscription || isConnecting) {
            setOrderBook(undefined);
        }
    },
    [isChangingSubscription, isConnecting, setOrderBook]);

    /**
     * Instruct the web worker to disconnect every time the window goes out of focus.
     */
    useEffect(() => {
        if (!isWindowInFocus) {
            handleDisconnect();
        }
    },
    [isWindowInFocus, handleDisconnect]);

    /**
     * Render the page contents.
     *
     * @returns {ReactElement} The main JSX contents of the page.
     */
    const renderContent = () => {
        if (error) {
            return (
                <Stack justifyContent="center" alignItems="center" flex={1}>
                    <ErrorIcon />
                    <Typography variant="h4" component="p" align="center" paragraph>Oops!</Typography>
                    <Typography align="center" mb={6}>{error}</Typography>
                    <Button variant="contained" onClick={handleReconnect}>Attempt to reconnect</Button>
                </Stack>
            );
        }

        const loading = (
            <Stack flex={1} justifyContent="center" alignItems="center">
                <CircularProgress />
            </Stack>
        );

        if (isConnecting) {
            return loading;
        }

        if (!orderBook) {
            return isConnected ? loading : (
                <Stack flex={1} position="relative">
                    <DisconnectedOverlay onReconnect={handleReconnect} />
                </Stack>
            );
        }

        return (
            <OrderBook
                bids={orderBook.bids}
                asks={orderBook.asks}
                maxTotal={orderBook.maxTotal}
                spread={orderBook.spread}
                margin={orderBook.margin}
                sideBySideView={sideBySideView}
                maxRows={maxRows}
            >
                {!isConnected ? <DisconnectedOverlay onReconnect={handleReconnect} /> : undefined}
            </OrderBook>
        );
    };

    return (
        <Page title="Order Book" renderAdornment={renderAdornment}>
            <Container ref={containerRef}>
                {renderContent()}
                <ButtonBar>
                    <Button
                        variant="contained"
                        onClick={handleToggle}
                        disabled={isChangingSubscription || isConnecting}
                    >
                        Toggle Feed
                    </Button>
                    <Typography role="alert" component="div" variant="h6">{currentSubscription}</Typography>
                </ButtonBar>
            </Container>
        </Page>
    );
}

export default Orders;
