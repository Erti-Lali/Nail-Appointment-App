import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { User, Bell, Shield, HelpCircle, LogOut, ChevronRight, Star, Calendar } from "lucide-react-native";
import { useAuth } from "../../lib/auth";

const COLORS = {
  gold: "#C9A84C",
  black: "#0A0A0A",
  blackSoft: "#1A1A1A",
  blackCard: "#141414",
  blackBorder: "#2A2A2A",
  white: "#FAFAFA",
  whiteAlpha50: "rgba(250,250,250,0.5)",
  whiteAlpha10: "rgba(250,250,250,0.1)",
};

const MENU_SECTIONS = [
  {
    title: "Hesap",
    items: [
      { icon: User, label: "Profil Bilgileri", href: "/profile/edit" },
      { icon: Bell, label: "Bildirim Ayarları", href: "/profile/notifications" },
      { icon: Shield, label: "Gizlilik ve Güvenlik", href: "/profile/privacy" },
    ],
  },
  {
    title: "Destek",
    items: [
      { icon: HelpCircle, label: "Yardım Merkezi", href: "/help" },
      { icon: Star, label: "Uygulamayı Değerlendir", href: null },
    ],
  },
];

export default function ProfileScreen() {
  const { session, profile, signOut } = useAuth();

  const firstName = profile?.first_name ?? "Misafir";
  const lastName = profile?.last_name ?? "";
  const email = session?.user?.email ?? "—";

  const handleLogout = () => {
    Alert.alert("Çıkış Yap", "Hesabından çıkmak istediğine emin misin?", [
      { text: "İptal", style: "cancel" },
      { text: "Çıkış Yap", style: "destructive", onPress: () => signOut() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {firstName.charAt(0)}{lastName.charAt(0)}
            </Text>
          </View>
          <Text style={styles.name}>{firstName} {lastName}</Text>
          <Text style={styles.email}>{email}</Text>

          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Calendar size={16} color={COLORS.gold} />
              <Text style={styles.statValue}>{user.totalVisits}</Text>
              <Text style={styles.statLabel}>Ziyaret</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Star size={16} color={COLORS.gold} />
              <Text style={styles.statValue}>4.8</Text>
              <Text style={styles.statLabel}>Puan</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>1.240</Text>
              <Text style={styles.statLabel}>Puan</Text>
            </View>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuContainer}>
          {MENU_SECTIONS.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionCard}>
                {section.items.map((item, index) => (
                  <TouchableOpacity
                    key={item.label}
                    style={[
                      styles.menuItem,
                      index < section.items.length - 1 && styles.menuItemBorder,
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.menuIconBox}>
                      <item.icon size={16} color={COLORS.gold} />
                    </View>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <ChevronRight size={14} color={COLORS.whiteAlpha50} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* Logout */}
          <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.8} onPress={handleLogout}>
            <LogOut size={16} color="#EF4444" />
            <Text style={styles.logoutText}>Çıkış Yap</Text>
          </TouchableOpacity>

          <Text style={styles.version}>NailStudio 101 v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },

  profileHeader: { alignItems: "center", padding: 24, paddingBottom: 28 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(201,168,76,0.2)",
    borderWidth: 2,
    borderColor: COLORS.gold,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: { fontSize: 24, fontWeight: "700", color: COLORS.gold },
  name: { fontSize: 20, fontWeight: "700", color: COLORS.white },
  email: { fontSize: 13, color: COLORS.whiteAlpha50, marginTop: 2 },

  stats: {
    flexDirection: "row",
    marginTop: 20,
    backgroundColor: COLORS.blackCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.blackBorder,
    padding: 16,
    gap: 0,
    alignSelf: "stretch",
  },
  stat: { flex: 1, alignItems: "center", gap: 4 },
  statValue: { fontSize: 18, fontWeight: "700", color: COLORS.white },
  statLabel: { fontSize: 10, color: COLORS.whiteAlpha50 },
  statDivider: { width: 1, backgroundColor: COLORS.blackBorder, marginHorizontal: 4 },

  menuContainer: { padding: 20, gap: 20, paddingBottom: 40 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 11, fontWeight: "600", color: COLORS.whiteAlpha50, textTransform: "uppercase", letterSpacing: 1, paddingHorizontal: 4 },
  sectionCard: { backgroundColor: COLORS.blackCard, borderRadius: 16, borderWidth: 1, borderColor: COLORS.blackBorder, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.blackBorder },
  menuIconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(201,168,76,0.1)", justifyContent: "center", alignItems: "center" },
  menuLabel: { flex: 1, fontSize: 14, color: COLORS.white },

  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, backgroundColor: "rgba(239,68,68,0.1)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(239,68,68,0.2)" },
  logoutText: { fontSize: 14, fontWeight: "600", color: "#EF4444" },
  version: { textAlign: "center", fontSize: 11, color: "rgba(250,250,250,0.2)" },
});
