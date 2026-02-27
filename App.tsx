import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Linking from 'expo-linking';

// Production URL
const OLIVA_URL = 'https://oliva.church/';
const OLIVA_DOMAIN = 'oliva.church';

interface NavigationEvent {
  url: string;
  navigationType: string;
  mainDocumentURL?: string;
}

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    if (typeof window !== 'undefined') {
      window.location.replace(OLIVA_URL);
    }
  }, []);

  /**
   * Determine if a URL belongs to the Oliva domain
   */
  const isOlivaDomain = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return (
        urlObj.hostname === OLIVA_DOMAIN ||
        urlObj.hostname.endsWith(`.${OLIVA_DOMAIN}`)
      );
    } catch {
      return false;
    }
  };

  /**
   * Handle navigation: keep Oliva domain in app, open external links in system browser
   */
  const handleNavigationStateChange = (navState: NavigationEvent) => {
    const url = navState.url || '';

    // Allow navigation to Oliva domain
    if (isOlivaDomain(url)) {
      return;
    }

    // Reject navigation to external domains and open in system browser
    if (navState.navigationType === 'click' && !isOlivaDomain(url)) {
      // Open external link in system browser
      Linking.openURL(url).catch((err) =>
        console.warn('Failed to open URL:', err)
      );

      // Prevent navigation within WebView
      webViewRef.current?.goBack();
      return false;
    }
  };

  /**
   * Handle WebView message injection for link interception
   */
  const injectedJavaScript = `
    (function() {
      const originalOpen = window.open;
      window.open = function(url, target, features) {
        if (url) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'openLink',
            url: url
          }));
        }
        return originalOpen.call(this, url, target, features);
      };

      // Intercept anchor clicks for external domains
      document.addEventListener('click', function(e) {
        const target = e.target.closest('a');
        if (target && target.href) {
          const href = target.href;
          if (!href.includes('oliva.church')) {
            // Let the default behavior handle, which will trigger onNavigationStateChange
          }
        }
      }, true);
    })();
  `;

  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === 'openLink' && message.url) {
        Linking.openURL(message.url).catch((err) =>
          console.warn('Failed to open URL:', err)
        );
      }
    } catch (e) {
      console.warn('Error parsing message:', e);
    }
  };

  const handleLoadStart = () => {
    setIsLoading(true);
    setError(null);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    setError(nativeEvent.description || 'Failed to load page');
    setIsLoading(false);
  };

  const handleReload = () => {
    webViewRef.current?.reload();
  };

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.webFallbackContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.webFallbackText}>Redirecionando para Oliva Church...</Text>
        <TouchableOpacity style={styles.reloadButton} onPress={() => Linking.openURL(OLIVA_URL)}>
          <Text style={styles.reloadButtonText}>Abrir Oliva Church</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: OLIVA_URL }}
        style={styles.webview}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.loadingText}>Carregando...</Text>
          </View>
        )}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onNavigationStateChange={handleNavigationStateChange}
        onMessage={handleMessage}
        injectedJavaScript={injectedJavaScript}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={true}
        useWebKit={true}
        allowsBackForwardNavigationGestures={true}
        userAgent="OlivaChurchApp/1.0"
      />

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Erro ao carregar: {error}</Text>
          <TouchableOpacity style={styles.reloadButton} onPress={handleReload}>
            <Text style={styles.reloadButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webFallbackContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  webFallbackText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
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
    color: '#666',
  },
  errorContainer: {
    padding: 20,
    backgroundColor: '#ffebee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  reloadButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#1976d2',
    borderRadius: 5,
  },
  reloadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
