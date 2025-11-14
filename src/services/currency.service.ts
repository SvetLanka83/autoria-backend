export type CurrencyCode = 'USD' | 'EUR' | 'UAH';

// Result of price calculation in all currencies
export interface PriceCalculationResult {
    priceUSD: number;
    priceEUR: number;
    priceUAH: number;
    rateSource: string;
    rateDate: Date;
}

/**
 * Mock function to convert original price into all supported currencies.
 * In real application we would call PrivatBank API here.
 */
export const calculatePrices = (
    originalAmount: number,
    originalCurrency: CurrencyCode,
): PriceCalculationResult => {
    // Hard-coded mock rates just for development / testing.
    // You can later replace this with real API call.
    const mockRates = {
        USD: { USD: 1, EUR: 0.9, UAH: 40 },
        EUR: { USD: 1.1, EUR: 1, UAH: 44 },
        UAH: { USD: 1 / 40, EUR: 1 / 44, UAH: 1 },
    };

    const ratesForCurrency = mockRates[originalCurrency];

    const priceUSD = +(originalAmount * ratesForCurrency.USD).toFixed(2);
    const priceEUR = +(originalAmount * ratesForCurrency.EUR).toFixed(2);
    const priceUAH = +(originalAmount * ratesForCurrency.UAH).toFixed(2);

    return {
        priceUSD,
        priceEUR,
        priceUAH,
        rateSource: 'MOCK_PRIVATBANK', // later you can add real info
        rateDate: new Date(),
    };
};
