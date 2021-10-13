/**
 * Prepare a number for display by adding commas where appropriate and rounding to a decimal place if specified.
 *
 * @param   {number} num           The number which will be displayed.
 * @param   {number} decimalPlaces (Optional) The number of decimal places
 * @returns {string} A string representing the number.
 */
export function displayNumber(num: number, decimalPlaces?: number): string {
    const fixedNum = typeof decimalPlaces === 'number' ? num.toFixed(decimalPlaces) : num.toString();

    // separate integral and fractional parts of the number (either side of the decimal point)
    const str = fixedNum.split('.');

    // use lookahead regexp assertions to add a comma every 3 digits
    str[0] = str[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    // join number back together with decimal point (if still in multiple parts)
    return str.join('.');
}

/**
 * Calculate the bid-ask spread and the bid-ask margin of an orderbook.
 *
 * @param   {number} bid The list of bids in the order book.
 * @param   {number} ask The list of asks in the order book.
 * @returns {object} Object containing the spread and margin values.
 */
export function calculateSpread(bidPrice: number, askPrice: number): {
    spread: number;
    margin: number | null;
} {
    // spread is the difference between the asking price and the bid price
    const spread = askPrice - bidPrice;
    // the spread margin is the is the percentage change, bid price relative to ask price
    // (NOTE: only calculate if there is an available asking price to avoid zero-division errors)
    const margin = askPrice > 0 ? (spread / askPrice) * 100 : null;

    return { spread, margin };
}
