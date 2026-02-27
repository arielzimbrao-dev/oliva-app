/**
 * WebView Types Extension
 * Adiciona tipos customizados para navegação e persistência
 */

export interface WebViewNavigationEvent {
  url: string;
  navigationType: 'click' | 'formsubmit' | 'backforward' | 'reload' | 'formresubmit' | string;
  title: string;
  lockIdentifier: number;
  canGoBack: boolean;
  canGoForward: boolean;
}

export interface WebViewMessage {
  type: string;
  url?: string;
  data?: any;
}

export interface AppConfig {
  OLIVA_URL: string;
  OLIVA_DOMAIN: string;
  ENABLE_DEBUG: boolean;
  USER_AGENT: string;
}

export const appConfig: AppConfig = {
  OLIVA_URL: 'https://oliva.church/',
  OLIVA_DOMAIN: 'oliva.church',
  ENABLE_DEBUG: __DEV__,
  USER_AGENT: 'OlivaChurchApp/1.0',
};
