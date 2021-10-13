import { styled, Typography } from '@mui/material';

export const TABLE_DIVIDER_HEIGHT = 36;

export default styled(Typography)({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: TABLE_DIVIDER_HEIGHT
}) as typeof Typography;
