/**
 * Testes básicos de configuração e tipos
 * Execute com: npx jest (quando jest for configurado)
 */

import { isOlivaDomain, getHostname, isSecureScheme } from '../utils';

describe('Utils - URL Validation', () => {
  describe('isOlivaDomain', () => {
    it('deve aceitar domínio principal Oliva', () => {
      expect(isOlivaDomain('https://oliva.church/')).toBe(true);
      expect(isOlivaDomain('https://oliva.church/dashboard')).toBe(true);
    });

    it('deve aceitar subdomínios Oliva', () => {
      expect(isOlivaDomain('https://api.oliva.church/users')).toBe(true);
      expect(isOlivaDomain('https://app.oliva.church')).toBe(true);
    });

    it('deve rejeitar domínios externos', () => {
      expect(isOlivaDomain('https://google.com')).toBe(false);
      expect(isOlivaDomain('https://whatsapp.com')).toBe(false);
      expect(isOlivaDomain('https://facebook.com/oliva.church')).toBe(false);
    });

    it('deve lidar com URLs inválidas', () => {
      expect(isOlivaDomain('not-a-valid-url')).toBe(false);
      expect(isOlivaDomain('')).toBe(false);
    });
  });

  describe('getHostname', () => {
    it('deve extrair hostname corretamente', () => {
      expect(getHostname('https://oliva.church/path')).toBe('oliva.church');
      expect(getHostname('https://api.oliva.church:8080')).toBe('api.oliva.church');
    });

    it('deve retornar null para URLs inválidas', () => {
      expect(getHostname('invalid')).toBe(null);
    });
  });

  describe('isSecureScheme', () => {
    it('deve aceitar https', () => {
      expect(isSecureScheme('https://oliva.church')).toBe(true);
    });

    it('deve aceitar http (para dev local)', () => {
      expect(isSecureScheme('http://localhost:3000')).toBe(true);
    });

    it('deve rejeitar esquemas inseguros', () => {
      expect(isSecureScheme('ftp://oliva.church')).toBe(false);
      expect(isSecureScheme('javascript:alert("xss")')).toBe(false);
    });
  });
});
