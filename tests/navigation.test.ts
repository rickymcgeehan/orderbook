describe('Navigation', () => {
    beforeAll(async () => {
        await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    });

    test('navigating to \'/\' should be redirect the user to the \'/orders\' page', async () => {
        await expect(page.url()).toMatch('http://localhost:3000/orders');
        await expect(page.title()).resolves.toMatch('Order Book');
    });
});

export {};
