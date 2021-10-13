import { ReactChild } from 'react';
import { styled, Stack } from '@mui/material';
import OrderTable from './OrderTable';
import TableDivider from './TableDivider';
import { PriceLevelData } from '../worker/orderBookWebSocket';
import { displayNumber } from '../util';

const TableContainer = styled('div')({
    flex: 1
});

interface OrderBookProps {
    bids: PriceLevelData[];
    asks: PriceLevelData[];
    maxTotal: number;
    spread: number;
    margin: number | null;
    maxRows: number | undefined;
    sideBySideView: boolean;
    children?: ReactChild | ReactChild[];
}

export default function OrderBook({
    bids,
    asks,
    maxTotal,
    spread,
    margin,
    maxRows,
    sideBySideView = false,
    children
}: OrderBookProps): JSX.Element {
    const bidsTable = (
        <TableContainer>
            <OrderTable
                orders={bids}
                maxTotal={maxTotal}
                maxRows={maxRows}
                reverseCols={sideBySideView}
                aria-label="Bids"
                highlightColor="buy"
                hideColHeaders={!sideBySideView}
            />
        </TableContainer>
    );

    const asksTable = (
        <TableContainer>
            <OrderTable
                orders={asks}
                maxTotal={maxTotal}
                reverseRows={!sideBySideView}
                maxRows={maxRows}
                aria-label="Asks"
                highlightColor="sell"
            />
        </TableContainer>
    );

    const content = sideBySideView ? (
        <>
            {bidsTable}
            {asksTable}
        </>
    ) : (
        <>
            {asksTable}
            <TableDivider
                component="div"
                variant="body2"
                color="text.secondary"
                align="center"
            >
                {`Spread: ${displayNumber(spread, 2)}${margin !== null ? ` (${displayNumber(margin, 2)}%)` : ''}`}
            </TableDivider>
            {bidsTable}
        </>
    );

    return (
        <Stack
            spacing={0}
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent={{ xs: 'center', sm: 'flex-start' }}
            alignItems="stretch"
            position="relative"
            flex={1}
        >
            {content}
            {children}
        </Stack>
    );
}
