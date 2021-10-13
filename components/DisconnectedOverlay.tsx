import { MouseEventHandler } from 'react';
import { Backdrop, Button, Stack, styled, Typography } from '@mui/material';

interface DisconnectedOverlayProps {
    onReconnect: MouseEventHandler<HTMLButtonElement>;
}

const AbsoluteBackdrop = styled(Backdrop)({
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
});

export default function DisconnectedOverlay({ onReconnect }: DisconnectedOverlayProps): JSX.Element {
    return (
        <AbsoluteBackdrop open>
            <Stack justifyContent="center" alignItems="center" height="100%">
                <Typography align="center" paragraph role="alert">The feed has been disconnected</Typography>
                <Button variant="contained" onClick={onReconnect}>Reconnect</Button>
            </Stack>
        </AbsoluteBackdrop>
    );
}
