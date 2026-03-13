import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { appConfig } from './types';

export default function WebApp() {
  const [redirectStarted, setRedirectStarted] = useState(false);

  const redirectUrl = useMemo(() => appConfig.OLIVA_URL, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setRedirectStarted(true);
    window.location.replace(redirectUrl);
  }, [redirectUrl]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1976d2" />
      <Text style={styles.title}>Abrindo Oliva Church...</Text>
      <Text style={styles.subtitle}>
        {redirectStarted ? 'Se o redirecionamento falhar, use o botao abaixo.' : 'Preparando redirecionamento.'}
      </Text>
      <Pressable
        onPress={() => {
          if (typeof window !== 'undefined') {
            window.location.assign(redirectUrl);
          }
        }}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Abrir agora</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#f4f6f8',
    gap: 10,
  },
  title: {
    fontSize: 18,
    color: '#1f2937',
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
    backgroundColor: '#1976d2',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
