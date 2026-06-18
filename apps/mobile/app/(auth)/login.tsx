import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Link } from "expo-router";
import { Mail, Lock, Eye, EyeOff } from "lucide-react-native";
import { supabase } from "../../lib/supabase";

const COLORS = {
  gold: "#C9A84C",
  black: "#0A0A0A",
  blackCard: "#141414",
  blackBorder: "#2A2A2A",
  white: "#FAFAFA",
  whiteAlpha50: "rgba(250,250,250,0.5)",
  whiteAlpha30: "rgba(250,250,250,0.3)",
};

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Eksik bilgi", "E-posta ve şifre gerekli.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      Alert.alert("Giriş başarısız", error.message);
    } else {
      router.replace("/(tabs)");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoBox}>
            <Text style={styles.logoEmoji}>💅</Text>
          </View>
          <Text style={styles.title}>Tekrar hoş geldin</Text>
          <Text style={styles.subtitle}>Randevularını yönetmek için giriş yap</Text>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-posta</Text>
            <View style={styles.inputWrap}>
              <Mail size={18} color={COLORS.whiteAlpha50} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="ornek@email.com"
                placeholderTextColor={COLORS.whiteAlpha30}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Şifre</Text>
            <View style={styles.inputWrap}>
              <Lock size={18} color={COLORS.whiteAlpha50} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={COLORS.whiteAlpha30}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword((s) => !s)}>
                {showPassword ? <EyeOff size={18} color={COLORS.whiteAlpha50} /> : <Eye size={18} color={COLORS.whiteAlpha50} />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.black} />
            ) : (
              <Text style={styles.buttonText}>Giriş Yap</Text>
            )}
          </TouchableOpacity>

          {/* Register link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Hesabın yok mu? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Kayıt ol</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  flex: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: "center" },

  logoBox: {
    width: 72, height: 72, borderRadius: 24, alignSelf: "center",
    backgroundColor: "rgba(201,168,76,0.15)", borderWidth: 1, borderColor: COLORS.gold,
    justifyContent: "center", alignItems: "center", marginBottom: 20,
  },
  logoEmoji: { fontSize: 32 },

  title: { fontSize: 24, fontWeight: "700", color: COLORS.white, textAlign: "center" },
  subtitle: { fontSize: 14, color: COLORS.whiteAlpha50, textAlign: "center", marginTop: 6, marginBottom: 32 },

  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.whiteAlpha50, marginBottom: 8 },
  inputWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: COLORS.blackCard, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.blackBorder, paddingHorizontal: 14, height: 52,
  },
  input: { flex: 1, color: COLORS.white, fontSize: 15 },

  button: {
    height: 52, backgroundColor: COLORS.gold, borderRadius: 14,
    justifyContent: "center", alignItems: "center", marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontSize: 16, fontWeight: "700", color: COLORS.black },

  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  footerText: { color: COLORS.whiteAlpha50, fontSize: 14 },
  footerLink: { color: COLORS.gold, fontSize: 14, fontWeight: "700" },
});
