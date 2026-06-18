import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, Clock, X, CheckCircle2, AlertCircle } from "lucide-react-native";
import { formatDate, formatTime } from "@nailstudio/shared";

const COLORS = {
  gold: "#C9A84C",
  black: "#0A0A0A",
  blackCard: "#141414",
  blackBorder: "#2A2A2A",
  white: "#FAFAFA",
  whiteAlpha50: "rgba(250,250,250,0.5)",
};

const STATUS_CONFIG = {
  confirmed: { label: "Onaylandı", color: "#22C55E", bg: "rgba(34,197,94,0.15)", icon: CheckCircle2 },
  pending: { label: "Bekliyor", color: "#F59E0B", bg: "rgba(245,158,11,0.15)", icon: AlertCircle },
  completed: { label: "Tamamlandı", color: "#6B7280", bg: "rgba(107,114,128,0.15)", icon: CheckCircle2 },
  canceled: { label: "İptal", color: "#EF4444", bg: "rgba(239,68,68,0.15)", icon: X },
};

const TABS = ["Yaklaşan", "Geçmiş"];

const MOCK_APPOINTMENTS = {
  upcoming: [
    {
      id: "1",
      service: "Kalıcı Oje + Nail Art",
      staff: "Ayşe Hanım",
      studio: "Glamour Nails",
      date: new Date(Date.now() + 86400000).toISOString(),
      duration: 90,
      price: 550,
      status: "confirmed",
    },
  ],
  past: [
    {
      id: "2",
      service: "Manikür",
      staff: "Fatma Hanım",
      studio: "Luxe Nails",
      date: new Date(Date.now() - 7 * 86400000).toISOString(),
      duration: 45,
      price: 250,
      status: "completed",
    },
    {
      id: "3",
      service: "Pedikür",
      staff: "Ayşe Hanım",
      studio: "Glamour Nails",
      date: new Date(Date.now() - 14 * 86400000).toISOString(),
      duration: 60,
      price: 300,
      status: "completed",
    },
  ],
};

export default function AppointmentsScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const appointments = activeTab === 0 ? MOCK_APPOINTMENTS.upcoming : MOCK_APPOINTMENTS.past;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Randevularım</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab, index) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === index && styles.tabActive]}
            onPress={() => setActiveTab(index)}
          >
            <Text style={[styles.tabText, activeTab === index && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {appointments.length === 0 ? (
          <View style={styles.empty}>
            <Calendar size={48} color="rgba(250,250,250,0.2)" />
            <Text style={styles.emptyText}>Randevu bulunamadı</Text>
          </View>
        ) : (
          appointments.map((appt) => {
            const status = STATUS_CONFIG[appt.status as keyof typeof STATUS_CONFIG];
            const StatusIcon = status.icon;

            return (
              <TouchableOpacity
                key={appt.id}
                style={styles.card}
                activeOpacity={0.8}
              >
                {/* Status header */}
                <View style={[styles.statusBar, { backgroundColor: status.bg }]}>
                  <StatusIcon size={12} color={status.color} />
                  <Text style={[styles.statusText, { color: status.color }]}>
                    {status.label}
                  </Text>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.serviceName}>{appt.service}</Text>
                  <Text style={styles.staffName}>{appt.staff} · {appt.studio}</Text>

                  <View style={styles.details}>
                    <View style={styles.detailRow}>
                      <Calendar size={13} color={COLORS.gold} />
                      <Text style={styles.detailText}>
                        {formatDate(appt.date, "d MMMM yyyy, EEEE")}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Clock size={13} color={COLORS.gold} />
                      <Text style={styles.detailText}>
                        {formatTime(appt.date)} · {appt.duration} dakika
                      </Text>
                    </View>
                  </View>

                  <View style={styles.footer}>
                    <Text style={styles.price}>₺{appt.price.toLocaleString("tr-TR")}</Text>
                    {appt.status === "confirmed" && (
                      <TouchableOpacity style={styles.cancelBtn}>
                        <Text style={styles.cancelBtnText}>İptal Et</Text>
                      </TouchableOpacity>
                    )}
                    {appt.status === "completed" && (
                      <TouchableOpacity style={styles.reviewBtn}>
                        <Text style={styles.reviewBtnText}>Değerlendir ⭐</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  title: { fontSize: 22, fontWeight: "700", color: COLORS.white },

  tabs: { flexDirection: "row", paddingHorizontal: 20, gap: 8, marginBottom: 16 },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(250,250,250,0.06)",
    borderWidth: 1,
    borderColor: "transparent",
  },
  tabActive: { backgroundColor: "rgba(201,168,76,0.15)", borderColor: "rgba(201,168,76,0.3)" },
  tabText: { fontSize: 13, fontWeight: "500", color: COLORS.whiteAlpha50 },
  tabTextActive: { color: COLORS.gold, fontWeight: "600" },

  scroll: { flex: 1 },
  content: { padding: 20, gap: 12, paddingBottom: 40 },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 14, color: "rgba(250,250,250,0.3)" },

  card: { backgroundColor: COLORS.blackCard, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", overflow: "hidden" },
  statusBar: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 8 },
  statusText: { fontSize: 11, fontWeight: "600" },
  cardBody: { padding: 16 },
  serviceName: { fontSize: 16, fontWeight: "700", color: COLORS.white },
  staffName: { fontSize: 13, color: COLORS.whiteAlpha50, marginTop: 3 },
  details: { gap: 8, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)" },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailText: { fontSize: 13, color: "rgba(250,250,250,0.7)" },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14 },
  price: { fontSize: 18, fontWeight: "700", color: COLORS.gold },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: "rgba(239,68,68,0.4)" },
  cancelBtnText: { fontSize: 12, color: "#EF4444", fontWeight: "500" },
  reviewBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 10, backgroundColor: "rgba(201,168,76,0.15)" },
  reviewBtnText: { fontSize: 12, color: COLORS.gold, fontWeight: "600" },
});
