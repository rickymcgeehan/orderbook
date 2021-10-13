import { styled } from '@mui/material';

export default styled('div')(({ theme }) => ({
    ...theme.typography.button,
    textTransform: 'uppercase',
    color: theme.palette.text.secondary,
    flex: '3 0 0',
    textAlign: 'right'
}));
