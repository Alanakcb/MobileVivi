// src/navigations/BottomTabNavigation.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import { MapaScreen } from "../screens/Mapa";
import { CameraScreen } from "../screens/Camera";
import { GaleriaScreen } from "../screens/Galeria";
import { colors } from "../styles/colors";

const Tab = createBottomTabNavigator();

export function BottomTabNavigation() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarShowLabel: false,
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        tabBarStyle: { backgroundColor: colors.white },
      }}
    >
      {/* Mapa */}
      <Tab.Screen
        name="Mapa"
        component={MapaScreen}
        options={({ navigation }) => ({
          headerTitle: "Mapa",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.openDrawer()}
              style={{ marginLeft: 12 }}
            >
              <Ionicons name="menu" size={28} color={colors.white} />
            </TouchableOpacity>
          ),
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="map"
              size={28}
              color={focused ? colors.primary : "gray"}
            />
          ),
        })}
      />

      {/* Câmera */}
      <Tab.Screen
        name="Camera"
        component={CameraScreen}
        options={({ navigation }) => ({
          headerTitle: "Câmera",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.openDrawer()}
              style={{ marginLeft: 12 }}
            >
              <Ionicons name="menu" size={28} color={colors.white} />
            </TouchableOpacity>
          ),
          tabBarIcon: () => (
            <Ionicons
              name="add-circle"
              size={30}
              color={colors.primary}
            />
          ),
        })}
      />

      {/* Galeria */}
      <Tab.Screen
        name="Galeria"
        component={GaleriaScreen}
        options={({ navigation }) => ({
          headerTitle: "Galeria",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.openDrawer()}
              style={{ marginLeft: 12 }}
            >
              <Ionicons name="menu" size={28} color={colors.white} />
            </TouchableOpacity>
          ),
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name="images"
              size={28}
              color={focused ? colors.primary : "gray"}
            />
          ),
        })}
      />
    </Tab.Navigator>
  );
}
