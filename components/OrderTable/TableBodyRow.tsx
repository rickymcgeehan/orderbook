import { styled } from '@mui/material';
import TableRow, { TableRowProps } from './TableRow';

interface TableHeadRowProps extends TableRowProps {
    height: number;
}

const shouldForwardProp = (prop: PropertyKey) => prop !== 'height';
export default styled(TableRow, { shouldForwardProp })<TableHeadRowProps>(({ height }) => ({ height }));
