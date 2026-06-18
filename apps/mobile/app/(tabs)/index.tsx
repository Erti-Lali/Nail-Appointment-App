import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Calendar, Clock, Star, ChevronRight, Sparkles } from "lucide-react-native";
import { formatDate, formatTime } from "@nailstudio/shared";

const COLORS = {
  gold: "#C9A84C",
  black: "#0A0A0A",
  blackSoft: "#1A1A1A",
  blackCard: "#141414",
  blackBorder: "#2A2A2A",
  white: "#FAFAFA",
  whiteAlpha50: "rgba(250,250,250,0.5)",
  whiteAlpha30: "rgba(250,250,250,0.3)",
};

// Mock data — replace with real Supabase queries
const UPCOMING_APPOINTMENTS = [
  {
    id: "1",
    service: "Kalıcı Oje",
    staff: "Ayşe H.",
    date: new Date(Date.now() + 86400000).toISOString(),
    duration: 60,
    status: "confirmed",
    studioName: "Glamour Nails",
    studioColor: "#C9A84C",
  },
];

const QUICK_SERVICES = [
  { id: "1", name: "Manikür", emoji: "💅", duration: 45, price: 250 },
  { id: "2", name: "Kalıcı Oje", emoji: "✨", duration: 60, price: 350 },
  { id: "3", name: "Nail Art", emoji: "🎨", duration: 90, price: 500 },
  { id: "4", name: "Pedikür", emoji: "🦶", duration: 60, price: 300 },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Merhaba! 👋</Text>
            <Text style={styles.subGreeting}>Bugün ne yapalım?</Text>
          </View>
          <View style={styles.logoBox}>
            <Sparkles size={20} color={COLORS.black} />
          </View>
        </View>

        {/* Book CTA */}
        <TouchableOpacity
          style={styles.bookCta}
          onPress={() => router.push("/book")}
          activeOpacity={0.85}
        >
          <View>
            <Text style={styles.bookCtaTitle}>Randevu Al</Text>
            <Text style={styles.bookCtaSubtitle}>En yakın stüdyoyu bul</Text>
          </View>
          <View style={styles.bookCtaIcon}>
            <Calendar size={24} color={COLORS.black} />
          </View>
        </TouchableOpacity>

        {/* Upcoming Appointments */}
        {UPCOMING_APPOINTMENTS.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Yaklaşan Randevularım</Text>
              <TouchableOpacity onPress={() => router.push("/appointments")}>
                <Text style={styles.sectionLink}>Tümü →</Text>
              </TouchableOpacity>
            </View>

            {UPCOMING_APPOINTMENTS.map((appt) => (
              <TouchableOpacity
                key={appt.id}
                style={styles.appointmentCard}
                activeOpacity={0.8}
              >
                <View
                  style={[styles.appointmentBar, { backgroundColor: appt.studioColor }]}
                />
                <View style={styles.appointmentInfo}>
                  <Text style={styles.appointmentService}>{appt.service}</Text>
                  <Text style={styles.appointmentMeta}>
                    {appt.staff} · {appt.studioName}
                  </Text>
                </View>
                <View style={styles.appointmentTime}>
                  <Text style={styles.appointmentDate}>
                    {formatDate(appt.date, "d MMM")}
                  </Text>
                  <Text style={styles.appointmentHour}>
                    {formatTime(appt.date)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popüler Hizmetler</Text>
          <View style={styles.servicesGrid}>
            {QUICK_SERVICES.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceCard}
                activeOpacity={0.8}
                onPress={() => router.push("/book")}
              >
                <Text style={styles.serviceEmoji}>{service.emoji}</Text>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceDetail}>
                  {service.duration} dk · ₺{service.price}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  greeting: { fontSize: 22, fontWeight: "700", color: COLORS.white },
  subGreeting: { fontSize: 13, color: COLORS.whiteAlpha50, marginTop: 2 },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.gold,
    justifyContent: "center",
    alignItems: "center",
  },

  bookCta: {
    backgroundColor: COLORS.gold,
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  bookCtaTitle: { fontSize: 20, fontWeight: "700", color: COLORS.black },
  bookCtaSubtitle: { fontSize: 13, color: "rgba(10,10,10,0.6)", marginTop: 2 },
  bookCtaIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(10,10,10,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },

  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: COLORS.white },
  sectionLink: { fontSize: 12, color: COLORS.gold },

  appointmentCard: {
    backgroundColor: COLORS.blackCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.blackBorder,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 8,
  },
  appointmentBar: { width: 3, height: "100%", minHeight: 64 },
  appointmentInfo: { flex: 1, padding: 14 },
  appointmentService: { fontSize: 14, fontWeight: "600", color: COLORS.white },
  appointmentMeta: { fontSize: 12, color: COLORS.whiteAlpha50, marginTop: 2 },
  appointmentTime: { alignItems: "flex-end", paddingRight: 16 },
  appointmentDate: { fontSize: 13, fontWeight: "600", color: COLORS.white },
  appointmentHour: { fontSize: 12, color: COLORS.whiteAlpha50, marginTop: 2 },

  servicesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  serviceCard: {
    width: "47%",
    backgroundColor: COLORS.blackCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.blackBorder,
    padding: 16,
  },
  serviceEmoji: { fontSize: 28, marginBottom: 8 },
  serviceName: { fontSize: 13, fontWeight: "600", color: COLORS.white },
  serviceDetail: { fontSize: 11, color: COLORS.whiteAlpha50, marginTop: 4 },
});
