#!/usr/bin/env node

/**
 * Script de validação rápida da configuração do oliva-app
 * Verifica se todas as dependências e configs estão corretas
 */

const fs = require('fs');
const path = require('path');

console.log('\n✅ Validando configuração do Oliva App...\n');

// Apontar para a raiz do projeto (um nível acima de scripts/)
const projectRoot = path.resolve(__dirname, '..');

const isValidHttpsUrl = (value) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const checks = [
  {
    name: 'package.json',
    file: path.join(projectRoot, 'package.json'),
    validator: (content) => {
      const pkg = JSON.parse(content);
      return pkg.main === 'expo/AppEntry' && pkg.dependencies['react-native-webview'];
    },
  },
  {
    name: 'App.native.tsx',
    file: path.join(projectRoot, 'App.native.tsx'),
    validator: (content) => {
      return (
        content.includes("from 'react-native-webview'") &&
        content.includes('onShouldStartLoadWithRequest') &&
        content.includes('appConfig.OLIVA_URL')
      );
    },
  },
  {
    name: 'App.web.tsx',
    file: path.join(projectRoot, 'App.web.tsx'),
    validator: (content) => {
      return (
        content.includes('window.location.replace') &&
        !content.includes('react-native-webview')
      );
    },
  },
  {
    name: 'app.json',
    file: path.join(projectRoot, 'app.json'),
    validator: (content) => {
      const config = JSON.parse(content);
      return (
        config.expo.slug === 'oliva-church' &&
        config.expo.name === 'Oliva Church' &&
        config.expo.newArchEnabled === false
      );
    },
  },
  {
    name: 'tipos TypeScript',
    file: path.join(projectRoot, 'types.ts'),
    validator: (content) => content.includes('WebViewNavigationEvent'),
  },
  {
    name: 'utilitários',
    file: path.join(projectRoot, 'utils.ts'),
    validator: (content) => content.includes('isOlivaDomain'),
  },
  {
    name: 'armazenamento',
    file: path.join(projectRoot, 'storage.ts'),
    validator: (content) => content.includes('StorageManager'),
  },
  {
    name: 'Expo Router scaffold removido',
    file: path.join(projectRoot, 'package.json'),
    validator: () => !fs.existsSync(path.join(projectRoot, 'app')),
  },
  {
    name: 'URLs de exclusão de conta',
    file: path.join(projectRoot, 'compliance', 'account-deletion-urls.json'),
    validator: (content) => {
      const config = JSON.parse(content);
      const { fallbackLocale, accountDeletionUrls } = config;

      if (!fallbackLocale || typeof fallbackLocale !== 'string') {
        return false;
      }

      if (!accountDeletionUrls || typeof accountDeletionUrls !== 'object') {
        return false;
      }

      const locales = Object.keys(accountDeletionUrls);
      if (locales.length === 0) {
        return false;
      }

      if (!accountDeletionUrls[fallbackLocale]) {
        return false;
      }

      return locales.every((locale) => {
        const url = accountDeletionUrls[locale];
        return typeof locale === 'string' && locale.length > 0 && typeof url === 'string' && isValidHttpsUrl(url);
      });
    },
  },
];

let passed = 0;
let failed = 0;

checks.forEach((check) => {
  try {
    if (!fs.existsSync(check.file)) {
      console.log(`❌ ${check.name}: arquivo não encontrado em ${check.file}`);
      failed++;
      return;
    }

    const content = fs.readFileSync(check.file, 'utf-8');
    if (check.validator(content)) {
      console.log(`✅ ${check.name}: OK`);
      passed++;
    } else {
      console.log(`❌ ${check.name}: conteúdo inválido`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${check.name}: erro ao validar (${error.message})`);
    failed++;
  }
});

console.log(`\nResultado: ${passed} ✅  |  ${failed} ❌\n`);

if (failed === 0) {
  console.log('✨ Configuração validada com sucesso!\n');
  console.log('Próximos passos:');
  console.log('  1. npm start');
  console.log('  2. Selecione "a" para Android ou "i" para iOS');
  console.log('  3. Escaneie o QR code com Expo Go (caso necessário)\n');
  process.exit(0);
} else {
  console.log('⚠️  Alguns problemas foram encontrados. Revise acima.\n');
  process.exit(1);
}
