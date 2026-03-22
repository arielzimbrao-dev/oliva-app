# Persistência Local — oliva-app

## Visão geral

O `oliva-app` usa `AsyncStorage` para persistência local no dispositivo. O uso é **intencional e mínimo** — apenas dados de contexto mobile (última URL, preferências de UX) são armazenados. Nenhum dado sensível de negócio ou credencial é guardado nativamente.

A autenticação e dados do usuário vivem no storage da WebView (`localStorage`, cookies) e são de responsabilidade do `oliva-front`.

---

## `StorageManager` — Classe de abstração

O arquivo `storage.ts` exporta uma instância singleton chamada `storageManager`. Toda interação com o `AsyncStorage` deve passar por ela, evitando chamadas espalhadas pelo código.

```ts
import { storageManager } from './storage';

// Uso
await storageManager.saveLastUrl(url);
const lastUrl = await storageManager.getLastUrl();
await storageManager.clearAll();
```

---

## Chaves de armazenamento

```ts
const STORAGE_KEYS = {
  LAST_URL:          '@oliva_last_url',
  USER_PREFERENCES:  '@oliva_user_prefs',
  CACHE_TIMESTAMP:   '@oliva_cache_ts',
};
```

O prefixo `@oliva_` isola as chaves do `oliva-app` de outros apps ou libs que possam usar `AsyncStorage` com chaves similares.

---

## Métodos disponíveis

### `saveLastUrl(url: string): Promise<void>`

Salva a última URL visitada dentro do domínio Oliva. Chamado em `onNavigationStateChange` apenas para URLs validadas por `isOlivaDomain()`.

```ts
if (currentUrl && isOlivaDomain(currentUrl)) {
  void storageManager.saveLastUrl(currentUrl);
}
```

**Uso planejado**: restaurar o usuário na última página visitada após reabrir o app (feature não implementada ainda).

---

### `getLastUrl(): Promise<string | null>`

Recupera a última URL salva. Retorna `null` se não houver URL armazenada.

---

### `savePreferences(prefs: Record<string, any>): Promise<void>`

Salva preferências do usuário como JSON serializado. Pode ser usado para guardar preferências de UX mobile (tema, zoom, etc.) que não existem no `oliva-front`.

```ts
await storageManager.savePreferences({ darkMode: true, fontSize: 'large' });
```

---

### `getPreferences(): Promise<Record<string, any>>`

Recupera preferências salvas. Retorna objeto vazio `{}` se não houver dados ou em caso de erro.

---

### `clearAll(): Promise<void>`

Remove **todas** as chaves do `@oliva_*` do `AsyncStorage`. Deve ser chamado em fluxos de logout para garantir que dados do usuário anterior não persistam.

```ts
await AsyncStorage.multiRemove([
  STORAGE_KEYS.LAST_URL,
  STORAGE_KEYS.USER_PREFERENCES,
  STORAGE_KEYS.CACHE_TIMESTAMP,
]);
```

**Nota**: `clearAll()` não afeta o `localStorage` da WebView (sessão web). Para limpar a sessão completamente, o logout deve ser executado pela lógica do `oliva-front`.

---

### `isCacheValid(maxAgeMs?: number): Promise<boolean>`

Verifica se o cache local ainda é válido com base no timestamp armazenado.

- Parâmetro `maxAgeMs`: idade máxima em milissegundos (padrão: 1 hora = `3600000ms`)
- Retorna `false` se não houver timestamp ou se o cache estiver expirado

```ts
const valid = await storageManager.isCacheValid(7200000); // 2 horas
```

---

### `updateCacheTimestamp(): Promise<void>`

Registra o timestamp atual como marca de quando o cache foi atualizado. Chamado após operações que atualizam dados em cache.

---

## Tratamento de erros

Todos os métodos são encapsulados em `try/catch`. Erros de `AsyncStorage` são tratados silenciosamente com `console.warn` — eles **nunca propagam exceções** para os componentes. O app funciona mesmo que o `AsyncStorage` falhe.

```ts
async saveLastUrl(url: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_URL, url);
  } catch (error) {
    console.warn('Failed to save last URL:', error);
    // Falha silenciosa — não impacta UX
  }
}
```

---

## Diferença entre AsyncStorage e WebView Storage

| Armazenamento | Gerenciado por | Conteúdo | Persiste após desinstalar? |
|---------------|---------------|----------|--------------------------|
| `AsyncStorage` (nativo) | `storage.ts` | Preferências de UX mobile, última URL | Não |
| `localStorage` da WebView | `oliva-front` | JWT, dados de sessão, preferências web | Não |
| Cookies da WebView | `oliva-front` / browser | Sessão HTTP | Depende do tipo |

O `AsyncStorage` é **separado** do storage usado pela WebView. O app não lê nem escreve no `localStorage` do `oliva-front` — isso é privado à WebView.

---

## Quando adicionar novas chaves

Antes de adicionar uma nova chave ao `STORAGE_KEYS`:

1. **Confirme** que o dado não pode ficar no `oliva-front` (localStorage web)
2. **Documente** o propósito da chave neste arquivo e no `storage.ts`
3. **Inclua** o tratamento de erro (try/catch)
4. **Adicione** a nova chave ao `clearAll()` para limpeza no logout
5. **Não armazene** dados pessoais, credenciais ou informações sensíveis
