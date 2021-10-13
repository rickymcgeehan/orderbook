import { styled } from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import TableRow, { TableRowProps } from './TableRow';

interface TableHeadProps extends TableRowProps {
    visuallyHidden?: boolean;
    height: number;
}

const shouldForwardProp = (prop: PropertyKey) => prop !== 'height' && prop !== 'visuallyHidden';
const TableHeadRow = styled(TableRow, { shouldForwardProp })<TableHeadProps>(({
    theme,
    height,
    visuallyHidden: hidden
}) => {
    if (hidden) {
        return { ...visuallyHidden };
    }
    const marginBottom = 4;
    const calculatedHeight = Math.max(0, height - marginBottom);
    return {
        borderBottomStyle: 'solid',
        borderBottomWidth: '1px',
        borderBottomColor: theme.palette.divider,
        height: calculatedHeight,
        marginBottom
    };
});

export default function TableHead({ children, visuallyHidden: hidden, height, style }: TableHeadProps): JSX.Element {
    return (
        <div role="rowgroup">
            <TableHeadRow visuallyHidden={hidden} height={height} style={style}>
                {children}
            </TableHeadRow>
        </div>
    );
}
