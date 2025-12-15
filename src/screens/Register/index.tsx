import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  TouchableOpacity,
  Image,
  Platform
} from "react-native";
import { signUp } from '../../services/supabaseAuth';
import { inserirUsuario } from '../../services/supabaseUsuarios';
import { useTheme } from "../../context/theme";
import { styles } from "./styles";
import { ComponentButtonInterface } from "../../components";
import { LoginTypes } from "../../navigations/LoginStackNavigation";

export function RegisterScreen({ navigation }: LoginTypes) {
  const { colors: themeColors } = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError("");
    if (!name || !email || !username || !password || !confirmPassword) {
      setError("Preencha todos os campos.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await signUp(email, password);
      if (error) {
        setError(error.message || "Erro ao cadastrar usuário.");
        setLoading(false);
        return;
      }
      // Se cadastro no Auth foi bem-sucedido, salva na tabela usuarios
      const userId = data?.user?.id;
      if (userId) {
        const { error: dbError } = await inserirUsuario({
          id: userId,
          name,
          email,
          username
        });
        if (dbError) {
          setError(dbError.message || "Erro ao salvar usuário no banco.");
          setLoading(false);
          return;
        }
      }
      setLoading(false);
      navigation.navigate("Login");
    } catch (e: any) {
      setError(e.message || "Erro ao cadastrar usuário.");
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
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
        <View style={[styles.formContainer, { backgroundColor: themeColors.background }]}>
          <TextInput
            placeholder="Nome completo"
            placeholderTextColor={themeColors.textSecondary}
            style={[styles.input, { color: themeColors.text, borderBottomColor: themeColors.primary }]}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            placeholder="Email"
            placeholderTextColor={themeColors.textSecondary}
            style={[styles.input, { color: themeColors.text, borderBottomColor: themeColors.primary }]}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            placeholder="Nome de usuário"
            placeholderTextColor={themeColors.textSecondary}
            style={[styles.input, { color: themeColors.text, borderBottomColor: themeColors.primary }]}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <TextInput
            placeholder="Criar senha"
            placeholderTextColor={themeColors.textSecondary}
            style={[styles.input, { color: themeColors.text, borderBottomColor: themeColors.primary }]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TextInput
            placeholder="Confirmar senha"
            placeholderTextColor={themeColors.textSecondary}
            style={[styles.input, { color: themeColors.text, borderBottomColor: themeColors.primary }]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          {error ? (
            <Text style={{ color: 'red', marginBottom: 8 }}>{error}</Text>
          ) : null}

          {/* Botão Cadastrar */}
          <ComponentButtonInterface
            title={loading ? "Cadastrando..." : "Cadastrar"}
            type="primary"
            onPress={handleRegister}
            disabled={loading}
          />

          {/* Link Voltar */}
          <TouchableOpacity onPress={() => navigation.navigate("Login")}
            disabled={loading}
          >
            <Text style={[styles.link, { color: themeColors.primary }]}>Possuo cadastro &gt;</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
