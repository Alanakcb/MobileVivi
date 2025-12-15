import React, { useState, useEffect } from "react";
import { View, TextInput, Image, Modal, TouchableOpacity, Text, ActivityIndicator, Alert, Dimensions } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Network from 'expo-network';
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from "../../context/theme";
import { colors } from "../../styles/colors";
import { styles } from "./styles";
import { listarFotosStorage } from "../../services/supabaseFotos";
import { getUser } from "../../services/supabaseAuth";
import { getCachedPhotos, hasCachedPhotos, initPhotosCache, cacheMultiplePhotos } from "../../services/photosCache";

interface FotoType {
  id: string;
  uri: string;
  legenda: string;
  data: string;
  local: string;
  latitude?: number;
  longitude?: number;
}

export function MapaScreen() {
  const { colors: themeColors } = useTheme();
  const [fotos, setFotos] = useState<FotoType[]>([]);
  const [selectedFoto, setSelectedFoto] = useState<FotoType | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [searchText, setSearchText] = useState("");
  const [searching, setSearching] = useState(false);
  const mapRef = React.useRef<MapView>(null);

  // Verificar se é noite (entre 18h e 6h)
  const isNightTime = () => {
    const hour = new Date().getHours();
    return hour >= 18 || hour < 6;
  };

  const [isDarkMode, setIsDarkMode] = useState(isNightTime());

  useFocusEffect(
    React.useCallback(() => {
      loadPhotosWithLocation();
      getCurrentLocation();
      setIsDarkMode(isNightTime());
    }, [])
  );

  // Atualizar tema a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setIsDarkMode(isNightTime());
    }, 60000); // Verifica a cada 1 minuto

    return () => clearInterval(interval);
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
      }
    } catch (error) {
      console.error('Erro ao obter localização:', error);
    }
  };

  const loadPhotosWithLocation = async () => {
    setLoading(true);
    try {
      await initPhotosCache();
      
      const { data: userData } = await getUser();
      if (!userData?.user) {
        Alert.alert('Erro', 'Usuário não autenticado');
        setLoading(false);
        return;
      }

      const userId = userData.user.id;
      
      // Verificar conectividade
      const networkState = await Network.getNetworkStateAsync();
      const isOnline = networkState.isConnected && networkState.isInternetReachable;
      
      console.log('Mapa - Status de conexão:', isOnline ? 'Online' : 'Offline');
      
      if (!isOnline) {
        // Modo offline - carregar apenas do cache
        console.log('📱 Modo Offline - Carregando pins do cache local');
        const hasCache = await hasCachedPhotos(userId);
        
        if (hasCache) {
          const cachedPhotos = await getCachedPhotos(userId);
          const fotosComLocalizacao = cachedPhotos.filter(foto => 
            foto.latitude !== null && 
            foto.latitude !== undefined && 
            foto.longitude !== null && 
            foto.longitude !== undefined
          );
          setFotos(fotosComLocalizacao);
          console.log('Pins carregados do cache:', fotosComLocalizacao.length);
        }
        setLoading(false);
        return;
      }
      
      // Modo online - carregar do cache primeiro e depois sincronizar
      console.log('🌐 Modo Online - Carregando pins do cache e sincronizando');
      const hasCache = await hasCachedPhotos(userId);
      if (hasCache) {
        const cachedPhotos = await getCachedPhotos(userId);
        const fotosComLocalizacao = cachedPhotos.filter(foto => 
          foto.latitude !== null && 
          foto.latitude !== undefined && 
          foto.longitude !== null && 
          foto.longitude !== undefined
        );
        setFotos(fotosComLocalizacao);
        console.log('Pins carregados do cache:', fotosComLocalizacao.length);
      }
      
      // Buscar do servidor e sincronizar
      try {
        const { data, error } = await listarFotosStorage(userId);
        if (!error && data) {
          const fotosComLocalizacao = data.filter(foto => 
            foto.latitude !== null && 
            foto.latitude !== undefined && 
            foto.longitude !== null && 
            foto.longitude !== undefined
          );
          setFotos(fotosComLocalizacao);
          
          // Atualizar cache em background
          cacheMultiplePhotos(data.map(foto => ({
            ...foto,
            user_id: userId
          }))).catch(err => console.log('Erro ao atualizar cache do mapa:', err));
          
          console.log('✅ Pins do mapa sincronizados com sucesso');
        } else if (error) {
          console.error('Erro ao buscar fotos:', error);
        }
      } catch (err) {
        console.log('Erro ao sincronizar, mantendo cache:', err);
      }
    } catch (err) {
      console.error('Erro ao carregar fotos:', err);
      Alert.alert('Erro', 'Não foi possível carregar as fotos');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerPress = (foto: FotoType) => {
    setSelectedFoto(foto);
    setModalVisible(true);
  };

  const searchLocation = async () => {
    if (!searchText.trim()) {
      Alert.alert('Atenção', 'Digite um endereço para pesquisar');
      return;
    }

    setSearching(true);
    try {
      const results = await Location.geocodeAsync(searchText);
      
      if (results && results.length > 0) {
        const { latitude, longitude } = results[0];
        
        // Mover o mapa para a localização encontrada
        mapRef.current?.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);

        Alert.alert(
          'Localização encontrada',
          `Coordenadas: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Aviso', 'Nenhuma localização encontrada para esta pesquisa');
      }
    } catch (error) {
      console.error('Erro ao buscar localização:', error);
      Alert.alert('Erro', 'Não foi possível buscar a localização. Tente novamente.');
    } finally {
      setSearching(false);
    }
  };

  // Região inicial do mapa (Varginha, MG ou localização do usuário)
  const initialRegion = userLocation 
    ? {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : {
        latitude: -21.5561,
        longitude: -45.4345,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
        <Text style={{ marginTop: 10, fontSize: 16, color: themeColors.text }}>Carregando mapa...</Text>
      </View>
    );
  }

  // Estilo do mapa escuro para a noite
  const darkMapStyle = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#263c3f" }],
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [{ color: "#6b9a76" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#38414e" }],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#212a37" }],
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9ca5b3" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#746855" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#1f2835" }],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [{ color: "#f3d19c" }],
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#2f3948" }],
    },
    {
      featureType: "transit.station",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#17263c" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#515c6d" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#17263c" }],
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background, padding: 0 }]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        customMapStyle={isDarkMode ? darkMapStyle : []}
      >
        {fotos.map((foto) => (
          foto.latitude && foto.longitude && (
            <Marker
              key={foto.id}
              coordinate={{
                latitude: foto.latitude,
                longitude: foto.longitude,
              }}
              pinColor="red"
              onPress={() => handleMarkerPress(foto)}
            >
              <View style={{
                backgroundColor: 'red',
                padding: 8,
                borderRadius: 20,
                borderWidth: 3,
                borderColor: 'white',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.5,
                shadowRadius: 4,
                elevation: 5,
              }}>
                <Ionicons name="location-sharp" size={20} color="white" />
              </View>
            </Marker>
          )
        ))}
      </MapView>

      {/* Barra de pesquisa no topo */}
      <View style={{ 
        position: 'absolute', 
        top: 10, 
        left: 10, 
        right: 10,
        backgroundColor: themeColors.card,
        borderRadius: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        height: 50,
      }}>
        <Ionicons name="search" size={20} color={themeColors.primary} style={{ marginRight: 10 }} />
        <TextInput
          placeholder="Ex: Varginha, MG ou Rua Principal, 123"
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={searchLocation}
          returnKeyType="search"
          style={{ flex: 1, fontSize: 16, color: themeColors.text }}
          placeholderTextColor={themeColors.textSecondary}
          editable={!searching}
        />
        {searching ? (
          <ActivityIndicator size="small" color={themeColors.primary} />
        ) : (
          <TouchableOpacity onPress={searchLocation}>
            <Ionicons name="arrow-forward-circle" size={28} color={themeColors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Modal para exibir foto */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.8)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            width: Dimensions.get('window').width * 0.9,
            backgroundColor: themeColors.card,
            borderRadius: 20,
            padding: 20,
            alignItems: 'center',
          }}>
            <TouchableOpacity
              style={{
                position: 'absolute',
                right: 10,
                top: 10,
                zIndex: 1,
                backgroundColor: 'rgba(0,0,0,0.5)',
                borderRadius: 20,
                padding: 8,
              }}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>

            {selectedFoto && (
              <>
                <Image
                  source={{ uri: selectedFoto.uri }}
                  style={{
                    width: '100%',
                    height: 300,
                    borderRadius: 10,
                    marginBottom: 15,
                  }}
                  resizeMode="cover"
                />
                <Text style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: themeColors.primary,
                  marginBottom: 8,
                }}>
                  {selectedFoto.legenda || 'Sem legenda'}
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: themeColors.textSecondary,
                  marginBottom: 4,
                }}>
                  Data: {selectedFoto.data}
                </Text>
                {selectedFoto.latitude && selectedFoto.longitude && (
                  <Text style={{
                    fontSize: 12,
                    color: themeColors.textSecondary,
                  }}>
                    📍 {selectedFoto.latitude.toFixed(6)}, {selectedFoto.longitude.toFixed(6)}
                  </Text>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}