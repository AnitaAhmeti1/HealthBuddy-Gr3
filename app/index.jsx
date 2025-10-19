import { useEffect } from "react";
import { View, Image, StyleSheet, Animated } from "react-native";
import { useRouter } from "expo-router";

export default function IndexScreen() {
  const router = useRouter();
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    const timeout = setTimeout(() => {
      router.replace("/login");
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require("../assets/Logo.png")}
        style={[styles.logo, { opacity: fadeAnim }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#bad1f6ff",
  },
  logo: {
    width: 500,
    height: 500,
    resizeMode: "contain",
  },
});
