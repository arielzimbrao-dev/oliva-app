# Fluxos Principais — oliva-app

## 1. Fluxo de inicialização do app

```
┌─────────────────────────────────────────────────────────┐
│  Usuário abre o app                                      │
└───────────────┬─────────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────┐
│  Expo lança App.native.tsx    │
│  (plataforma: Android / iOS)  │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────┐
│  useMemo → getLocaleUrl()                              │
│  expo-localization detecta idioma do dispositivo       │
│                                                       │
│  ex: "pt-BR" → "https://oliva.church/pt-br/login"    │
│  ex: "en-US" → "https://oliva.church/en/login"       │
│  ex: "ja"    → fallback "https://oliva.church/en/login" │
└───────────────┬───────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────┐
│  Splash Screen (expo-splash-screen) │
│  Exibida enquanto Expo inicializa  │
└──────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────────┐
│  Renderiza:                                          │
│  SafeAreaProvider > SafeAreaView > WebView          │
│  source={{ uri: initialUrl }}                        │
└───────────────┬──────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────────┐
│  onLoadStart → isLoading = true                      │
│  Exibe ActivityIndicator (full-screen)               │
└───────────────┬──────────────────────────────────────┘
                │
         ┌──────┴──────┐
         │             │
      Sucesso        Erro
         │             │
         ▼             ▼
  onLoadEnd →    onError →
  isLoading=false  Tela de erro
                 + botão "Tentar novamente"
```

---

## 2. Fluxo de navegação interna (rotas do oliva-front)

```
Usuário clica em link dentro do oliva-front
        │
        ▼
onShouldStartLoadWithRequest(request)
        │
isOlivaDomain(url) === true?
        │
   ✅ SIM → return true → WebView navega normalmente
        │
onNavigationStateChange(navState)
        ├── setCanGoBack(navState.canGoBack)
        └── isOlivaDomain(url) → storageManager.saveLastUrl(url)
        │
   WebView exibe nova página do oliva-front
```

---

## 3. Fluxo de link externo (outro domínio)

```
Link externo é acionado no oliva-front
(ex: link para pagamento Stripe, política de privacidade, etc.)
        │
        ▼
onShouldStartLoadWithRequest(request)
        │
isOlivaDomain(url) === false
        │
isSpecialScheme(url) ou isSecureScheme(url)?
        │
   ✅ SIM → openExternalUrl(url)
              Linking.openURL(url)
              Sistema operacional abre:
              - Browser padrão (para http/https)
              - App de telefone (para tel:)
              - App de email (para mailto:)
        │
        └── return false → WebView NÃO navega para o link
```

---

## 4. Fluxo de `window.open()` (JavaScript Bridge)

```
oliva-front executa window.open("https://external.com")
        │
        ▼
JavaScript injetado intercepta a chamada
window.open() sobrescrito pelo injectedJavaScript
        │
        ▼
window.ReactNativeWebView.postMessage({
  type: 'openLink',
  url: 'https://external.com'
})
        │
        ▼
WebView dispara evento onMessage
        │
        ▼
handleMessage(event)
  └── Parseia JSON
  └── message.type === 'openLink' && message.url?
        │
   ✅ SIM → openExternalUrl(url)
              browser do sistema abre a URL
```

---

## 5. Fluxo de erro de carregamento

```
WebView falha ao carregar a página
(sem internet, URL inválida, timeout, etc.)
        │
        ▼
onError(syntheticEvent)
  └── setError(syntheticEvent.nativeEvent.description)
  └── setIsLoading(false)
        │
        ▼
UI de erro é exibida:
┌──────────────────────────────────┐
│ ❌ Erro ao carregar: <mensagem>  │
│                                  │
│  [  Tentar novamente  ]          │
└──────────────────────────────────┘
        │
Usuário toca "Tentar novamente"
        │
        ▼
webViewRef.current?.reload()
        │
        ▼
WebView recarrega a URL atual
→ Retorna ao Fluxo de Inicialização (item 1)
```

---

## 6. Fluxo do botão de voltar (Android)

```
Usuário pressiona botão/gesto de voltar
        │
        ▼
BackHandler.onBackPress()
        │
   canGoBack === true?
        │
   ✅ SIM → webViewRef.current?.goBack()
              WebView volta página anterior
              return true (Android não faz nada extra)
        │
   ❌ NÃO → return false
              Android executa comportamento padrão
              (volta ao launcher, fecha o app)
```

---

## 7. Fluxo de versão web (App.web.tsx)

```
URL do app é acessada em um browser web
(ex: Expo Web)
        │
        ▼
App.web.tsx é carregado (expo seleciona .web.tsx)
        │
        ▼
useEffect → window.location.replace(redirectUrl)
  redirectUrl = appConfig.OLIVA_URL
             = "https://oliva.church/"
        │
        ▼
Browser redireciona para o oliva-front diretamente
        │
  FailSafe: se o redirect falhar em 200ms
  exibe botão "Abrir agora"
  onPress → window.location.assign(redirectUrl)
```

---

## 8. Fluxo de logout (limpeza de storage)

```
Usuário faz logout no oliva-front (dentro da WebView)
        │
        ▼
oliva-front limpa localStorage, cookies (sessão web)
        │
        ▼
[Quando implementado pelo app]
storageManager.clearAll()
  └── Remove @oliva_last_url
  └── Remove @oliva_user_prefs
  └── Remove @oliva_cache_ts
        │
        ▼
WebView navega para a página de login
(gerenciada pelo oliva-front)
```

**Nota**: O app atualmente não escuta eventos de logout do `oliva-front`. A limpeza do `AsyncStorage` pode ser acionada se futuramente o `oliva-front` postar uma mensagem via JavaScript Bridge com `type: 'logout'`.

---

## 9. Fluxo de deep link recebido (scheme `olivaapp://`)

```
Sistema operacional recebe uma URL olivaapp://...
(ex: notificação push, link de outro app)
        │
        ▼
iOS/Android abre o oliva-app
        │
        ▼
[Estado atual - Não implementado como routing]
App inicializa normalmente com getLocaleUrl()
Não há handler de routing por path ainda
        │
        ▼
[Futuro - quando implementado]
expo-linking.getInitialURL() → captura a URL recebida
Mapeia path → URL do oliva-front
WebView carrega com a URL específica
```
