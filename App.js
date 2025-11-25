// App.js
import React from "react";
import { StatusBar, View, Text } from "react-native";
import {
  NavigationContainer,
  DefaultTheme,
} from "@react-navigation/native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Feather, MaterialIcons } from "@expo/vector-icons";

import HomeScreen from "./screens/HomeScreen";
import BooksScreen from "./screens/BooksScreen";
import TransactionsScreen from "./screens/TransactionsScreen";
import SettingsScreen from "./screens/SettingsScreen";

import { BooksProvider } from "./context/BooksContext";
import { TransactionsProvider } from "./context/TransactionsContext";

const Tab = createMaterialTopTabNavigator();

const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#F5F7FB",
    card: "#FFFFFF",
    text: "#111827",
    border: "rgba(15, 23, 42, 0.06)",
    primary: "#2563EB",
  },
};

function TabLabel({ routeName, focused, color }) {
  let label = routeName;
  let icon = "circle";

  if (routeName === "Home") {
    label = "Home";
    icon = "home";
  } else if (routeName === "Books") {
    label = "Books";
    icon = "book-open";
  } else if (routeName === "Transactions") {
    label = "Transactions";
    icon = "file-text";
  } else if (routeName === "Settings") {
    label = "Settings";
    icon = "settings";
  }

  const iconColor = color;
  const textColor = color;

  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Feather name={icon} size={20} color={iconColor} />
      <Text
        style={{
          fontSize: 11,
          marginTop: 2,
          fontWeight: focused ? "700" : "500",
          color: textColor,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <BooksProvider>
        <TransactionsProvider>
          <NavigationContainer theme={LightTheme}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5F7FB" />
            <Tab.Navigator
              initialRouteName="Home"
              tabBarPosition="bottom"
              screenOptions={({ route }) => ({
              swipeEnabled: true,
              animationEnabled: true,
              tabBarShowLabel: false,
              tabBarLabel: () => null,

              tabBarActiveTintColor: "#2563EB",
              tabBarInactiveTintColor: "#9CA3AF",

              tabBarIndicatorStyle: {
                backgroundColor: "#2563EB",
                height: 3,
                borderRadius: 999,
              },

              tabBarStyle: {
                backgroundColor: "#FFFFFF",
                height: 50,
                borderTopWidth: 0.5,
                borderTopColor: "rgba(148,163,184,0.4)",
                elevation: 12,
                shadowColor: "#000",
                shadowOpacity: 0.08,
                shadowOffset: { width: 0, height: -2 },
                shadowRadius: 8,
              },

              tabBarIcon: ({ focused, color }) => {
                let icon = "circle";

                if (route.name === "Home") icon = "home";
                else if (route.name === "Books") icon = "book-open";
                else if (route.name === "Transactions") icon = "file-text";
                else if (route.name === "Settings") icon = "settings";

                return <Feather name={icon} size={22} color={color} />;
              },
            })}

            >
              <Tab.Screen name="Home" component={HomeScreen} />
              <Tab.Screen name="Books" component={BooksScreen} />
              <Tab.Screen
                name="Transactions"
                component={TransactionsScreen}
              />
              <Tab.Screen name="Settings" component={SettingsScreen} />
            </Tab.Navigator>
          </NavigationContainer>
        </TransactionsProvider>
      </BooksProvider>
    </SafeAreaProvider>
  );
}
