/**
 * Utilities para manipulação de URLs e validações da app
 */

const OLIVA_DOMAIN = 'oliva.church';

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
  } catch (error) {
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
