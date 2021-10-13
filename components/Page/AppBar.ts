import { AppBar, styled } from '@mui/material';

export default styled(AppBar)(({ theme }) => (({
    borderBottomColor: theme.palette.divider,
    borderBottomStyle: 'solid',
    borderBottomWidth: 1,
    backgroundImage: 'none'
}))) as typeof AppBar;
