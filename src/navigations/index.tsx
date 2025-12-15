import { NavigationContainer } from "@react-navigation/native";
import { MainDrawerNavigation } from "./MainDrawerNavigation";
import { LoginStackNavigation } from "./LoginStackNavigation";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../context/auth";
import { colors } from "../styles/colors";


export function Navigation() {
    const {login, loading} = useAuth()
    
    // Mostrar loading enquanto verifica a sessão
    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        )
    }
    
    return (
        <NavigationContainer>
            {login ? <MainDrawerNavigation /> : <LoginStackNavigation />}
        </NavigationContainer>
    )
}