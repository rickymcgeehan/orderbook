import { styled } from '@mui/material';

export const BUTTON_BAR_MIN_HEIGHT = 64;

export default styled('div')(({ theme }) => ({
    minHeight: BUTTON_BAR_MIN_HEIGHT,
    padding: theme.spacing(0, 3),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    // flex: 1,
    '& > button': {
        marginLeft: theme.spacing(2),
        marginRight: theme.spacing(2)
    }
}));
