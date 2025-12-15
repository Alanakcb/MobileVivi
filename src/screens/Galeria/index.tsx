import React, { useState, useEffect } from "react";
import { View, Text, Image, FlatList, Dimensions, Modal, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from "@react-navigation/native";
import * as Network from 'expo-network';
import { useTheme } from "../../context/theme";
import { styles } from "./styles";
import { supabase } from "../../services/supabaseClient";
import { listarFotosStorage, deletarFotoStorage, atualizarLegendaFoto } from "../../services/supabaseFotos";
import { getUser } from "../../services/supabaseAuth";
import { 
  initPhotosCache, 
  getCachedPhotos, 
  cacheMultiplePhotos, 
  updateCachedPhotoCaption,
  deleteCachedPhoto,
  hasCachedPhotos 
} from "../../services/photosCache";

export function GaleriaScreen({ route, navigation }: any) {
  const { colors: themeColors } = useTheme();
  const [fotos, setFotos] = useState<FotoType[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  type FotoType = { id: string; uri: string; legenda: string; data: string; local: string };
  const [selectedFoto, setSelectedFoto] = useState<null | FotoType>(null);
  const [legendaInput, setLegendaInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Carregar fotos do Supabase Storage quando a tela for focada (incluindo após login)
  useFocusEffect(
    React.useCallback(() => {
      carregarFotos();
    }, [])
  );

  const carregarFotos = async () => {
    setLoading(true);
    try {
      // Inicializar cache
      await initPhotosCache();
      
      const { data: userData, error: userError } = await getUser();
      if (userError || !userData?.user) {
        Alert.alert('Erro', 'Usuário não autenticado');
        setLoading(false);
        return;
      }

      const userId = userData.user.id;
      
      // Verificar conectividade
      const networkState = await Network.getNetworkStateAsync();
      const isOnline = networkState.isConnected && networkState.isInternetReachable;
      
      console.log('Status de conexão:', isOnline ? 'Online' : 'Offline');
      
      if (!isOnline) {
        // Modo offline - carregar apenas do cache
        console.log('📱 Modo Offline - Carregando fotos do cache local');
        const hasCache = await hasCachedPhotos(userId);
        
        if (hasCache) {
          const cachedPhotos = await getCachedPhotos(userId);
          console.log('Fotos carregadas do cache:', cachedPhotos.length);
          setFotos(cachedPhotos);
        } else {
          Alert.alert(
            '📱 Sem Conexão',
            'Você está offline e não há fotos armazenadas localmente. Conecte-se à internet para carregar suas fotos.',
            [{ text: 'OK' }]
          );
        }
        setLoading(false);
        return;
      }
      
      // Modo online - sincronizar fotos pendentes primeiro
      console.log('🌐 Modo Online - Sincronizando fotos pendentes...');
      if (!isSyncing) {
        setIsSyncing(true);
        await syncOfflinePhotos(userId);
        setIsSyncing(false);
      }
      
      // Buscar do servidor
      try {
        const { data, error } = await listarFotosStorage(userId);
        if (!error && data) {
          console.log('Fotos carregadas do servidor:', data.length);
          setFotos(data);
          
          // Atualizar cache em background (limpa e reinsere para evitar duplicatas)
          console.log('Atualizando cache...');
          cacheMultiplePhotos(data.map(foto => ({
            ...foto,
            user_id: userId
          }))).catch(err => console.log('Erro ao atualizar cache:', err));
          
          console.log('✅ Fotos sincronizadas com sucesso');
        } else if (error) {
          console.error('Erro ao buscar fotos:', error);
          // Se falhar, carregar do cache
          const cachedPhotos = await getCachedPhotos(userId);
          setFotos(cachedPhotos);
        }
      } catch (err) {
        console.log('Erro ao buscar servidor, usando cache:', err);
        const cachedPhotos = await getCachedPhotos(userId);
        setFotos(cachedPhotos);
      }
    } catch (err) {
      console.error('Erro ao carregar fotos:', err);
      Alert.alert('Erro', 'Não foi possível carregar as fotos');
    } finally {
      setLoading(false);
    }
  };

  const syncOfflinePhotos = async (userId: string) => {
    try {
      const cachedPhotos = await getCachedPhotos(userId);
      const offlinePhotos = cachedPhotos.filter(foto => 
        foto.id.startsWith('offline_') || foto.id.startsWith('temp_')
      );
      
      if (offlinePhotos.length === 0) {
        console.log('Nenhuma foto offline para sincronizar');
        return;
      }
      
      console.log(`Sincronizando ${offlinePhotos.length} fotos offline...`);
      
      for (const foto of offlinePhotos) {
        try {
          // Upload da foto para o Storage
          const fileName = `${userId}_${Date.now()}.jpg`;
          const formData = new FormData();
          formData.append('file', {
            uri: foto.uri,
            name: fileName,
            type: 'image/jpeg',
          } as any);

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('fotos')
            .upload(fileName, formData, {
              contentType: 'image/jpeg',
              upsert: true,
            });

          if (uploadError) {
            console.log('Erro ao fazer upload da foto offline:', uploadError);
            continue;
          }

          // Obter URL pública
          const { data: publicUrlData } = supabase.storage
            .from('fotos')
            .getPublicUrl(fileName);

          // Salvar no banco de dados
          const { error: dbError } = await supabase.from('fotos').insert([
            {
              image_url: publicUrlData.publicUrl,
              legenda: foto.legenda,
              user_id: userId,
              data: new Date().toISOString(),
              latitude: foto.latitude || null,
              longitude: foto.longitude || null
            }
          ]);

          if (!dbError) {
            // Remover foto offline do cache
            await deleteCachedPhoto(foto.id);
            console.log(`Foto ${foto.id} sincronizada e removida do cache`);
          }
        } catch (err) {
          console.log('Erro ao sincronizar foto:', err);
        }
      }
      
      console.log('✅ Sincronização de fotos offline concluída');
    } catch (err) {
      console.log('Erro ao sincronizar fotos offline:', err);
    }
  };

  const numColumns = 2;
  const imageSize = Dimensions.get('window').width / numColumns - 16;

  const handleImagePress = (foto: FotoType) => {
    setSelectedFoto(foto);
    setLegendaInput(foto.legenda || "");
    setModalVisible(true);
  };

  const handleSaveLegenda = async () => {
    if (!selectedFoto) return;
    
    // Verificar se a foto é offline
    if (selectedFoto.id.startsWith('offline_') || selectedFoto.id.startsWith('temp_')) {
      Alert.alert(
        '📱 Modo Offline',
        'Não é possível editar fotos que ainda não foram sincronizadas. Aguarde conexão com a internet.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    try {
      // Tentar salvar no Supabase
      const { error } = await atualizarLegendaFoto(selectedFoto.id, legendaInput);
      if (error) {
        Alert.alert(
          '⚠️ Sem Conexão',
          'Não é possível editar a legenda sem conexão com a internet. Tente novamente quando estiver online.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Atualizar localmente
      setFotos(fotos.map(f => f.id === selectedFoto.id ? { ...f, legenda: legendaInput } : f));
      
      // Atualizar no cache
      await updateCachedPhotoCaption(selectedFoto.id, legendaInput);

      Alert.alert('✅ Sucesso', 'Legenda atualizada!');
      setModalVisible(false);
    } catch (err) {
      console.error('Erro ao salvar legenda:', err);
      Alert.alert(
        '⚠️ Sem Conexão',
        'Não é possível editar a legenda sem conexão com a internet. Tente novamente quando estiver online.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleDeleteLegenda = async () => {
    if (!selectedFoto) return;
    
    try {
      // Remover legenda no Supabase
      const { error } = await atualizarLegendaFoto(selectedFoto.id, '');
      if (error) {
        Alert.alert('Erro', 'Não foi possível remover a legenda');
        return;
      }

      // Atualizar localmente
      setFotos(fotos.map(f => f.id === selectedFoto.id ? { ...f, legenda: "" } : f));
      setLegendaInput("");
      Alert.alert('Sucesso', 'Legenda removida!');
    } catch (err) {
      console.error('Erro ao remover legenda:', err);
      Alert.alert('Erro', 'Não foi possível remover a legenda');
    }
  };

  const handleDeleteFoto = async () => {
    if (!selectedFoto) return;
    
    // Verificar se a foto é offline
    if (selectedFoto.id.startsWith('offline_') || selectedFoto.id.startsWith('temp_')) {
      Alert.alert(
        '📱 Modo Offline',
        'Não é possível excluir fotos que ainda não foram sincronizadas. Aguarde conexão com a internet.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir esta foto? Esta ação não pode ser desfeita.',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data: userData } = await getUser();
              const userId = userData?.user?.id;
              if (!userId) {
                Alert.alert('Erro', 'Usuário não autenticado');
                return;
              }

              // Tentar deletar do servidor
              const { error } = await deletarFotoStorage(selectedFoto.id, userId);
              if (error) {
                Alert.alert(
                  '⚠️ Sem Conexão',
                  'Não é possível excluir a foto sem conexão com a internet. Tente novamente quando estiver online.',
                  [{ text: 'OK' }]
                );
                return;
              }

              // Remover da lista local e do cache
              setFotos(fotos.filter(f => f.id !== selectedFoto.id));
              await deleteCachedPhoto(selectedFoto.id);
              setModalVisible(false);
              
              Alert.alert('✅ Sucesso', 'Foto excluída!');
            } catch (err) {
              console.error('Erro ao excluir foto:', err);
              Alert.alert(
                '⚠️ Sem Conexão',
                'Não é possível excluir a foto sem conexão com a internet. Tente novamente quando estiver online.',
                [{ text: 'OK' }]
              );
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
        <Text style={{ marginTop: 10, fontSize: 16, color: themeColors.text }}>Carregando fotos...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <FlatList
        data={fotos}
        keyExtractor={item => item.id}
        numColumns={numColumns}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleImagePress(item)}>
            <Image
              source={{ uri: item.uri }}
              style={{ width: imageSize, height: imageSize, borderRadius: 12, margin: 8 }}
              onLoad={() => console.log('Imagem carregada:', item.id)}
              onError={(error) => console.log('Erro ao carregar imagem:', item.id, error.nativeEvent.error)}
            />
          </TouchableOpacity>
        )}
        contentContainerStyle={{ alignItems: 'center' }}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <View style={{ backgroundColor: themeColors.card, borderRadius: 20, width: '90%', maxWidth: 400, overflow: 'hidden', position: 'relative' }}>
            {/* Botão X para fechar */}
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{ 
                position: 'absolute', 
                top: 12, 
                right: 12, 
                zIndex: 10,
                backgroundColor: 'rgba(0,0,0,0.5)',
                borderRadius: 20,
                width: 32,
                height: 32,
                justifyContent: 'center',
                alignItems: 'center'
              }}
              accessibilityLabel="Fechar"
            >
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>

            {/* Imagem */}
            {selectedFoto && (
              <Image
                source={{ uri: selectedFoto.uri }}
                style={{ width: '100%', height: 300, backgroundColor: '#f0f0f0' }}
                resizeMode="cover"
              />
            )}

            {/* Conteúdo do modal */}
            <View style={{ padding: 20 }}>
              {/* Data */}
              {selectedFoto && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 6 }}>
                  <Ionicons name="calendar-outline" size={18} color={themeColors.textSecondary} />
                  <Text style={{ color: themeColors.textSecondary, fontSize: 14 }}>{selectedFoto.data}</Text>
                </View>
              )}
            <TextInput
              placeholder="Digite a legenda..."
              placeholderTextColor={themeColors.textSecondary}
              value={legendaInput}
              onChangeText={setLegendaInput}
              multiline
              numberOfLines={3}
              style={{ 
                borderWidth: 1, 
                borderColor: themeColors.border, 
                borderRadius: 8, 
                padding: 10, 
                marginBottom: 12, 
                width: '100%', 
                backgroundColor: themeColors.surface,
                color: themeColors.text,
                textAlignVertical: 'top',
                minHeight: 80
              }}
            />
            
              {/* Botões de ação */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 10 }}>
                {/* Botão Salvar Legenda */}
                <TouchableOpacity
                  onPress={handleSaveLegenda}
                  style={{
                    flex: 1,
                    backgroundColor: '#8ED36D',
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    elevation: 2,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4
                  }}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Salvar</Text>
                </TouchableOpacity>

                {/* Botão Limpar Legenda */}
                <TouchableOpacity
                  onPress={handleDeleteLegenda}
                  style={{
                    flex: 1,
                    backgroundColor: themeColors.surface,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    borderWidth: 1,
                    borderColor: themeColors.border
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color={themeColors.textSecondary} />
                  <Text style={{ color: themeColors.textSecondary, fontWeight: 'bold' }}>Limpar</Text>
                </TouchableOpacity>
              </View>

              {/* Botão Excluir Foto */}
              <TouchableOpacity
                onPress={handleDeleteFoto}
                style={{
                  marginTop: 12,
                  backgroundColor: '#FF6B6B',
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  borderRadius: 10,
                  width: '100%',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4
                }}
              >
                <Ionicons name="trash" size={20} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Excluir Foto</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}