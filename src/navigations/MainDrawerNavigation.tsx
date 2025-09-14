import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { colors } from "../styles/colors";
import { BottomTabNavigation } from "./BottomTabNavigation";
import { CustomDrawerContent } from "../components/CustomDrawerContent";

const Drawer = createDrawerNavigator();

export function MainDrawerNavigation() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        drawerStyle: { backgroundColor: colors.primary },
      }}
    >
      {/* "Menu" é o nome que o CustomDrawerContent usa para navegar dentro das tabs */}
      <Drawer.Screen name="Menu" component={BottomTabNavigation} options={{ headerShown: false }} />
    </Drawer.Navigator>
  );
}
