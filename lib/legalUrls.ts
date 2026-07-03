import { getWebOrigin } from "@/lib/appOrigin";

export { getWebOrigin };

export const LEGAL_URLS = {
  privacyPolicy: `${getWebOrigin()}/privacy-policy`,
  termsOfService: `${getWebOrigin()}/terms-of-service`,
  contact: `${getWebOrigin()}/contact`,
} as const;
