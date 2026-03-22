# Sistema WebView — oliva-app

## O que é a WebView

A WebView é o componente central de todo o `oliva-app`. Ela é fornecida pela biblioteca `react-native-webview` e renderiza um browser nativo embutido dentro do app, carregando o `oliva-front` como se fosse uma página web normal — mas dentro de um container mobile nativo.

```
App.native.tsx
└── <SafeAreaProvider>
    └── <SafeAreaView>
        └── <WebView source={{ uri: initialUrl }} ... />
            └── oliva-front rodando em https://oliva.church/
```

---

## Configuração da WebView

### Props críticas

```tsx
<WebView
  ref={webViewRef}
  source={{ uri: initialUrl }}          // URL inicial (locale-aware)
  startInLoadingState={true}            // Mostra loading nativo enquanto carrega
  javaScriptEnabled={true}             // Obrigatório para o oliva-front funcionar
  domStorageEnabled={true}             // Preserva localStorage e sessionStorage da web
  allowsBackForwardNavigationGestures={true}  // Gestos de swipe no iOS
  allowsInlineMediaPlayback={true}     // Evita que vídeos abram em tela cheia forçado
  allowsFullscreenVideo={true}         // Permite fullscreen de vídeo quando solicitado
  setSupportMultipleWindows={false}    // Impede abertura de janelas/tabs externas
  mixedContentMode="compatibility"    // Compatibilidade com conteúdo misto HTTP/HTTPS
  thirdPartyCookiesEnabled={true}      // Preserva cookies para sessão
  userAgent={appConfig.USER_AGENT}     // "OlivaChurchApp/1.0"
/>
```

### Props de callbacks

```tsx
onLoadStart={handleLoadStart}                 // Início de carregamento → isLoading = true
onLoadEnd={handleLoadEnd}                     // Fim de carregamento → isLoading = false
onError={handleError}                         // Erro de carregamento → exibe tela de erro
onMessage={handleMessage}                     // Recebe mensagens do JavaScript Bridge
onNavigationStateChange={handleNavigationStateChange}  // Estado de navegação (canGoBack, URL)
onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}  // Interceptor de requisições
renderLoading={() => <ActivityIndicator />}   // UI de loading inicial full-screen
```

---

## Interceptação de URLs — `onShouldStartLoadWithRequest`

Este é o **coração do sistema de segurança da WebView**. Todo pedido de navegação (click em link, redirect, form submit etc.) passa por esta função antes de ser executado.

### Lógica de decisão

```
handleShouldStartLoadWithRequest(request)
│
├── URL vazia ou 'about:blank'
│   └── return true  (permito, é navegação interna)
│
├── isOlivaDomain(url) === true
│   └── return true  (permito, é domínio Oliva)
│
├── isSpecialScheme(url)  (tel:, mailto:, sms:, etc.)
│   ├── openExternalUrl(url)  → expo-linking
│   └── return false  (bloqueio na WebView)
│
├── isSecureScheme(url)  (http:// ou https:// de outro domínio)
│   ├── openExternalUrl(url)  → expo-linking
│   └── return false  (bloqueio na WebView)
│
└── Qualquer outro caso
    └── return false  (bloqueio silencioso)
```

### Código da função

```ts
const handleShouldStartLoadWithRequest = (request: WebViewNavigation) => {
  const url = request.url ?? '';

  if (!url || url === 'about:blank') return true;
  if (isOlivaDomain(url)) return true;

  if (isSpecialScheme(url) || isSecureScheme(url)) {
    openExternalUrl(url);
  }

  return false;
};
```

---

## URL inicial — Detecção de idioma

A URL inicial não é fixa. O app detecta o idioma do dispositivo via `expo-localization` e escolhe a rota de login correspondente:

```ts
// utils.ts
export const getLocaleUrl = (): string => {
  try {
    const locales = getLocales();
    const languageTag = locales[0]?.languageTag ?? '';

    // Tenta match exato: "pt-BR", "pt-PT", "en", "es", "fr"
    if (LOCALE_URL_MAP[languageTag]) return LOCALE_URL_MAP[languageTag];

    // Tenta match por idioma base: "pt", "en", "es"
    const lang = languageTag.split('-')[0];
    if (lang && LOCALE_URL_MAP[lang]) return LOCALE_URL_MAP[lang];

    // Fallback: inglês
    return OLIVA_FALLBACK_URL;
  } catch {
    return OLIVA_FALLBACK_URL; // Sempre seguro
  }
};
```

