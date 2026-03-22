# Oliva Church — App Mobile

**Versão:** 1.0.0 | **Plataformas:** Android · iOS · Web (fallback) | **Stack:** Expo 54 · React Native 0.81 · TypeScript  
**Status:** Ativo em desenvolvimento

---

## O que é este projeto?

O `oliva-app` é o **wrapper mobile oficial do Oliva Church**. Sua função principal é hospedar a aplicação web `oliva-front` dentro de uma WebView nativa, oferecendo experiência de app (ícone na tela inicial, splash screen, gestos nativos, botão de voltar no Android) sem duplicar a lógica de negócio no lado mobile.

A autenticação, regras de negócio e todas as funcionalidades (membros, financeiro, eventos, departamentos etc.) residem exclusivamente no frontend web e no backend. O app mobile é uma camada de **integração e UX**, não um app nativo de features.

---

## Navegação pela documentação

| Documento | Descrição |
|-----------|-----------|
| [ARCHITECTURE.md](markdowns/ARCHITECTURE.md) | Visão geral da arquitetura, decisões de design e padrões |
| [STRUCTURE.md](markdowns/STRUCTURE.md) | Estrutura de pastas e responsabilidade de cada arquivo |
| [WEBVIEW.md](markdowns/WEBVIEW.md) | Sistema WebView: configuração, interceptação de URLs e JavaScript Bridge |
| [NAVIGATION.md](markdowns/NAVIGATION.md) | Navegação mobile, botão de voltar, gestos iOS e deep links |
| [SECURITY.md](markdowns/SECURITY.md) | Allowlist de domínios, proteção de links externos, boas práticas |
| [STORAGE.md](markdowns/STORAGE.md) | Persistência local, AsyncStorage e gestão de preferências |
| [FLOWS.md](markdowns/FLOWS.md) | Fluxos principais: inicialização, erro, sessão, link externo |
| [BUILD.md](markdowns/BUILD.md) | Configuração de build, EAS, identificadores de pacote, assets |
| [DEPENDENCIES.md](markdowns/DEPENDENCIES.md) | Dependências, versões e justificativa de uso |

---

## Início rápido

### Pré-requisitos

- Node.js >= 20
- npm ou yarn
- Para iOS: macOS + Xcode
- Para Android: Android Studio + emulador configurado

### Instalação

```bash
cd oliva-app
npm install
```

### Executar em desenvolvimento

```bash
# Menu interativo Expo (escolha plataforma)
npm start

# Diretamente no Android
npm run android

# Diretamente no iOS
npm run ios

# Versão web (fallback/redirect)
npm run web

# Com tunnel (dispositivo físico externo)
npm run start:tunnel
```

### Validar configuração

```bash
node scripts/validate.js
# Esperado: 6 ✅ | 0 ❌
```

### Lint

```bash
npm run lint
```

---

## Pontos de entrada

| Arquivo | Plataforma | Função |
|---------|-----------|--------|
| `App.native.tsx` | Android + iOS | WebView host completo, tratamento de navegação e erros |
| `App.web.tsx` | Web | Redirecionamento para `https://oliva.church/` |

O Expo seleciona automaticamente o arquivo correto via extensão de plataforma (`.native.tsx` vs `.web.tsx`). O entry point configurado em `package.json` é `expo/AppEntry`.

---

## URL carregada na WebView

O app detecta o idioma do dispositivo via `expo-localization` e redireciona para a rota de login localizada:

| Idioma do dispositivo | URL carregada |
|----------------------|---------------|
| Português (BR) | `https://oliva.church/pt-br/login` |
| Português (PT) | `https://oliva.church/pt-pt/login` |
| Inglês | `https://oliva.church/en/login` |
| Espanhol | `https://oliva.church/es/login` |
| Francês | `https://oliva.church/fr/login` |
| Outros (fallback) | `https://oliva.church/en/login` |

---

## Domínios permitidos na WebView

Apenas URLs do domínio `oliva.church` e seus subdomínios permanecem dentro da WebView. Qualquer link externo é aberto no navegador nativo do sistema operacional.

```
✅  oliva.church
✅  *.oliva.church  (subdomínios)
❌  qualquer outro domínio → navegador externo
```

---

## Compliance — Exclusão de conta

O arquivo `compliance/account-deletion-urls.json` mapeia as URLs de exclusão de conta por idioma, conforme exigência das lojas (Apple App Store e Google Play).

| Locale | URL |
|--------|-----|
| `en` | `https://oliva.church/en/app/delete-church` |
| `es` | `https://oliva.church/es/app/eliminar-iglesia` |
| `fr` | `https://oliva.church/fr/app/supprimer-eglise` |
| `pt-br` | `https://oliva.church/pt-br/app/apagar-igreja` |
| `pt-pt` | `https://oliva.church/pt-pt/app/apagar-igreja` |

---

## Responsáveis

| Papel | Nome | Escopo |
|-------|------|--------|
| Mobile Engineering | Filipe | Wrapper, WebView, builds, deep links |
| Frontend | Lucas | Rotas web carregadas no WebView |
| QA | Tomé | Cobertura de testes mobile e regressão |
| Produto/UX | Barnabé + Débora | Decisões de fluxo e experiência |

---

## Regras de contribuição

1. Leia `context.md` deste pacote e `oliva-front/context.md` antes de qualquer alteração.
2. Mantenha mudanças focadas no escopo wrapper — não replique lógica de negócio nativamente.
3. Toda nova permissão nativa deve ser justificada e aprovada antes de adicionar.
4. Rodar `npm run lint` e `node scripts/validate.js` antes de qualquer commit.
5. Seguir padrão Conventional Commits: `feat`, `fix`, `chore`, `docs`, `refactor`.
6. Publicar sempre em `main` após validação.

---

_Para entendimento do sistema completo, consulte também `oliva-front/context.md` (rotas e fluxos web) e `context.md` na raiz do workspace (visão geral do monorepo)._
