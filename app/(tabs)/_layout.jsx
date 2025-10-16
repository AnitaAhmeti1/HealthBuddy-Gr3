import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";

function NavIcon({ name, color }) {
  return <Feather name={name} size={20} color={color} />;
}

export default function NavLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#888",
        tabBarStyle: { backgroundColor: "white", borderTopWidth: 0, height: 70 },
        tabBarLabelStyle: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
        headerShown: false

        // headerStyle: { backgroundColor: "#007bff7f"},
        // headerTintColor: "white",
        // headerTitleAlign: "center",
        // headerTitleStyle: { fontWeight: "bold", fontSize: 16 },
        // headerTitleContainerStyle: { left: 0, right: 0, justifyContent: "center" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <NavIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <NavIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
