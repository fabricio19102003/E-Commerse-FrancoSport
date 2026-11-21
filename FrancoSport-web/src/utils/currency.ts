/**
 * Single money formatter for the whole web (customer and admin): "Bs. 12.50".
 * Accepts numbers or the decimal strings the API sends; anything that is not a number shows as 0.
 */
export const formatCurrency = (value: number | string | null | undefined): string => {
    const amount = Number(value);
    return `Bs. ${(Number.isFinite(amount) ? amount : 0).toFixed(2)}`;
};
