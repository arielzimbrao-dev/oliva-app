# Navegação Mobile — oliva-app

## Visão geral

A navegação no `oliva-app` combina dois sistemas:
1. **Navegação web interna** — gerida pelo `oliva-front` dentro da WebView (react-router, pages SPA)
2. **Controles nativos** — botão de voltar (Android), gestos de swipe (iOS), tratados pelo shell nativo

O app não usa `react-navigation` nem `expo-router`. A navegação de features é completamente delegada ao frontend web.

---

## Botão de voltar — Android

O Android possui um botão físico (ou gesto) de voltar que precisa ser interceptado pelo app. O comportamento implementado é:

```
Usuário pressiona "voltar"
│
├── canGoBack = true  →  webViewRef.current?.goBack()
│                        (volta uma página na WebView, como um browser)
│
└── canGoBack = false →  return false
                         (sistema do Android fecha o app ou volta ao launcher)
```

### Implementação

```ts
useEffect(() => {
  const onBackPress = () => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
      return true;  // interceptei, Android não faz nada adicional
    }
    return false;   // não interceptei, Android executa comportamento padrão
  };

  const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
  return () => subscription.remove();
}, [canGoBack]);
```

O estado `canGoBack` é atualizado via `onNavigationStateChange` a cada mudança de página na WebView.

---

## Gestos de navegação — iOS

No iOS, o swipe da borda esquerda para a direita é o gesto padrão de "voltar". A prop `allowsBackForwardNavigationGestures={true}` na WebView habilita este comportamento nativamente.

```tsx
<WebView
  allowsBackForwardNavigationGestures={true}
  // ...
/>
```

Isso funciona da mesma forma que em um browser iOS — o gesto navega pelo histórico da WebView.

---

## Rastreamento de estado de navegação

```ts
const handleNavigationStateChange = (navState: WebViewNavigation) => {
  setCanGoBack(navState.canGoBack);
  
  const currentUrl = navState.url;
  if (currentUrl && isOlivaDomain(currentUrl)) {
    void storageManager.saveLastUrl(currentUrl);
  }
};
```

A cada mudança de página:
1. Atualiza `canGoBack` para controlar o botão de voltar
2. Persiste a URL atual no `AsyncStorage` **apenas se for domínio Oliva** (segurança)

---

## Deep Links

### Scheme configurado

```json
// app.json
{
  "expo": {
    "scheme": "olivaapp"
  }
}
```

O scheme `olivaapp://` está registrado no sistema operacional. Isso significa que links do tipo `olivaapp://` em outros apps ou notificações podem abrir o `oliva-app`.

### Estado atual

Deep links estão **configurados a nível de scheme** mas **não há handlers de rotas específicas** implementados ainda. O app apenas abre quando recebe um deep link, carregando a URL inicial localizada.

### Roadmap de deep links

Para implementar suporte completo a deep links (ex: `olivaapp://membros/123`), seria necessário:
1. Usar `expo-linking` para capturar a URL recebida na inicialização
2. Mapear o path do deep link para a rota correspondente no `oliva-front`
3. Passar a URL construída como `source` inicial da WebView

**Coordenar com Lucas (Frontend) antes de implementar** — as rotas do `oliva-front` devem ser as mesmas mapeadas nos deep links.

---

## Abertura de links externos

Qualquer link cujo domínio **não seja** `oliva.church` é tratado como externo:

```ts
const openExternalUrl = (url: string) => {
  Linking.openURL(url).catch((err) => {
    console.warn('Failed to open URL:', err);
  });
};
```

`Linking.openURL()` do `expo-linking` delega a abertura para o sistema operacional:
- Links `http://` e `https://` → browser padrão do dispositivo
- Links `tel://` → app de telefone
- Links `mailto://` → app de email
- Links `sms://` → app de SMS

---

## Orientação da tela

O app está configurado para forçar orientação **portrait** (vertical):

```json
// app.json
{
  "expo": {
    "orientation": "portrait"
  }
}
```

Isso garante consistência na experiência do usuário e evita problemas de layout em telas que não foram projetadas para landscape no `oliva-front`.

---

## Safe Area

O app usa `react-native-safe-area-context` para garantir que o conteúdo não fique embaixo do notch (iOS), barra de status (Android) ou gestos de home:

```tsx
<SafeAreaProvider style={{ flex: 1 }}>
  <SafeAreaView style={styles.container}>
    <WebView ... />
  </SafeAreaView>
</SafeAreaProvider>
```

No Android, a propriedade `edgeToEdgeEnabled: true` no `app.json` permite que o conteúdo ocupe toda a tela, incluindo as áreas atrás das barras de sistema — o `SafeAreaView` se encarrega de calcular os insets corretos para que o conteúdo útil não sobreponha as barras.

---

## Comportamentos ausentes (não implementados por design)

| Comportamento | Status | Motivo |
|---------------|--------|--------|
| Splash screen personalizada | ✅ Configurada em `app.json` | Via `expo-splash-screen` plugin |
| Deep link routing (por rota) | ❌ Não implementado | Aguarda definição de rotas com Lucas |
| Push notifications | ❌ Não implementado | Requer permissão nativa e aprovação |
| Biometria para login | ❌ Não implementado | Auth é delegada ao oliva-front |
| Tab bar nativa | ❌ Não existe | Nav está no oliva-front (sidebar web) |
