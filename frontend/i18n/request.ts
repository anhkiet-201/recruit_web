import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
    let locale = await requestLocale;

    // Ensure that a valid locale is used
    if (!locale || !['vi', 'en', 'zh'].includes(locale)) {
        locale = 'vi';
    }


    const messages = (await import(`../messages/${locale}.json`)).default;
    console.log(`[i18n] Loaded messages for ${locale}:`, Object.keys(messages));
    if (messages.Chatbot) {
        console.log(`[i18n] Chatbot keys for ${locale}:`, Object.keys(messages.Chatbot));
    } else {
        console.error(`[i18n] FAILED to find Chatbot keys for ${locale}`);
    }

    return {
        locale,
        messages
    };
});
