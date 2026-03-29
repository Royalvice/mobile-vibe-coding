import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  // TODO: read from user preference / cookie
  const locale = 'en';
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
