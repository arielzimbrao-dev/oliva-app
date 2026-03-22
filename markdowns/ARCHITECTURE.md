# Arquitetura do oliva-app

## Visão geral

O `oliva-app` adota uma **arquitetura de wrapper (shell)**: o app mobile não contém lógica de negócio própria. Ele é um container nativo que hospeda a aplicação web `oliva-front` dentro de uma WebView, atuando como ponte entre a camada nativa (Android/iOS) e o frontend web.

```
┌─────────────────────────────────────────────┐
│              Dispositivo Móvel               │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │         Shell Nativo (Expo)           │   │
│  │  • Splash Screen                      │   │
│  │  • SafeAreaView                       │   │
│  │  • Tratamento de erros/retry          │   │
│  │  • Botão de voltar (Android)          │   │
│  │  • Gestos de navegação (iOS)          │   │
│  │                                       │   │
│  │  ┌───────────────────────────────┐    │   │
│  │  │         WebView               │    │   │
│  │  │  https://oliva.church/        │    │   │
│  │  │  (oliva-front rodando no SaaS) │   │   │
│  │  └───────────────────────────────┘    │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  AsyncStorage (preferências lokais)         │
└─────────────────────────────────────────────┘
         │                    ▲
         │  HTTPS             │  JWT / Cookies
         ▼                    │
┌─────────────────┐   ┌───────────────────────┐
│   oliva-back    │   │      oliva-front       │
│  (NestJS API)   │◄──│  (React + Vite - web)  │
└─────────────────┘   └───────────────────────┘
```

---

## Princípio fundamental: Wrapper-First

**A regra mais importante da arquitetura:**

> O app mobile não tem nem deve ter features nativas próprias além das necessárias para o funcionamento do wrapper. Toda lógica de negócio (auth, membros, financeiro, eventos etc.) vive no frontend web e no backend.

Isso significa:
- Não existe state management complexo no app (Redux, Zustand, etc.)
- Não existem screens nativas para funcionalidades de negócio
- Auth é gerida pelo `oliva-front` via WebView storage
- O app mobile só é responsável por: carregar a WebView, tratar navegação, gerenciar erros e persistir preferências simples de contexto mobile

---

## Separação de responsabilidades

### O que o app mobile FAZ

| Responsabilidade | Arquivo | Detalhes |
|-----------------|---------|---------|
| Hospedar WebView | `App.native.tsx` | Carrega `oliva-front` via URL |
| Detectar idioma e redirecionar para URL localizada | `utils.ts` → `getLocaleUrl()` | 5 idiomas + fallback EN |
| Interceptar links externos | `App.native.tsx` → `handleShouldStartLoadWithRequest` | Abre no browser do sistema |
| Tratar botão de voltar (Android) | `App.native.tsx` → `useEffect BackHandler` | Go back / fechar app |
| Exibir loading e erro/retry | `App.native.tsx` | ActivityIndicator + tela de erro |
| Persistir última URL visitada | `storage.ts` → `saveLastUrl()` | AsyncStorage |
| Interceptar `window.open()` da web | JavaScript Bridge (injectedJavaScript) | Evita abertura de tab externa |
| Redirecionar na versão web | `App.web.tsx` | fallback para browser |

### O que o app mobile NÃO FAZ

- Não interpreta tokens JWT diretamente
- Não navega por rotas sem passar pelo frontend web
- Não faz chamadas à API diretamente
- Não gerencia sessão de usuário nativamente
- Não exibe telas de negócio nativas (login, dashboard, membros, etc.)

---

## Seleção de plataforma pelo Expo

O Expo utiliza a convenção de sufixo `.native.tsx` / `.web.tsx` para selecionar automaticamente o componente correto por plataforma:

```
package.json → "main": "expo/AppEntry"
                        │
              ┌─────────▼──────────┐
              │    Expo Runtime     │
              └─────────┬──────────┘
         ┌──────────────┴──────────────┐
    Android/iOS                       Web
         │                             │
   App.native.tsx                App.web.tsx
   (WebView wrapper)             (Redirect)
```

---

## Fluxo de inicialização

```
1. Expo lança App (platform-specific)
        │
2. [App.native.tsx] useMemo → getLocaleUrl()
   Detecta locale do dispositivo via expo-localization
        │
3. Monta SafeAreaProvider + SafeAreaView
        │
4. Renderiza <WebView source={{ uri: initialUrl }} />
        │
5. onLoadStart → isLoading = true (overlay)
        │
6. WebView carrega https://oliva.church/{locale}/login
        │
7. onLoadEnd → isLoading = false
        │
8. Usuário interage com oliva-front normalmente
        │
9. Cada navegação → onNavigationStateChange
   - Atualiza canGoBack
   - Persiste URL se for domínio Oliva (saveLastUrl)
```

---

## JavaScript Bridge

O app injeta um script JavaScript na WebView para interceptar chamadas a `window.open()` — que em contexto WebView seria ignorada ou causaria comportamento inesperado:

```
oliva-front chama window.open("https://external.com")
        │
injectedJavaScript sobrescreve window.open
        │
Posta mensagem para nativo: { type: 'openLink', url: '...' }
        │
handleMessage recebe e chama openExternalUrl(url)
        │
expo-linking abre no browser do sistema operacional
```

---

## Gestão de sessão e autenticação

A sessão é **completamente delegada ao frontend web**:

1. O `oliva-front` armazena JWT e refresh token nos cookies / localStorage do browser da WebView.
2. A propriedade `domStorageEnabled={true}` garante que o WebView tenha acesso ao `localStorage` e `sessionStorage`.
3. A propriedade `thirdPartyCookiesEnabled={true}` preserva cookies entre navegações.
4. O app nativo não lê, não escreve e não valida tokens — apenas não apaga o storage da WebView.

O `AsyncStorage` nativo (`storage.ts`) **não guarda credenciais**. Ele serve apenas para preferências de UX mobile (última URL visitada, preferências).

---

## Módulos e suas fronteiras

```
oliva-app/
├── types.ts        → Contratos TypeScript internos do wrapper
├── utils.ts        → Funções puras: validação de URL, detecção de idioma
├── storage.ts      → Abstração de AsyncStorage (sem lógica de negócio)
├── App.native.tsx  → Componente raiz + toda a UX mobile
├── App.web.tsx     → Redirect simples para a web
└── app.json        → Configuração declarativa do Expo/build
```

Nenhum módulo importa de `oliva-front` ou `oliva-back`. A comunicação entre o app e a web ocorre exclusivamente via WebView (HTTP dentro do container).

---

## Decisões de arquitetura registradas

| Decisão | Justificativa |
|---------|---------------|
| Wrapper-first (sem features nativas) | Minimiza retrabalho frente a mudanças no frontend web |
| Auth delegada à WebView | Evita duplicação de lógica de token e sincronização entre native e web |
| Allowlist de domínio no interceptor | Impede que links externos (padrões de conversão, PDFs, terceiros) fiquem presos na WebView |
| User-Agent customizado (`OlivaChurchApp/1.0`) | Permite que o backend identifique requisições vindas do app mobile |
| `expo/AppEntry` como entry point | Suporte nativo ao sistema de resolução de plataforma do Expo |
| `newArchEnabled: true` em app.json | Habilita a nova arquitetura React Native (Fabric + JSI) para melhor desempenho |
| `edgeToEdgeEnabled: true` (Android) | Conteúdo ocupa a tela inteira, respeitando SafeAreaView para não sobrepor barras do sistema |
