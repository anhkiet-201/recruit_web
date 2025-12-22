export const formatCurrency = (amount: number, locale: string): string => {
    if (!amount) return "0";

    // Exchange rates (approximate)
    const RATES: Record<string, number> = {
        vi: 1,
        en: 1 / 25000,
        zh: 1 / 3500
    };

    const CURRENCIES: Record<string, string> = {
        vi: 'VND',
        en: 'USD',
        zh: 'CNY'
    };

    const rate = RATES[locale] || RATES['vi'];
    const currency = CURRENCIES[locale] || 'VND';

    const convertedAmount = amount * rate;

    // Formatting options
    const options: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: 0,
    };

    // Special formatting for Vietnam to look "cleaner" (e.g. 20.000.000 -> 20 triệu is handled by UI often, but here we explicitly use currency format)
    // For English/Chinese, standard currency format is fine ($800, ¥5,714)

    try {
        return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : (locale === 'en' ? 'en-US' : 'zh-CN'), options).format(convertedAmount);
    } catch (error) {
        return `${amount}`;
    }
};

export const formatSalaryRange = (min: number, max: number, locale: string, tNegotiable: string): string => {
    if ((!min && !max) || (min === 0 && max === 0)) return tNegotiable;

    // For display, if it's a range
    const format = (val: number) => formatCurrency(val, locale);

    if (min && max) {
        return `${format(min)} - ${format(max)}`;
    }
    if (min) {
        return `From ${format(min)}`;
    }
    if (max) {
        return `Up to ${format(max)}`;
    }
    return tNegotiable;
};
