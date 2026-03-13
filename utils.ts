/**
 * Utilities para manipulação de URLs e validações da app
 */

import { getLocales } from 'expo-localization';

const OLIVA_DOMAIN = 'oliva.church';

/**
 * Mapeamento de locale do dispositivo para URL localizada da Oliva Church.
 * Suporta pt-BR, pt-PT, en, es e fr. Fallback: English.
 */
const LOCALE_URL_MAP: Record<string, string> = {
  'pt-BR': 'https://oliva.church/pt-br/login',
  'pt-PT': 'https://oliva.church/pt-pt/login',
  'pt':    'https://oliva.church/pt-br/login',
  'en':    'https://oliva.church/en/login',
  'es':    'https://oliva.church/es/login',
  'fr':    'https://oliva.church/fr/login',
};

const OLIVA_FALLBACK_URL = 'https://oliva.church/en/login';

/**
 * Retorna a URL de login correta com base no idioma do dispositivo.
 * Tenta match exato (ex: "pt-BR"), depois por idioma base (ex: "pt").
 * Fallback para inglês se o locale não for reconhecido.
 */
export const getLocaleUrl = (): string => {
  try {
    const locales = getLocales();
    const languageTag = locales[0]?.languageTag ?? '';

    if (LOCALE_URL_MAP[languageTag]) {
      return LOCALE_URL_MAP[languageTag];
    }

    const lang = languageTag.split('-')[0];
    if (lang && LOCALE_URL_MAP[lang]) {
      return LOCALE_URL_MAP[lang];
    }

    return OLIVA_FALLBACK_URL;
  } catch {
    return OLIVA_FALLBACK_URL;
  }
};

/**
 * Verifica se uma URL pertence aos domínios Oliva permitidos
 */
export const isOlivaDomain = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    return (
      hostname === OLIVA_DOMAIN ||
      hostname.endsWith(`.${OLIVA_DOMAIN}`)
    );
  } catch {
    console.warn('Invalid URL:', url);
    return false;
  }
};

/**
 * Extrai hostname de uma URL
 */
export const getHostname = (url: string): string | null => {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
};

/**
 * Valida se é um esquema seguro (http/https)
 */
export const isSecureScheme = (url: string): boolean => {
  try {
    const scheme = new URL(url).protocol;
    return scheme === 'https:' || scheme === 'http:';
  } catch {
    return false;
  }
};

/**
 * Verifica esquemas especiais (tel, mailto, whatsapp, etc)
 */
export const isSpecialScheme = (url: string): boolean => {
  const specialSchemes = [
    'tel:',
    'mailto:',
    'sms:',
    'whatsapp:',
    'market:',
    'intent:',
  ];

  return specialSchemes.some(scheme => url.startsWith(scheme));
};

/**
 * Log com prefixo de debug
 */
export const debugLog = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] OlivaApp: ${message}`, data || '');
};

/**
 * Log de erro com prefixo
 */
export const debugError = (message: string, error?: any) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] OlivaApp ERROR: ${message}`, error || '');
};

/**
 * Construa URL absoluta relativa à app
 */
export const buildOlivaUrl = (path: string): string => {
  const baseUrl = 'https://oliva.church';
  if (path.startsWith('/')) {
    return baseUrl + path;
  }
  return baseUrl + '/' + path;
};
