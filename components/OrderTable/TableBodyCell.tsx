import { CSSObject, styled } from '@mui/material';

interface OrderTableBodyCellProps {
    color?: string;
}

const shouldForwardProp = (prop: PropertyKey) => (prop !== 'color');

const OrderTableBodyCell = styled('div', { shouldForwardProp })<OrderTableBodyCellProps>(({ theme, color }) => {
    const styles: CSSObject = {
        fontWeight: theme.typography.fontWeightMedium,
        border: 'none',
        textAlign: 'right',
        flex: '3 0 0',
        [theme.breakpoints.down('md')]: {
            ...theme.typography.body2
        }
    };

    if (color) {
        styles.color = theme.palette[color].light;
    }

    return styles;
});

export default OrderTableBodyCell;
