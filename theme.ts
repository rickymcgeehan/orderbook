import { alpha, createTheme } from '@mui/material/styles';
import { green, amber, red } from '@mui/material/colors';

// extend theme type definitions with custom 'buy' and 'sell' colors
declare module '@mui/material/styles' {
    interface Palette {
        buy: Palette['primary'];
        sell: Palette['primary'];
    }
    interface PaletteOptions {
        buy?: PaletteOptions['primary'];
        sell?: PaletteOptions['primary'];
    }
}

// Create a theme instance.
const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#5741d9',
        },
        secondary: {
            main: amber[600]
        }
    }
});

theme.palette.buy = theme.palette.augmentColor({ color: { main: green[500] } });
theme.palette.sell = theme.palette.augmentColor({ color: { main: red.A700 } });

theme.components = {
    MuiBackdrop: {
        styleOverrides: {
            root: {
                backgroundColor: alpha(theme.palette.common.black, 0.8)
            }
        }
    }
};

export default theme;
