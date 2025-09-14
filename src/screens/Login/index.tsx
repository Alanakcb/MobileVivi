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
import { useAuth } from "../../context/auth";

export function LoginScreen({ navigation }: LoginTypes) {
  const { setLogin } = useAuth();

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
          <TextInput
            placeholder="Usuário"
            style={styles.input}
            autoCapitalize="none"
          />
          <TextInput
            placeholder="Senha"
            style={styles.input}
            secureTextEntry
          />

          {/* Botão Entrar */}
          <ComponentButtonInterface
            title="Entrar"
            type="primary"
            onPress={() => setLogin(true)}
          />

          {/* Botão Google */}
          <TouchableOpacity style={styles.googleButton}>
            <Text style={styles.googleText}>Entrar com Google</Text>
          </TouchableOpacity>

          {/* Links */}
          <TouchableOpacity>
            <Text style={styles.link}>Esqueceu a senha?</Text>
          </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>Primeiro acesso</Text>
        </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}
