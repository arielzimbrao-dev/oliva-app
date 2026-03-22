# Segurança — oliva-app

## Princípios de segurança do wrapper

O modelo de segurança do `oliva-app` é baseado em dois pilares:

1. **Confinamento de domínio**: apenas URLs do domínio `oliva.church` permanecem dentro da WebView.
2. **Delegação de autenticação**: o app não guarda nem valida tokens. A segurança de auth pertence ao `oliva-front` e ao `oliva-back`.

---

## Allowlist de domínios

### Regra principal

```
✅ oliva.church           → permanece na WebView
✅ *.oliva.church         → subdomínios também permitidos
❌ qualquer outro domínio → redirect para browser externo
```

### Implementação em `utils.ts`

```ts
const OLIVA_DOMAIN = 'oliva.church';

export const isOlivaDomain = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    return (
      hostname === OLIVA_DOMAIN ||
      hostname.endsWith(`.${OLIVA_DOMAIN}`)
    );
  } catch {
    console.warn('Invalid URL:', url);
    return false; // URL inválida → bloqueia por padrão
  }
};
```

**Detalhes importantes:**
- Usa `new URL()` para parse seguro — não manipula strings manualmente
- `endsWith(`.${OLIVA_DOMAIN}`)` cobre `app.oliva.church`, `api.oliva.church` etc.
- Em caso de exceção (URL malformada), retorna `false` (seguro por padrão)

---

## Identificação de esquemas

### `isSecureScheme(url)`

Verifica se a URL usa HTTP ou HTTPS — usada para decidir se links externos de outros domínios devem ser abertos no browser:

```ts
export const isSecureScheme = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};
```

### `isSpecialScheme(url)`

Verifica esquemas especiais (telefone, email, SMS) que devem ser abertos em apps nativos:

```ts
const SPECIAL_SCHEMES = ['tel:', 'mailto:', 'sms:', 'maps:', 'geo:', 'intent:'];

export const isSpecialScheme = (url: string): boolean => {
  return SPECIAL_SCHEMES.some(scheme => url.toLowerCase().startsWith(scheme));
};
```

---

## Fluxo de decisão de segurança na navegação

```
URL recebida em onShouldStartLoadWithRequest
│
├─ Vazia / "about:blank" → ALLOW (navegação interna)
│
├─ isOlivaDomain() = true → ALLOW (domínio autorizado)
│
├─ isSpecialScheme() = true
│   ├─ openExternalUrl() → expo-linking abre app nativo
│   └─ BLOCK na WebView
│
├─ isSecureScheme() = true (http/https de outro domínio)
│   ├─ openExternalUrl() → abre no browser do sistema
│   └─ BLOCK na WebView
│
└─ Qualquer outro caso → BLOCK silencioso
```

---

## User-Agent como identificador

O app configura um User-Agent customizado:

```
OlivaChurchApp/1.0
```

Isso permite que o backend (`oliva-back`) distinga requisições do app mobile de outros clientes. Nunca deve ser alterado sem coordenação com o backend.

---

## JavaScript Bridge — Segurança

O script injetado na WebView sobrescreve `window.open()`. Para garantir que isso não vire um vetor de ataque:

1. **Validação de tipo**: o handler de mensagens só processa `type === 'openLink'`
2. **Validação de URL**: requer que `message.url` exista e seja string
3. **Try/catch**: erros de parsing não propagam exceção para o componente
4. **IIFE**: o script é encapsulado em `(function() { ... })()` para não poluir o escopo global

```ts
const handleMessage = (event: WebViewMessageEvent) => {
  try {
    const message = JSON.parse(event.nativeEvent.data) as WebViewMessage;
    if (message.type === 'openLink' && message.url) {
      openExternalUrl(message.url);
    }
    // Qualquer outra mensagem é ignorada silenciosamente
  } catch (parseError) {
    console.warn('Error parsing WebView message:', parseError);
  }
};
```

---

## AsyncStorage — O que é guardado

O `AsyncStorage` é o armazenamento nativo app-local. O `oliva-app` armazena **apenas**:

| Chave | Conteúdo | Sensível? |
|-------|----------|-----------|
| `@oliva_last_url` | Última URL visitada do domínio Oliva | Baixo risco — apenas URL |
| `@oliva_user_prefs` | Preferências de UX mobile | Baixo risco — sem dados pessoais |
| `@oliva_cache_ts` | Timestamp do cache | Não sensível |

**Nunca guardado:** tokens JWT, senhas, dados pessoais, credenciais.

A sessão do usuário (JWT, refresh token) é gerida exclusivamente pelo `localStorage`/cookies da WebView, que são de responsabilidade do `oliva-front`.

---

## Segurança no iOS — NSAppTransportSecurity

```json
// app.json → expo.ios.infoPlist
{
  "NSAppTransportSecurity": {
    "NSAllowsArbitraryLoadsInWebContent": true
  }
}
```

- `NSAllowsArbitraryLoadsInWebContent: true` aplica-se **somente ao conteúdo dentro de WebViews**
- O restante do app (chamadas nativas de rede) ainda é protegido pelo ATS padrão do iOS
- Esta configuração é necessária para que a WebView possa carregar o `oliva-front` sem bloqueios de ATS

---

## Prevenção de ataques comuns

| Vetor | Mitigação implementada |
|-------|----------------------|
| Open Redirect na WebView | Allowlist por domínio em `isOlivaDomain()` |
| Abertura de URLs arbitrárias | `setSupportMultipleWindows={false}` + interceptor |
| Injeção de scripts maliciosos via `window.open` | Bridge tipada com validação de `type` e `url` |
| Armazenamento de credenciais nativas | Não armazenado — delegado ao WebView storage |
| Exposição de User-Agent de terceiros | UA customizado `OlivaChurchApp/1.0` |
| Content mixed HTTP/HTTPS | `mixedContentMode="compatibility"` com controle de acesso ao domínio |

---

## O que NÃO fazer (restrições de segurança)

```
❌ Não hardcode JWTs, API keys ou senhas no código
❌ Não leia tokens do localStorage da WebView via injeção de JS
❌ Não adicione domínios à allowlist sem aprovação explícita
❌ Não altere o User-Agent sem coordenar com o backend
❌ Não persista dados pessoais no AsyncStorage
❌ Não desabilite o interceptor onShouldStartLoadWithRequest
❌ Não use mixedContentMode="always" (inseguro)
```
