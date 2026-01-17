import { NextIntlClientProvider } from "next-intl";
import NotFoundContent from "@/components/NotFoundContent";

// Default locale for root 404
const defaultLocale = "vi";

export default async function NotFound() {
  // Manually fetch messages for the root 404 page
  // This is architecturally safe as it handles the edge case outside the locale tree
  const messages = (await import(`../messages/${defaultLocale}.json`)).default;

  return (
    <NextIntlClientProvider locale={defaultLocale} messages={messages}>
      <NotFoundContent />
    </NextIntlClientProvider>
  );
}
