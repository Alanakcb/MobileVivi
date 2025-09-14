import React from "react";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/auth";
import { colors } from "../../styles/colors";

export function CustomDrawerContent(props: any) {
  const { setLogin } = useAuth();

  // 'Menu' é o nome da Drawer.Screen que contém o BottomTabNavigation
  const parentTabRouteName = "Menu";

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <View style={styles.topArea}>
        {/* se quiser logo/título no topo, coloca aqui */}
      </View>

      {/* Itens do menu - navegam para a tab específica dentro da screen "Menu" */}
      <TouchableOpacity
        style={styles.item}
        onPress={() => props.navigation.navigate(parentTabRouteName, { screen: "Mapa" })}
      >
        <Ionicons name="map" size={20} color={colors.white} />
        <Text style={styles.itemText}>Mapa</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.item}
        onPress={() => props.navigation.navigate(parentTabRouteName, { screen: "Camera" })}
      >
        <Ionicons name="add-circle" size={20} color={colors.white} />
        <Text style={styles.itemText}>Câmera</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.item}
        onPress={() => props.navigation.navigate(parentTabRouteName, { screen: "Galeria" })}
      >
        <Ionicons name="images" size={20} color={colors.white} />
        <Text style={styles.itemText}>Galeria</Text>
      </TouchableOpacity>

      {/* Espaço flexível para empurrar o logout para baixo */}
      <View style={{ flex: 1 }} />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logout} onPress={() => setLogin(false)}>
          <Ionicons name="log-out-outline" size={20} color={colors.white} />
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  topArea: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    // aqui você pode colocar logo se quiser
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  itemText: {
    color: colors.white,
    fontSize: 18,
    marginLeft: 14,
  },
  footer: {
    paddingHorizontal: 10,
    paddingBottom: 16,
  },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  logoutText: {
    color: colors.white,
    fontSize: 16,
    marginLeft: 10,
    fontWeight: "600",
  },
});
