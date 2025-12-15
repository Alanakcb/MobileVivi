import React, { useState, useEffect, useRef } from "react";
import { View, TextInput, TouchableOpacity, Image, Text, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from 'expo-location';
import * as Network from 'expo-network';
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/theme";
import { colors } from "../../styles/colors";
import { styles } from "./styles";
import { supabase } from '../../services/supabaseClient';
import { getUser } from '../../services/supabaseAuth';
import { salvarFoto } from '../../services/supabaseFotos';
import { cachePhoto, initPhotosCache } from '../../services/photosCache';

export function CameraScreen({ navigation }: any) {
  const { colors: themeColors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [caption, setCaption] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [zoom, setZoom] = useState(0);
  const [location, setLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const cameraRef = useRef<CameraView>(null);

  // Solicitar permissão da câmera e localização automaticamente quando a tela carregar
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
    
    // Solicitar permissão de localização
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude
        });
      }
    })();
  }, [permission]);

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash(current => (current === 'off' ? 'on' : 'off'));
  };

  const handleZoomIn = () => {
    setZoom(current => Math.min(current + 0.1, 1));
  };

  const handleZoomOut = () => {
    setZoom(current => Math.max(current - 0.1, 0));
  };

  const takePicture = async () => {
    try {
      if (!cameraRef.current) {
        Alert.alert('Erro', 'Câmera não pronta. Tente novamente.');
        return;
      }
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (!photo?.uri) {
        Alert.alert('Erro', 'Não foi possível obter a foto capturada.');
        return;
      }
      setPhotoUri(photo.uri);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível tirar a foto.');
    }
  };

  const savePhoto = async () => {
    if (!photoUri) return;
    
    try {
      // 1. Obter usuário autenticado
      const { data: userData } = await getUser();
      const userId = userData?.user?.id;
      if (!userId) {
        Alert.alert('Erro', 'Usuário não autenticado.');
        return;
      }

      // 2. Obter localização atualizada
      let currentLocation = location;
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          currentLocation = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude
          };
          console.log('Localização obtida:', currentLocation);
        } else {
          console.log('Permissão de localização não concedida');
        }
      } catch (locError) {
        console.log('Erro ao obter localização:', locError);
      }

      // 3. Verificar conectividade
      const networkState = await Network.getNetworkStateAsync();
      const isOnline = networkState.isConnected && networkState.isInternetReachable;

      if (!isOnline) {
        // Modo offline - salvar apenas no cache
        await initPhotosCache();
        const tempId = `offline_${Date.now()}`;
        
        await cachePhoto({
          id: tempId,
          user_id: userId,
          uri: photoUri,
          legenda: caption || '',
          data: new Date().toLocaleDateString('pt-BR'),
          local: '',
          latitude: currentLocation?.latitude,
          longitude: currentLocation?.longitude
        });

        Alert.alert(
          '📱 Modo Offline',
          'Você está sem internet. A foto foi salva localmente e será sincronizada automaticamente quando você voltar a ter conexão.',
          [{ text: 'OK', onPress: () => {
            navigation.navigate('Galeria');
            setPhotoUri(null);
            setCaption('');
          }}]
        );
        return;
      }

      // 3. Modo online - fazer upload
      const fileExt = 'jpg';
      const fileName = `${userId}_${Date.now()}.${fileExt}`;

      const formData = new FormData();
      formData.append('file', {
        uri: photoUri,
        name: `photo_${Date.now()}.jpg`,
        type: 'image/jpeg',
      } as unknown as Blob);

      // 4. Upload para Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fotos')
        .upload(fileName, formData, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        // Se falhar o upload, salvar offline
        await initPhotosCache();
        const tempId = `offline_${Date.now()}`;
        
        await cachePhoto({
          id: tempId,
          user_id: userId,
          uri: photoUri,
          legenda: caption || '',
          data: new Date().toLocaleDateString('pt-BR'),
          local: '',
          latitude: currentLocation?.latitude,
          longitude: currentLocation?.longitude
        });

        Alert.alert(
          '⚠️ Falha no Upload',
          'Não foi possível enviar a foto para o servidor. Ela foi salva localmente e será sincronizada quando possível.',
          [{ text: 'OK', onPress: () => {
            navigation.navigate('Galeria');
            setPhotoUri(null);
            setCaption('');
          }}]
        );
        return;
      }

      // 5. Obter URL pública
      const { data: publicUrlData } = supabase.storage
        .from('fotos')
        .getPublicUrl(fileName);

      const publicUrl = publicUrlData.publicUrl;

      // 6. Salvar no banco de dados
      const { data: fotoData, error: dbError } = await salvarFoto({
        image_url: publicUrl,
        legenda: caption,
        user_id: userId,
        latitude: currentLocation?.latitude,
        longitude: currentLocation?.longitude
      });

      if (dbError) {
        console.error('Erro ao salvar no banco:', dbError);
        Alert.alert('Erro', 'Falha ao salvar foto no banco de dados.');
        return;
      }

      // 7. Navegar para Galeria (o cache será atualizado automaticamente quando a galeria carregar)
      navigation.navigate('Galeria');
      setPhotoUri(null);
      setCaption('');
      Alert.alert('✅ Sucesso', 'Foto salva e sincronizada com sucesso!');
    } catch (e: any) {
      console.error('Erro ao salvar foto:', e);
      Alert.alert('Erro', e.message || 'Falha ao salvar foto.');
    }
  };

  const retakePhoto = () => {
    setPhotoUri(null);
    setCaption('');
  };

  if (!permission) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: themeColors.background }]}>
        <Ionicons name="camera-outline" size={80} color={themeColors.primary} style={{ marginBottom: 20 }} />
        <Text style={{ fontSize: 18, textAlign: 'center', color: themeColors.text }}>Solicitando permissão da câmera...</Text>
      </View>
    );
  }
  
  if (!permission.granted) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: themeColors.background }]}>
        <Ionicons name="camera-outline" size={80} color={themeColors.primary} style={{ marginBottom: 20 }} />
        <Text style={{ fontSize: 18, marginBottom: 10, textAlign: 'center', fontWeight: 'bold', color: themeColors.text }}>
          Acesso à câmera necessário
        </Text>
        <Text style={{ fontSize: 14, marginBottom: 30, textAlign: 'center', color: themeColors.textSecondary }}>
          Precisamos de permissão para acessar sua câmera e tirar fotos
        </Text>
        <TouchableOpacity 
          onPress={requestPermission}
          style={{
            backgroundColor: themeColors.primary,
            paddingVertical: 12,
            paddingHorizontal: 30,
            borderRadius: 10,
            elevation: 3
          }}
        >
          <Text style={{ color: colors.white, fontWeight: 'bold', fontSize: 16 }}>Conceder Permissão</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.cameraArea}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
        ) : (
          <>
            <CameraView
              style={{ flex: 1, width: '100%', borderRadius: 12 }}
              facing={facing}
              flash={flash}
              zoom={zoom}
              ref={cameraRef}
            />
            
            {/* Controles de Zoom (lado direito) */}
            <View style={{
              position: 'absolute',
              right: 20,
              top: '40%',
              flexDirection: 'column',
              gap: 12,
            }}>
              {/* Zoom In */}
              <TouchableOpacity
                onPress={handleZoomIn}
                style={{
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  padding: 10,
                  borderRadius: 25,
                  width: 44,
                  height: 44,
                  justifyContent: 'center',
                  alignItems: 'center',
                  elevation: 5,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                }}
              >
                <Ionicons name="add" size={24} color={colors.white} />
              </TouchableOpacity>

              {/* Indicador de Zoom */}
              <View style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 15,
                elevation: 5,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                minWidth: 50,
                alignItems: 'center',
              }}>
                <Text style={{ 
                  color: colors.white, 
                  fontSize: 13, 
                  fontWeight: 'bold',
                }}>
                  {(zoom * 10).toFixed(1)}x
                </Text>
              </View>

              {/* Zoom Out */}
              <TouchableOpacity
                onPress={handleZoomOut}
                style={{
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  padding: 10,
                  borderRadius: 25,
                  width: 44,
                  height: 44,
                  justifyContent: 'center',
                  alignItems: 'center',
                  elevation: 5,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                }}
              >
                <Ionicons name="remove" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>
          </>
        )}
        {photoUri && (
          <View style={{
            position: 'absolute',
            bottom: 120,
            left: 20,
            right: 20,
          }}>
            <TextInput
              placeholder="Adicione uma legenda..."
              style={{
                backgroundColor: themeColors.card,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 15,
                color: themeColors.text,
                elevation: 5,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                borderWidth: 1,
                borderColor: themeColors.primary,
              }}
              placeholderTextColor={themeColors.textSecondary}
              value={caption}
              onChangeText={setCaption}
              multiline
              numberOfLines={2}
            />
          </View>
        )}
      </View>
      <View style={[styles.controls, photoUri ? { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 20 } : { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}>
        {photoUri ? (
          <>
            {/* Botão Tirar Outra */}
            <TouchableOpacity 
              onPress={retakePhoto} 
              style={{ 
                backgroundColor: themeColors.card,
                paddingHorizontal: 28,
                paddingVertical: 14,
                borderRadius: 25,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                elevation: 5,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                borderWidth: 2,
                borderColor: themeColors.primary,
                minWidth: 150,
              }}
            >
              <Ionicons name="camera-outline" size={22} color={themeColors.primary} style={{ marginRight: 8 }} />
              <Text style={{ color: themeColors.primary, fontWeight: 'bold', fontSize: 16 }}>Tirar Outra</Text>
            </TouchableOpacity>

            {/* Botão Salvar */}
            <TouchableOpacity
              onPress={savePhoto}
              style={{
                backgroundColor: themeColors.primary,
                paddingHorizontal: 28,
                paddingVertical: 14,
                borderRadius: 25,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                elevation: 5,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                minWidth: 150,
              }}
            >
              <Ionicons name="checkmark-circle-outline" size={22} color={colors.white} style={{ marginRight: 8 }} />
              <Text style={{ color: colors.white, fontWeight: 'bold', fontSize: 16 }}>Salvar</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Botão Flash (esquerda) */}
            <TouchableOpacity
              onPress={toggleFlash}
              style={{
                backgroundColor: flash === 'on' ? colors.primary : 'rgba(0,0,0,0.6)',
                padding: 12,
                borderRadius: 30,
                width: 50,
                height: 50,
                justifyContent: 'center',
                alignItems: 'center',
                elevation: 5,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                marginRight: 20,
              }}
            >
              <Ionicons 
                name={flash === 'on' ? 'flash' : 'flash-off'} 
                size={26} 
                color={colors.white} 
              />
            </TouchableOpacity>

            {/* Botão de Capturar (centro) */}
            <TouchableOpacity
              style={[
                styles.shutterButton,
                {
                  backgroundColor: colors.primary,
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  justifyContent: 'center',
                  alignItems: 'center',
                  elevation: 3,
                },
              ]}
              onPress={takePicture}
            />

            {/* Botão Inverter Câmera (direita) */}
            <TouchableOpacity
              onPress={toggleCameraFacing}
              style={{
                backgroundColor: 'rgba(0,0,0,0.6)',
                padding: 12,
                borderRadius: 30,
                width: 50,
                height: 50,
                justifyContent: 'center',
                alignItems: 'center',
                elevation: 5,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                marginLeft: 20,
              }}
            >
              <Ionicons name="camera-reverse" size={26} color={colors.white} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}