Em `App.native.tsx`, esta função é chamada uma única vez via `useMemo`:
```ts
const initialUrl = useMemo(() => getLocaleUrl(), []);
```

---

## JavaScript Bridge — Interceptação de `window.open()`

A WebView bloqueia nativamente `window.open()` porque ela não pode abrir novas janelas/abas. Para que links do `oliva-front` que usam `window.open()` funcionem corretamente no mobile, o app injeta um script que sobrescreve esse comportamento:

### Script injetado

```ts
const injectedJavaScript = `
  (function() {
    const originalOpen = window.open;
    window.open = function(url, target, features) {
      if (url) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'openLink',
          url: String(url)
        }));
      }
      return originalOpen.call(this, url, target, features);
    };
  })();
`;
```

### Handler de mensagens

```ts
const handleMessage = (event: WebViewMessageEvent) => {
  try {
    const message = JSON.parse(event.nativeEvent.data) as WebViewMessage;
    if (message.type === 'openLink' && message.url) {
      openExternalUrl(message.url);
    }
  } catch (parseError) {
    console.warn('Error parsing WebView message:', parseError);
  }
};
```

**Segurança:** O handler só processa a mensagem se o `type` for `'openLink'` e houver uma `url`. Qualquer outro tipo é ignorado silenciosamente.

---

## Gestão de estados da WebView

### Estados controlados pelo componente

```ts
const [isLoading, setIsLoading] = useState(true);   // Controla overlay de loading
const [error, setError] = useState<string | null>(null);  // Mensagem de erro
const [canGoBack, setCanGoBack] = useState(false);  // Habilita botão de voltar
```

### Máquina de estados simplificada

```
INICIAL
  │
  ▼
[isLoading=true] ← onLoadStart
  │
  ├─ Sucesso → onLoadEnd → [isLoading=false, error=null]
  │
  └─ Erro → onError → [isLoading=false, error="mensagem"]
                │
                └─ Botão "Tentar novamente" → webViewRef.current?.reload()
```

---

## UI de loading e erro

### Loading overlay

Exibido sobre a WebView enquanto `isLoading=true`:
```tsx
{isLoading && (
  <View style={styles.loadingOverlay} pointerEvents="none">
    <ActivityIndicator size="small" color="#1976d2" />
  </View>
)}
```

Note: `pointerEvents="none"` garante que o overlay não bloqueie interações com a WebView.

Há também o `renderLoading` da WebView que exibe um full-screen loading durante o carregamento inicial.

### Tela de erro

Exibida quando `error !== null`, com botão de retry:
```tsx
{error && (
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>Erro ao carregar: {error}</Text>
    <TouchableOpacity onPress={() => webViewRef.current?.reload()}>
      <Text>Tentar novamente</Text>
    </TouchableOpacity>
  </View>
)}
```

---

## User-Agent

O app configura um User-Agent customizado na WebView:

```
OlivaChurchApp/1.0
```

Isso permite que o `oliva-back` (e o `oliva-front`) identifiquem se uma requisição vem do app mobile. Futuramente pode ser usado para:
- Personalizar layout mobile específico no frontend
- Analytics de plataforma no backend
- Feature flags específicas para o app

**Nunca altere o User-Agent sem coordenação com o backend (Nehemias).**

---

## Propriedades de segurança na WebView

| Propriedade | Valor | Razão |
|-------------|-------|-------|
| `setSupportMultipleWindows` | `false` | Impede abertura de tabs/janelas externas dentro da WebView |
| `mixedContentMode` | `"compatibility"` | Permite recursos HTTP dentro de páginas HTTPS (ex: imagens) |
| `javaScriptEnabled` | `true` | Obrigatório para o SPA React do oliva-front funcionar |
| `domStorageEnabled` | `true` | Preserva a sessão do usuário (localStorage) |
| `thirdPartyCookiesEnabled` | `true` | Necessário para cookies de sessão em Android |
| `allowsInlineMediaPlayback` | `true` | Evita comportamento de fullscreen forçado em vídeos |

---

## NSAppTransportSecurity (iOS)

No `app.json`, a seguinte configuração está presente para iOS:

```json
"infoPlist": {
  "NSAppTransportSecurity": {
    "NSAllowsArbitraryLoadsInWebContent": true
  }
}
```

Isso é necessário pois o iOS por padrão bloqueia conteúdo HTTP dentro de WebViews. O `NSAllowsArbitraryLoadsInWebContent` permite que a WebView (e apenas ela) carregue conteúdo fora do ATS, enquanto o restante do app ainda é protegido pelo ATS.
