import { CSSProperties, useMemo } from 'react';
import { alpha, useTheme } from '@mui/material';
import TableBodyCell from './TableBodyCell';
import TableHeadCell from './TableHeadCell';
import TableHead from './TableHead';
import TableBodyRow from './TableBodyRow';
import { PriceLevelData } from '../../worker/orderBookWebSocket';
import { displayNumber } from '../../util';

export const TABLE_ROW_HEIGHT = 28;
export const TABLE_HEADER_HEIGHT = 36;

type HighlightColor = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'buy' | 'sell' ;
interface OrderTableProps {
    orders: PriceLevelData[];
    maxTotal: number;
    maxRows?: number;
    highlightColor?: HighlightColor;
    reverseCols?: boolean;
    reverseRows?: boolean;
    hideColHeaders?: boolean;
    'aria-label': string;
}

interface OrderTableColumn {
    title: string;
    key: keyof PriceLevelData;
    highlight?: boolean;
    decimalPlaces?: number;
}

const priceCol: OrderTableColumn = { title: 'Price', key: 'price', highlight: true, decimalPlaces: 2 };
const sizeCol: OrderTableColumn = { title: 'Size', key: 'size' };
const totalCol: OrderTableColumn = { title: 'Total', key: 'total' };

const columns: OrderTableColumn[] = [priceCol, sizeCol, totalCol];

export default function OrderTable(props: OrderTableProps): JSX.Element {
    const theme = useTheme();
    const {
        orders,
        maxRows,
        maxTotal,
        highlightColor,
        reverseCols = false,
        reverseRows = false,
        hideColHeaders = false,
        'aria-label': ariaLabel
    } = props;

    const cols: OrderTableColumn[] = useMemo(() => (reverseCols ? [...columns].reverse() : columns), [reverseCols]);

    const headerCells = useMemo(() => cols.map(({ title }) => (
        <TableHeadCell role="columnheader" key={`${title}-col-header-cell`}>{title}</TableHeadCell>
    )), [cols]);

    const rows = useMemo(() => {
        const croppedRows = maxRows !== undefined ? orders.slice(0, Math.max(1, maxRows)) : [...orders];
        return reverseRows ? croppedRows.reverse() : croppedRows;
    },
    [orders, maxRows, reverseRows]);

    return (
        <div aria-label={ariaLabel} role="table">
            <TableHead height={TABLE_HEADER_HEIGHT} visuallyHidden={hideColHeaders}>
                {headerCells}
            </TableHead>
            <div role="rowgroup">
                {
                    rows.map((level) => {
                        const { price, total } = level;
                        const depth = (total / (maxTotal || 1)) * 100;

                        const style: CSSProperties = {};
                        if (highlightColor) {
                            const gradientPercentage = Math.min(100, Math.max(0, depth));
                            const startColor = alpha(theme.palette[highlightColor].main, 0.3);
                            style.backgroundImage = `linear-gradient(
                                ${reverseCols ? '-' : ''}90deg,
                                ${startColor} 0%,
                                ${startColor} ${gradientPercentage}%,
                                transparent ${gradientPercentage}%
                            )`;
                        }

                        return (
                            <TableBodyRow key={price} height={TABLE_ROW_HEIGHT} style={style}>
                                {
                                    cols.map(({ key, highlight, decimalPlaces }) => {
                                        const textColor = highlight ? highlightColor : undefined;
                                        return (
                                            <TableBodyCell key={`data-${price}-${key}`} role="cell" color={textColor}>
                                                {displayNumber(level[key], decimalPlaces)}
                                            </TableBodyCell>
                                        );
                                    })
                                }
                            </TableBodyRow>
                        );
                    })
                }
            </div>
        </div>
    );
}
