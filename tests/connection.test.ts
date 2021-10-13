interface WaitForOptions {
    visible?: boolean | undefined;
    hidden?: boolean | undefined;
    timeout?: number | undefined;
}

const DEFAULT_SUBSCRIPTION = 'PI_XBTUSD';
const ALTERNATIVE_SUBSCRIPTION = 'PI_ETHUSD';

describe('Connection', () => {
    const bidsTableSelector = 'div[role="table"][aria-label="Bids"]';
    const asksTableSelector = 'div[role="table"][aria-label="Asks"]';

    const waitForTables = (options?: WaitForOptions) => Promise.all([
        page.waitForSelector(bidsTableSelector, options),
        page.waitForSelector(asksTableSelector, options)
    ]);

    const waitForReload = async () => {
        waitForTables({ hidden: true });
        return waitForTables();
    };

    const getSubscriptionAlert = async (subscription: string) => {
        const [alert] = await page.$x(`.//div[@role="alert" and text()[normalize-space()="${subscription}"]]`);
        expect(alert).not.toBeUndefined();
        return alert;
    };

    beforeAll(async () => {
        await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    });

    test('the user can toggle the input stream', async () => {
        const waitForToggleButton = (disabled?: boolean) => {
            const disabledAttr = disabled ? '@disabled' : 'not(@disabled)';
            const toggleButtonXpath = `.//button[${disabledAttr} and text()[normalize-space()="Toggle Feed"]]`;
            return page.waitForXPath(toggleButtonXpath);
        };

        // wait for initial load
        const [, toggleButton] = await Promise.all([waitForTables(), waitForToggleButton()]);

        // verify that the default subscription is being indicated to the user
        await getSubscriptionAlert(DEFAULT_SUBSCRIPTION);

        // click the toggle button
        await toggleButton?.click();

        // wait for the stream to reload
        await waitForReload();

        // verify that the alternative subscription is being indicated to the user
        await getSubscriptionAlert(ALTERNATIVE_SUBSCRIPTION);

        // click the toggle button again
        await toggleButton?.click();

        // wait for the stream to reload
        await waitForReload();

        // verify that the default subscription is being indicated to the user
        await getSubscriptionAlert(DEFAULT_SUBSCRIPTION);
    });

    test('the user can reconnect to the same input stream when the connection is paused', async () => {
        // wait for the initial page load
        await waitForTables();

        // verify that the worker has been started
        expect(page.workers()).toHaveLength(1);

        // verify that the default subscription is being indicated to the user
        await getSubscriptionAlert(DEFAULT_SUBSCRIPTION);

        // open a new tab and navigate to a new site
        const newPage = await browser.newPage();
        await newPage.goto('https://www.google.com', { waitUntil: 'networkidle0' });
        // close the new tab
        await newPage.close();

        // check that the user has been alerted to the disconnect
        await page.waitForXPath('.//p[@role="alert" and text()[normalize-space()="The feed has been disconnected"]]');

        // verify that the worker has been cleaned up
        expect(page.workers()).toHaveLength(0);

        // get the reconnect button and click it
        const [reconnectButton] = await page.$x('.//button[text()[normalize-space()="Reconnect"]]');
        expect(reconnectButton).not.toBeUndefined();
        await reconnectButton.click();
        await waitForReload();

        // verify that a single worker has been started up again
        expect(page.workers()).toHaveLength(1);

        // verify that the default subscription is still being indicated to the user
        await getSubscriptionAlert(DEFAULT_SUBSCRIPTION);
    });
});

export {};
