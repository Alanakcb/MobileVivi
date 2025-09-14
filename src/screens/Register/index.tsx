import React from "react";
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
} from "react-native";
import { styles } from "./styles";
import { ComponentButtonInterface } from "../../components";
import { LoginTypes } from "../../navigations/LoginStackNavigation";

export function RegisterScreen({ navigation }: LoginTypes) {
  return (
    <View style={styles.container}>
      {/* Header Verde */}
      <View style={styles.header}>
          <Image
            source={require("../../../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        <Text style={styles.logoText}>
          <Text style={styles.logoBold}>VIVI</Text>MAP{"\n"}
          <Text style={styles.subTitle}>DIÁRIO DIGITAL</Text>
        </Text>
      </View>

      {/* Área Branca com Formulário */}
      <View style={styles.formContainer}>
        <KeyboardAvoidingView
          behavior="padding"
          keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        >
          <TextInput placeholder="Nome completo" style={styles.input} />
          <TextInput placeholder="Email" style={styles.input} />
          <TextInput placeholder="Nome de usuário" style={styles.input} />
          <TextInput
            placeholder="Criar senha"
            style={styles.input}
            secureTextEntry
          />
          <TextInput
            placeholder="Confirmar senha"
            style={styles.input}
            secureTextEntry
          />

          {/* Botão Cadastrar */}
          <ComponentButtonInterface
            title="Cadastrar"
            type="primary"
            onPress={() => navigation.navigate("Login")}
          />

          {/* Link Voltar */}
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.link}>Possuo cadastro &gt;</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}
