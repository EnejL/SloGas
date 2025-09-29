import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Provider as PaperProvider } from "react-native-paper";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "react-native";

import './utils/i18n'; // Import to initialize i18next
import StationsScreen from "./screens/StationsScreen";
import StationDetailsScreen from "./screens/StationDetailsScreen";
import SettingsScreen from "./screens/SettingsScreen";
import TermsOfUseScreen from "./screens/legal/TermsOfUseScreen";
import PrivacyPolicyScreen from "./screens/legal/PrivacyPolicyScreen";
import { useTranslation } from 'react-i18next';

const Stack = createNativeStackNavigator();

export default function App() {
  const { t } = useTranslation();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider>
        <StatusBar style="auto" />
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Stations" component={StationsScreen} options={{ title: 'SloGas' }}/>
            <Stack.Screen name="StationDetails" component={StationDetailsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: t('settings.title') }} />
            <Stack.Screen name="TermsOfUse" component={TermsOfUseScreen} options={{ title: t('settings.termsOfUse') }} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: t('settings.privacyPolicy') }} />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
