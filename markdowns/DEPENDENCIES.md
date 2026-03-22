# Dependências — oliva-app

**Versão do Node.js exigida:** >= 20  
**Gerenciador de pacotes:** npm  
**Versão do Expo SDK:** 54

---

## Dependências de produção

### Core — Expo e React Native

| Pacote | Versão | Motivo de uso |
|--------|--------|---------------|
| `expo` | `~54.0.33` | Runtime base do projeto. Gerencia builds, plugins e compatibilidade entre libs. |
| `react` | `19.1.0` | Engine de UI. Versão alinhada com React Native 0.81. |
| `react-dom` | `19.1.0` | Necessário para a versão web (`App.web.tsx`). |
| `react-native` | `0.81.5` | Framework nativo. Inclui primitivos de UI (View, Text, TouchableOpacity, etc.). |
| `react-native-web` | `~0.21.0` | Adapta componentes React Native para rodar no browser (versão web). |

---

### WebView

| Pacote | Versão | Motivo de uso |
|--------|--------|---------------|
| `react-native-webview` | `^13.15.0` | **Dependência central do projeto.** Renderiza o browser embutido no app que carrega o `oliva-front`. |

---

### Navegação e Gestos

| Pacote | Versão | Motivo de uso |
|--------|--------|---------------|
| `react-native-gesture-handler` | `~2.28.0` | Suporte a gestos nativos (swipe, drag). Requerido por expo-router e react-navigation. |
| `react-native-reanimated` | `~4.1.1` | Animações performáticas no thread nativo. Requerido por gesture-handler. |
| `react-native-screens` | `~4.16.0` | Otimiza rendering de telas usando primitivos nativos de navegação. |
| `react-native-safe-area-context` | `~5.6.0` | Fornece `SafeAreaView` para lidar com notch, barra de status e gestos de home. |

---

### Expo Modules

| Pacote | Versão | Motivo de uso |
|--------|--------|---------------|
| `expo-linking` | `~8.0.11` | Abre URLs externas no browser/app nativo do sistema. Usado em `openExternalUrl()`. |
| `expo-localization` | `~17.0.8` | Detecta idioma e região do dispositivo para escolher a URL de login localizada. |
| `expo-splash-screen` | `~31.0.13` | Controla a splash screen nativa. Configurado em `app.json`. |
| `expo-status-bar` | `~3.0.9` | Controla aparência da barra de status (cor, tema). |
| `expo-system-ui` | `~6.0.9` | Controla UI do sistema (cor do background durante gestos de swipe). |
| `expo-constants` | `~18.0.13` | Acesso a constantes do app (version, expoConfig). |
| `expo-haptics` | `~15.0.8` | Feedback tátil (vibração) para interações nativas. |
| `expo-image` | `~3.0.11` | Componente de imagem otimizado com cache e lazy loading. |
| `expo-web-browser` | `~15.0.10` | Abre URLs em browser in-app (alternativa ao Linking para OAuth flows). |
| `@expo/vector-icons` | `^15.0.3` | Ícones vetoriais (Ionicons, MaterialIcons, etc.) para uso em UI nativa. |

---

### Persistência

| Pacote | Versão | Motivo de uso |
|--------|--------|---------------|
| `@react-native-async-storage/async-storage` | `^2.2.0` | Armazenamento chave-valor assíncrono. Usado em `storage.ts` para persistir preferências e última URL. |

---

## Dependências de desenvolvimento

| Pacote | Versão | Motivo de uso |
|--------|--------|---------------|
| `typescript` | `~5.9.2` | Transpilação TypeScript. Strict mode ativado em `tsconfig.json`. |
| `@types/react` | `~19.1.0` | Tipos TypeScript para React 19. |
| `eslint` | `^9.25.0` | Linter. Configurado em `eslint.config.js`. |
| `eslint-config-expo` | `~10.0.0` | Preset de regras ESLint para projetos Expo. |

---

## Diagrama de dependências críticas

```
oliva-app
├── expo (SDK)
│   ├── expo-linking          → Abertura de links externos
│   ├── expo-localization     → Detecção de idioma
│   ├── expo-splash-screen    → Splash screen nativa
│   └── expo-constants        → Metadados do build
│
├── react-native-webview      → WebView (CORE)
│
├── react-native-safe-area-context → Layout seguro (notch/status bar)
│
└── @react-native-async-storage    → Persistência local
```

---

## Notas sobre versões

### Por que Expo SDK 54?

O SDK 54 traz suporte à nova arquitetura React Native (`newArchEnabled: true`), que está habilitada no `app.json`. Isso ativa o engine **Fabric** para renderização e **JSI** para comunicação nativa, resultando em melhor desempenho na WebView.

### Por que `react-native-webview ^13.x` e não versão exata?

O `^13.x` permite atualizações de patch automáticas. A versão 13+ adiciona suporte completo à nova arquitetura e tem melhorias importantes de segurança. Versões anteriores a 13 não são compatíveis com o SDK 54.

### Dependências que existem mas têm uso inativado

Algumas dependências estão instaladas mas com funcionalidade não ativada:

- `expo-haptics`: instalado para uso futuro em feedback de navegação
- `expo-image`: instalado para uso futuro em assets nativos
- `expo-web-browser`: instalado para uso futuro em OAuth flows nativos
- `@expo/vector-icons`: instalado para uso futuro em UI nativa (header, overlays)

Estas foram incluídas no MVP para evitar instalações futuras que forcem rebuilds completos nas lojas.

---

## Atualização de dependências

Usar o utilitário do Expo para manter compatibilidade entre versões:

```bash
# Verificar e corrigir versões incompatíveis
npx expo install --fix

# Atualizar para nova versão do SDK
npx expo upgrade
```

**Atenção**: não usar `npm update` diretamente em projetos Expo — pode quebrar compatibilidade entre libs. Sempre usar `npx expo install` para adicionar ou atualizar dependências.
