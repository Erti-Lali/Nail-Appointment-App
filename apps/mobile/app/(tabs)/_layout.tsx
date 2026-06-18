import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { Calendar, Home, User, Bell, Scissors } from "lucide-react-native";

const TAB_ICON_SIZE = 22;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: "#0F0F0F",
          borderTopColor: "#1A1A1A",
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 64,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#C9A84C",
        tabBarInactiveTintColor: "#ffffff40",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
        },
        headerStyle: { backgroundColor: "#0A0A0A" },
        headerTintColor: "#FAFAFA",
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Ana Sayfa",
          tabBarIcon: ({ color }) => <Home size={TAB_ICON_SIZE} color={color} />,
          headerTitle: "NailStudio 101",
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: "Randevularım",
          tabBarIcon: ({ color }) => <Calendar size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="book"
        options={{
          title: "Randevu Al",
          tabBarIcon: ({ color }) => (
            <Scissors size={TAB_ICON_SIZE} color={color} />
          ),
          tabBarActiveTintColor: "#0A0A0A",
          tabBarIconStyle: {
            backgroundColor: "#C9A84C",
            borderRadius: 16,
            padding: 4,
            width: 44,
            height: 44,
            justifyContent: "center",
            alignItems: "center",
            marginTop: -16,
          },
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Bildirimler",
          tabBarIcon: ({ color }) => <Bell size={TAB_ICON_SIZE} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profilim",
          tabBarIcon: ({ color }) => <User size={TAB_ICON_SIZE} color={color} />,
        }}
      />
    </Tabs>
  );
}
