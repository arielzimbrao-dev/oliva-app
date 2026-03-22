# Estrutura do Projeto — oliva-app

## Árvore de diretórios

```
oliva-app/
│
├── App.native.tsx              ← Componente raiz para Android e iOS
├── App.web.tsx                 ← Componente raiz para Web (redirect)
├── types.ts                    ← Interfaces e configurações TypeScript
├── utils.ts                    ← Funções utilitárias (URL, locale, segurança)
├── storage.ts                  ← Abstração sobre AsyncStorage
│
├── app.json                    ← Configuração Expo (nome, bundle ID, ícones, plugins)
├── package.json                ← Dependências, versões e scripts NPM
├── tsconfig.json               ← Configuração TypeScript (strict mode, paths)
├── eslint.config.js            ← Configuração ESLint (baseada em eslint-config-expo)
│
├── README.md                   ← Documentação principal (este projeto)
├── context.md                  ← Contexto para agentes de IA e equipe
├── SUMMARY.txt                 ← Histórico do MVP inicial
│
├── markdowns/                  ← Documentação técnica detalhada
│   ├── ARCHITECTURE.md         ← Arquitetura e decisões de design
│   ├── STRUCTURE.md            ← Este arquivo
│   ├── WEBVIEW.md              ← Sistema WebView
│   ├── NAVIGATION.md           ← Navegação e deep links
│   ├── SECURITY.md             ← Segurança e allowlist
│   ├── STORAGE.md              ← Persistência local
│   ├── FLOWS.md                ← Fluxos principais
│   ├── BUILD.md                ← Build e publicação
│   └── DEPENDENCIES.md         ← Dependências e versões
│
├── scripts/
│   ├── validate.js             ← Validação automática de configuração (6 checks)
│   └── reset-project.js        ← Script auxiliar de reset (scaffold Expo)
│
├── assets/
│   └── images/
│       ├── icon.png                        ← Ícone principal do app (iOS)
│       ├── favicon.png                     ← Favicon para versão web
│       ├── splash-icon.png                 ← Imagem exibida na splash screen
│       ├── android-icon-foreground.png     ← Camada frontal do ícone adaptativo Android
│       └── android-icon-background.png     ← Camada de fundo do ícone adaptativo Android
│
├── compliance/
│   └── account-deletion-urls.json  ← URLs de exclusão de conta por locale
│
└── android/                    ← Projeto Android nativo (gerado pelo Expo)
    ├── build.gradle
    ├── settings.gradle
    ├── gradle.properties
    ├── gradlew / gradlew.bat
    ├── gradle/
    ├── app/
    └── build/
```

---

## Responsabilidade de cada arquivo principal

### `App.native.tsx`

**Componente raiz da plataforma nativa (Android + iOS).**

Responsável por:
- Renderizar o `<WebView>` com a URL inicial localizada
- Controlar os estados de loading, erro e navegação
- Interceptar requisições de navegação via `onShouldStartLoadWithRequest`
- Injetar JavaScript para capturar `window.open()`
- Tratar o botão físico de voltar no Android via `BackHandler`
- Exibir overlay de loading e tela de erro com botão de retry

Imports principais:
```ts
import { WebView } from 'react-native-webview';
import * as Linking from 'expo-linking';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { storageManager } from './storage';
import { appConfig } from './types';
import { getLocaleUrl, isOlivaDomain, isSecureScheme, isSpecialScheme } from './utils';
```

---

### `App.web.tsx`

**Componente raiz para a plataforma web.**

O Expo pode compilar o projeto para web, mas a WebView nativa não existe nesse contexto. Este componente simplesmente redireciona o usuário para `https://oliva.church/` usando `window.location.replace()` com um botão de fallback caso o redirect automático falhe.

Não utiliza `react-native-webview`.

---

### `types.ts`

**Definições TypeScript compartilhadas do wrapper.**

Exporta:
- `WebViewNavigationEvent` — shape de evento de navegação da WebView
- `WebViewMessage` — shape de mensagem postada via JavaScript Bridge
- `AppConfig` — interface da configuração central
- `appConfig` — objeto de configuração com valores em runtime:
  - `OLIVA_URL`: `'https://oliva.church/'`
  - `OLIVA_DOMAIN`: `'oliva.church'`
  - `ENABLE_DEBUG`: `true` em desenvolvimento, `false` em produção
  - `USER_AGENT`: `'OlivaChurchApp/1.0'`

