import * as Linking from 'expo-linking';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent, type WebViewNavigation } from 'react-native-webview';

import { storageManager } from './storage';
import { appConfig, type WebViewMessage } from './types';
import { getLocaleUrl, isOlivaDomain, isSecureScheme, isSpecialScheme } from './utils';

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  const initialUrl = useMemo(() => getLocaleUrl(), []);

  const openExternalUrl = (url: string) => {
    Linking.openURL(url).catch((err) => {
      console.warn('Failed to open URL:', err);
    });
  };

  const handleShouldStartLoadWithRequest = (request: WebViewNavigation) => {
    const url = request.url ?? '';

    if (!url || url === 'about:blank') {
      return true;
    }

    if (isOlivaDomain(url)) {
      return true;
    }

    if (isSpecialScheme(url) || isSecureScheme(url)) {
      openExternalUrl(url);
    }

    return false;
  };

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

  const handleLoadStart = () => {
    setIsLoading(true);
    setError(null);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
    const currentUrl = navState.url;
    if (currentUrl && isOlivaDomain(currentUrl)) {
      void storageManager.saveLastUrl(currentUrl);
    }
  };

  const handleError = (syntheticEvent: { nativeEvent: { description?: string } }) => {
    setError(syntheticEvent.nativeEvent.description || 'Failed to load page');
    setIsLoading(false);
  };

  useEffect(() => {
    const onBackPress = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [canGoBack]);

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: initialUrl }}
        style={styles.webview}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1976d2" />
            <Text style={styles.loadingText}>Carregando...</Text>
          </View>
        )}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onMessage={handleMessage}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        injectedJavaScript={injectedJavaScript}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsBackForwardNavigationGestures={true}
        allowsInlineMediaPlayback={true}
        allowsFullscreenVideo={true}
        setSupportMultipleWindows={false}
        mixedContentMode="compatibility"
        thirdPartyCookiesEnabled={true}
        userAgent={appConfig.USER_AGENT}
      />

      {isLoading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="small" color="#1976d2" />
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Erro ao carregar: {error}</Text>
          <TouchableOpacity style={styles.reloadButton} onPress={() => webViewRef.current?.reload()}>
            <Text style={styles.reloadButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ffffffd9',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  errorContainer: {
    padding: 20,
    backgroundColor: '#ffebee',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
  },
  reloadButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: '#1976d2',
    borderRadius: 6,
  },
  reloadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
