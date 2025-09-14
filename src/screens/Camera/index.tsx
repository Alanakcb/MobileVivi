import React from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../styles/colors";
import { styles } from "./styles";

export function CameraScreen() {
  return (
    <View style={styles.container}>
      {/* Área da câmera */}
      <View style={styles.cameraArea}>
        <Ionicons name="camera-outline" size={80} color={colors.white} />
        <TextInput
          placeholder="Sua legenda..."
          style={styles.captionInput}
          placeholderTextColor={colors.primary}
        />
      </View>

      {/* Controles */}
      <View style={styles.controls}>
        <TouchableOpacity>
          <Ionicons name="flash" size={28} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.shutterButton} />

        <TouchableOpacity>
          <Ionicons name="refresh" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}