---

### `utils.ts`

**Funções puras de validação e utilitários de URL.**

| Função | Assinatura | Descrição |
|--------|-----------|-----------|
| `getLocaleUrl()` | `() => string` | Retorna URL de login localizada com base no idioma do dispositivo |
| `isOlivaDomain(url)` | `(url: string) => boolean` | Verifica se a URL pertence ao domínio `oliva.church` ou subdomínios |
| `getHostname(url)` | `(url: string) => string \| null` | Extrai hostname de uma URL |
| `isSecureScheme(url)` | `(url: string) => boolean` | Verifica se é `http://` ou `https://` |
| `isSpecialScheme(url)` | `(url: string) => boolean` | Verifica esquemas como `tel:`, `mailto:`, `sms:` etc. |

O mapa de idiomas em `utils.ts`:
```ts
const LOCALE_URL_MAP = {
  'pt-BR': 'https://oliva.church/pt-br/login',
  'pt-PT': 'https://oliva.church/pt-pt/login',
  'pt':    'https://oliva.church/pt-br/login',
  'en':    'https://oliva.church/en/login',
  'es':    'https://oliva.church/es/login',
  'fr':    'https://oliva.church/fr/login',
};
```

---

### `storage.ts`

**Abstração sobre `AsyncStorage` para persistência local.**

Exporta a instância singleton `storageManager` da classe `StorageManager`.

Chaves de armazenamento:
| Chave | Valor armazenado |
|-------|-----------------|
| `@oliva_last_url` | Última URL visitada dentro do domínio Oliva |
| `@oliva_user_prefs` | Preferências do usuário (JSON serializado) |
| `@oliva_cache_ts` | Timestamp do último cache válido |

Métodos principais:
- `saveLastUrl(url)` / `getLastUrl()`
- `savePreferences(prefs)` / `getPreferences()`
- `clearAll()` → remove todas as chaves (chamado em logout)
- `isCacheValid(maxAgeMs)` / `updateCacheTimestamp()`

---

### `app.json`

**Configuração declarativa do Expo.**

Campos críticos:
- `expo.name`: `"Oliva Church"` — nome exibido na loja e na tela inicial
- `expo.slug`: `"oliva-church"` — identificador único no Expo
- `expo.version`: `"1.0.0"`
- `expo.scheme`: `"olivaapp"` — scheme de deep link (`olivaapp://`)
- `expo.ios.bundleIdentifier`: `"com.olivachurch.app"`
- `expo.android.package`: `"com.olivachurch.app"`
- `expo.newArchEnabled`: `true` — nova arquitetura React Native ativa

---

### `scripts/validate.js`

**Script de validação de setup executado em Node.js puro.**

Verifica 6 pontos críticos de configuração:
1. `package.json` — `main: "expo/AppEntry"` e dependência `react-native-webview` presentes
2. `App.native.tsx` — importa `react-native-webview` e usa `onShouldStartLoadWithRequest`
3. `App.web.tsx` — usa `window.location.replace` e não importa WebView
4. `app.json` — slug e name corretos
5. `types.ts` — exporta `WebViewNavigationEvent`
6. `utils.ts` — exporta `isOlivaDomain`
7. `storage.ts` — exporta `StorageManager`

---

### `compliance/account-deletion-urls.json`

**Mapeamento de URLs de exclusão de conta por locale.**

Obrigatório para publicação na App Store (Apple) e Google Play. Referencia as páginas dentro do `oliva-front` onde o usuário pode solicitar a exclusão da sua conta/igreja.

```json
{
  "fallbackLocale": "en",
  "accountDeletionUrls": {
    "en": "https://oliva.church/en/app/delete-church",
    "es": "https://oliva.church/es/app/eliminar-iglesia",
    "fr": "https://oliva.church/fr/app/supprimer-eglise",
    "pt-br": "https://oliva.church/pt-br/app/apagar-igreja",
    "pt-pt": "https://oliva.church/pt-pt/app/apagar-igreja"
  }
}
```

---

### Pasta `android/`

Projeto Android nativo gerado pelo Expo (`expo run:android` ou `eas build`). Não deve ser editado manualmente exceto em casos de configuração nativa específica coordenada com o time de mobile.

Contém: `build.gradle`, `settings.gradle`, `gradle.properties`, `app/` (manifests e código Java/Kotlin gerado).
