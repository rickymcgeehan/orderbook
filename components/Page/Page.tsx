import { ReactNode, useRef, useEffect, useState } from 'react';
import Head from 'next/head';
import { Toolbar, Typography, styled, Stack } from '@mui/material';
import AppBar from './AppBar';

interface PageProps {
    children: ReactNode,
    title: string;
    renderAdornment?: () => JSX.Element
}

const PageContainer = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    position: 'relative'
});

const Main = styled('main')({
    flex: '1 0 0',
    overflow: 'hidden'
});

export default function Page({ children, title, renderAdornment }: PageProps): JSX.Element {
    const pageHeadingRef = useRef<HTMLHeadingElement | null>(null);
    const [adornmentPadding, setAdornmentPadding] = useState(0);

    useEffect(() => {
        if (pageHeadingRef.current) {
            setAdornmentPadding(pageHeadingRef.current.offsetWidth);
        }
    },
    [setAdornmentPadding]);

    return (
        <>
            <Head>
                <title>{title}</title>
            </Head>
            <PageContainer>
                <AppBar>
                    <Toolbar variant="dense">
                        <Typography ref={pageHeadingRef} variant="h6" component="h1">{title}</Typography>
                        {
                            renderAdornment && (
                                <Stack justifyContent="center" alignItems="center" flex={1} pr={`${adornmentPadding}px`}>
                                    {renderAdornment()}
                                </Stack>
                            )
                        }
                    </Toolbar>
                </AppBar>
                <Toolbar variant="dense" />
                <Main>{children}</Main>
            </PageContainer>
        </>
    );
}
