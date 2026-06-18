import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Link } from "expo-router";
import { Mail, Lock, User, Eye, EyeOff, ChevronLeft } from "lucide-react-native";
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

export default function RegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

  const handleRegister = async () => {
    if (!form.firstName.trim() || !form.email.trim() || !form.password) {
      Alert.alert("Eksik bilgi", "Ad, e-posta ve şifre gerekli.");
      return;
    }
    if (form.password.length < 6) {
      Alert.alert("Şifre çok kısa", "Şifre en az 6 karakter olmalı.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: {
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          role: "customer",
        },
      },
    });
    setLoading(false);

    if (error) {
      Alert.alert("Kayıt başarısız", error.message);
      return;
    }

    // If email confirmation is required, there's no active session yet
    if (data.session) {
      router.replace("/(tabs)");
    } else {
      Alert.alert(
        "Kaydınız alındı",
        "E-postanıza gönderilen bağlantı ile hesabınızı doğrulayın, ardından giriş yapın.",
        [{ text: "Tamam", onPress: () => router.replace("/(auth)/login") }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={22} color={COLORS.white} />
          </TouchableOpacity>

          <Text style={styles.title}>Hesap oluştur</Text>
          <Text style={styles.subtitle}>NailStudio 101 ile randevularını kolayca yönet</Text>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex]}>
              <Text style={styles.label}>Ad</Text>
              <View style={styles.inputWrap}>
                <User size={18} color={COLORS.whiteAlpha50} />
                <TextInput style={styles.input} value={form.firstName} onChangeText={set("firstName")}
                  placeholder="Ayşe" placeholderTextColor={COLORS.whiteAlpha30} />
              </View>
            </View>
            <View style={[styles.inputGroup, styles.flex]}>
              <Text style={styles.label}>Soyad</Text>
              <View style={styles.inputWrap}>
                <TextInput style={styles.input} value={form.lastName} onChangeText={set("lastName")}
                  placeholder="Yılmaz" placeholderTextColor={COLORS.whiteAlpha30} />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-posta</Text>
            <View style={styles.inputWrap}>
              <Mail size={18} color={COLORS.whiteAlpha50} />
              <TextInput style={styles.input} value={form.email} onChangeText={set("email")}
                placeholder="ornek@email.com" placeholderTextColor={COLORS.whiteAlpha30}
                keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Şifre</Text>
            <View style={styles.inputWrap}>
              <Lock size={18} color={COLORS.whiteAlpha50} />
              <TextInput style={styles.input} value={form.password} onChangeText={set("password")}
                placeholder="En az 6 karakter" placeholderTextColor={COLORS.whiteAlpha30}
                secureTextEntry={!showPassword} autoCapitalize="none" />
              <TouchableOpacity onPress={() => setShowPassword((s) => !s)}>
                {showPassword ? <EyeOff size={18} color={COLORS.whiteAlpha50} /> : <Eye size={18} color={COLORS.whiteAlpha50} />}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color={COLORS.black} /> : <Text style={styles.buttonText}>Kayıt Ol</Text>}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Zaten hesabın var mı? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Giriş yap</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24, justifyContent: "center", paddingVertical: 32 },

  backBtn: { position: "absolute", top: 8, left: 16, width: 40, height: 40, justifyContent: "center" },

  title: { fontSize: 24, fontWeight: "700", color: COLORS.white },
  subtitle: { fontSize: 14, color: COLORS.whiteAlpha50, marginTop: 6, marginBottom: 28 },

  row: { flexDirection: "row", gap: 12 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.whiteAlpha50, marginBottom: 8 },
  inputWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: COLORS.blackCard, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.blackBorder, paddingHorizontal: 14, height: 52,
  },
  input: { flex: 1, color: COLORS.white, fontSize: 15 },

  button: { height: 52, backgroundColor: COLORS.gold, borderRadius: 14, justifyContent: "center", alignItems: "center", marginTop: 8 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontSize: 16, fontWeight: "700", color: COLORS.black },

  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  footerText: { color: COLORS.whiteAlpha50, fontSize: 14 },
  footerLink: { color: COLORS.gold, fontSize: 14, fontWeight: "700" },
});
