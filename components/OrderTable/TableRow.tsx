import { Stack, styled, useMediaQuery, useTheme } from '@mui/material';
import { ReactNode, CSSProperties } from 'react';

interface SpacerProps {
    flex: number | string;
}

const Spacer = styled('div')<SpacerProps>(({ flex }) => ({ flex }));

export interface TableRowProps {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
}

export default function TableRow({ children, className, style }: TableRowProps): JSX.Element {
    const theme = useTheme();
    const dense = useMediaQuery(theme.breakpoints.down('md'));

    return (
        <Stack
            className={className}
            role="row"
            flexDirection="row"
            alignItems="center"
            position="relative"
            style={style}
        >
            {dense ? <Spacer flex={1} /> : undefined}
            {children}
            <Spacer flex={dense ? 1 : 2} />
        </Stack>
    );
}
