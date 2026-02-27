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

const checks = [
  {
    name: 'package.json',
    file: path.join(projectRoot, 'package.json'),
    validator: (content) => {
      const pkg = JSON.parse(content);
      return pkg.main === 'App.tsx' && pkg.dependencies['react-native-webview'];
    },
  },
  {
    name: 'App.tsx',
    file: path.join(projectRoot, 'App.tsx'),
    validator: (content) => content.includes('WebView') && content.includes('oliva.church'),
  },
  {
    name: 'app.json',
    file: path.join(projectRoot, 'app.json'),
    validator: (content) => {
      const config = JSON.parse(content);
      return config.expo.slug === 'oliva-church' && config.expo.name === 'Oliva Church';
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
