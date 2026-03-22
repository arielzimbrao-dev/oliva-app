# Build e Publicação — oliva-app

## Configuração em `app.json`

O `app.json` é a fonte de verdade para toda a configuração de build e metadados do Expo.

```json
{
  "expo": {
    "name": "Oliva Church",
    "slug": "oliva-church",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "olivaapp",
    "userInterfaceStyle": "light",
    "newArchEnabled": true
  }
}
```

### Campos críticos

| Campo | Valor | Importância |
|-------|-------|-------------|
| `name` | `"Oliva Church"` | Nome exibido na loja e tela inicial |
| `slug` | `"oliva-church"` | Identificador único no Expo — **não alterar após publicação** |
| `version` | `"1.0.0"` | Versão do app (incrementar a cada release) |
| `scheme` | `"olivaapp"` | URL scheme de deep link — `olivaapp://` |
| `newArchEnabled` | `true` | Nova arquitetura React Native ativa (Fabric + JSI) |
| `userInterfaceStyle` | `"light"` | Força modo claro (sem suporte a dark mode no momento) |

---

## Configuração iOS

```json
"ios": {
  "supportsTablet": true,
  "bundleIdentifier": "com.olivachurch.app",
  "infoPlist": {
    "NSAppTransportSecurity": {
      "NSAllowsArbitraryLoadsInWebContent": true
    }
  }
}
```

| Campo | Valor | Descrição |
|-------|-------|-----------|
| `bundleIdentifier` | `com.olivachurch.app` | Identificador único na App Store — **nunca alterar após publicação** |
| `supportsTablet` | `true` | App disponível para iPad |
| `NSAllowsArbitraryLoadsInWebContent` | `true` | Permite que a WebView carregue conteúdo HTTP |

---

## Configuração Android

```json
"android": {
  "adaptiveIcon": {
    "backgroundColor": "#FFFFFF",
    "foregroundImage": "./assets/images/android-icon-foreground.png",
    "backgroundImage": "./assets/images/android-icon-background.png"
  },
  "package": "com.olivachurch.app",
  "edgeToEdgeEnabled": true
}
```

| Campo | Valor | Descrição |
|-------|-------|-----------|
| `package` | `com.olivachurch.app` | Identificador único na Play Store — **nunca alterar após publicação** |
| `edgeToEdgeEnabled` | `true` | Conteúdo ocupa tela inteira (inclui área atrás das barras do sistema) |
| `adaptiveIcon` | — | Ícone adaptativo Android 8+ com camadas separadas (foreground/background) |

---

## Splash Screen

Configurada via plugin `expo-splash-screen` no `app.json`:

```json
"plugins": [
  [
    "expo-splash-screen",
    {
      "image": "./assets/images/splash-icon.png",
      "imageWidth": 200,
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    }
  ]
]
```

- Fundo: branco (`#ffffff`)
- Imagem centralizada com largura de 200px
- Modo `contain` — não recorta a imagem

---

## Assets necessários

| Arquivo | Dimensão recomendada | Uso |
|---------|---------------------|-----|
| `assets/images/icon.png` | 1024×1024 | Ícone principal (iOS e Android base) |
| `assets/images/splash-icon.png` | 200×200+ | Imagem da splash screen |
| `assets/images/favicon.png` | 32×32 ou 64×64 | Favicon da versão web |
| `assets/images/android-icon-foreground.png` | 1024×1024 | Camada frontal do ícone adaptativo Android |
| `assets/images/android-icon-background.png` | 1024×1024 | Camada de fundo do ícone adaptativo Android |

---

## Comandos de build local

```bash
# Verificar configuração antes de buildar
node scripts/validate.js
npm run lint

# Executar no emulador/dispositivo conectado
npm run android       # Build debug Android
npm run ios           # Build debug iOS (requer macOS + Xcode)

# Com tunnel para dispositivo físico sem LAN
npm run android:tunnel
npm run ios:tunnel
```

---

## Build com EAS (Expo Application Services)

O `oliva-app` está preparado para usar o **EAS Build** para geração de binários de produção. Para configurar:

### 1. Instalar e autenticar EAS CLI

```bash
npm install -g eas-cli
eas login
```

### 2. Configurar EAS no projeto

```bash
eas build:configure
```

Isso criará o arquivo `eas.json` com os profiles de build.

### 3. Profiles sugeridos

```json
// eas.json (a criar)
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

### 4. Gerar binários

```bash
# Android (.aab para Play Store, .apk para testes)
eas build --platform android --profile production

# iOS (.ipa para App Store)
eas build --platform ios --profile production

# Ambas as plataformas
eas build --platform all --profile production
```

---

## Publicação nas lojas

### Google Play Store

1. Gerar `.aab` com EAS Build (profile `production`)
2. Acessar Google Play Console → `com.olivachurch.app`
3. Criar nova release em "Produção" ou "Teste Interno"
4. Upload do `.aab`
5. Preencher metadados necessários (changelog, screenshots)
6. Informar URL de exclusão de conta: ver `compliance/account-deletion-urls.json`

### Apple App Store

1. Gerar `.ipa` com EAS Build (profile `production`)
2. Acessar App Store Connect → `com.olivachurch.app`
3. Criar nova versão
4. Upload via Transporter ou EAS Submit
5. Preencher metadados necessários
6. Informar URL de exclusão de conta: ver `compliance/account-deletion-urls.json`

---

## Compliance de lojas — Exclusão de conta

Tanto Apple quanto Google exigem que apps com sistema de conta permitam a exclusão de conta diretamente pelo app. O `oliva-app` cumpre isso carregando a página web correspondente dentro da WebView:

```json
// compliance/account-deletion-urls.json
{
  "fallbackLocale": "en",
  "accountDeletionUrls": {
    "en":    "https://oliva.church/en/app/delete-church",
    "es":    "https://oliva.church/es/app/eliminar-iglesia",
    "fr":    "https://oliva.church/fr/app/supprimer-eglise",
    "pt-br": "https://oliva.church/pt-br/app/apagar-igreja",
    "pt-pt": "https://oliva.church/pt-pt/app/apagar-igreja"
  }
}
```

Estas URLs devem ser informadas nos metadados de publicação de cada loja.

---

## Atualização OTA (Over-the-Air)

Com Expo, é possível publicar atualizações JS sem passar por revisão de loja:

```bash
eas update --branch production --message "fix: corrige fluxo de login"
```

**Limitação**: atualizações OTA só funcionam para mudanças em JavaScript (bundle). Mudanças nativas (novo plugin nativo, mudança de permissões, alteração em `app.json`) exigem novo build e nova submissão às lojas.

---

## Checklist antes de publicar

- [ ] `node scripts/validate.js` — todos os checks passando
- [ ] `npm run lint` — sem erros de lint
- [ ] Fluxo de login/navegação testado em Android físico
- [ ] Fluxo de login/navegação testado em iOS físico
- [ ] Links externos abrindo no browser do sistema
- [ ] Tela de erro e retry funcionando
- [ ] Botão de voltar (Android) funcionando corretamente
- [ ] Versão (`version`) incrementada em `app.json`
- [ ] URL de exclusão de conta verificada em `compliance/account-deletion-urls.json`
- [ ] Validação de build em ambas as plataformas antes de submeter às lojas

---

## Versão mínima de SO suportada

| Plataforma | Versão mínima | Definido por |
|-----------|--------------|-------------|
| Android | 6.0 (API 23) | Padrão Expo 54 |
| iOS | 16.0 | Padrão Expo 54 |

Para alterar, adicionar `minSdkVersion` (Android) ou `deploymentTarget` (iOS) nas configs correspondentes do `app.json`.
