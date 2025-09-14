import React from "react";
import { View, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../styles/colors";
import { styles } from "./styles";

export function MapaScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={colors.primary} />
        <TextInput
          placeholder="Pesquise aqui"
          style={styles.input}
          placeholderTextColor={colors.primary}
        />
      </View>
    </View>
  );
}