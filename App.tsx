import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { AuthProvider } from './src/context/auth';
import { ThemeProvider } from './src/context/theme';
import { OfflineModeProvider } from './src/context/offlineMode';
import { Navigation } from './src/navigations';
import * as Updates from 'expo-updates';

export default function App() {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    checkForUpdates()
  }, [])

  async function checkForUpdates() {
    try {
      setIsChecking(true)
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        setIsUpdateAvailable(true)
        console.log('Update disponíivel')
      }
    } catch (error) {
      console.log("erro ao verificar update")
    } finally {
      setIsChecking(false)
    }
  }

  async function downloadAndReload() {
    try {
      await Updates.fetchUpdateAsync()
      await Updates.reloadAsync()
    } catch (error) {
      console.error("Erro ao baixar update", error)
    }
  }
  
  return isUpdateAvailable ? (
    <View style={styles.updateContainer}>
      <View style={styles.updateCard}>
        <Text style={styles.updateTitle}>🎉 Nova Atualização Disponível!</Text>
        <Text style={styles.updateDescription}>
          Uma nova versão do VIVIMAP está disponível com melhorias e correções.
        </Text>
        <TouchableOpacity 
          style={styles.updateButton}
          onPress={downloadAndReload}
        >
          <Text style={styles.updateButtonText}>Atualizar Agora</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.laterButton}
          onPress={() => setIsUpdateAvailable(false)}
        >
          <Text style={styles.laterButtonText}>Depois</Text>
        </TouchableOpacity>
      </View>
    </View>
  ) : (
    <ThemeProvider>
      <OfflineModeProvider>
        <AuthProvider>
          <Navigation />
        </AuthProvider>
      </OfflineModeProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  updateContainer: {
    flex: 1,
    backgroundColor: '#202026',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  updateCard: {
    backgroundColor: '#2a2a30',
    borderRadius: 20,
    padding: 30,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  updateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
    textAlign: 'center',
  },
  updateDescription: {
    fontSize: 16,
    color: '#b0b0b0',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  updateButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    width: '100%',
    marginBottom: 10,
  },
  updateButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  laterButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  laterButtonText: {
    color: '#b0b0b0',
    fontSize: 16,
    textAlign: 'center',
  },
});