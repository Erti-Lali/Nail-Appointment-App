import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Calendar, Clock, ChevronLeft, ChevronRight, Check } from "lucide-react-native";
import { addDays, format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

const COLORS = {
  gold: "#C9A84C",
  goldLight: "rgba(201,168,76,0.15)",
  black: "#0A0A0A",
  blackSoft: "#1A1A1A",
  blackCard: "#141414",
  blackBorder: "#2A2A2A",
  white: "#FAFAFA",
  whiteAlpha50: "rgba(250,250,250,0.5)",
};

// Mock services
const SERVICES = [
  { id: "1", name: "Manikür", duration: 45, price: 250, category: "Manikür" },
  { id: "2", name: "Kalıcı Oje", duration: 60, price: 350, category: "Manikür" },
  { id: "3", name: "Nail Art (Tek Renk)", duration: 90, price: 450, category: "Nail Art" },
  { id: "4", name: "Nail Art (Özel)", duration: 120, price: 650, category: "Nail Art" },
  { id: "5", name: "Pedikür", duration: 60, price: 300, category: "Pedikür" },
];

const STAFF = [
  { id: "1", name: "Ayşe H.", specialty: "Nail Art Uzmanı", color: "#C9A84C" },
  { id: "2", name: "Fatma K.", specialty: "Manikür & Pedikür", color: "#EC4899" },
];

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30",
];

const STEPS = ["Hizmet", "Personel", "Tarih & Saat", "Onay"];

export default function BookingScreen() {
  const { studioSlug } = useLocalSearchParams<{ studioSlug: string }>();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(new Date(), i);
    return { key: format(d, "yyyy-MM-dd"), label: format(d, "d"), day: format(d, "EEE", { locale: tr }) };
  });

  const service = SERVICES.find((s) => s.id === selectedService);

  const canProceed = () => {
    if (step === 0) return !!selectedService;
    if (step === 1) return !!selectedStaff;
    if (step === 2) return !!selectedTime;
    return true;
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {/* Progress */}
      <View style={styles.progress}>
        {STEPS.map((s, i) => (
          <View key={s} style={styles.progressStep}>
            <View style={[styles.progressDot, i <= step && styles.progressDotActive]}>
              {i < step ? (
                <Check size={10} color={COLORS.black} />
              ) : (
                <Text style={[styles.progressNum, i === step && styles.progressNumActive]}>
                  {i + 1}
                </Text>
              )}
            </View>
            <Text style={[styles.progressLabel, i === step && styles.progressLabelActive]}>
              {s}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Step 0: Service */}
        {step === 0 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Hizmet Seçin</Text>
            {SERVICES.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={[styles.optionCard, selectedService === service.id && styles.optionCardActive]}
                onPress={() => setSelectedService(service.id)}
                activeOpacity={0.8}
              >
                <View style={styles.optionInfo}>
                  <Text style={styles.optionName}>{service.name}</Text>
                  <Text style={styles.optionMeta}>{service.duration} dk · {service.category}</Text>
                </View>
                <View style={styles.optionRight}>
                  <Text style={styles.optionPrice}>₺{service.price}</Text>
                  {selectedService === service.id && (
                    <View style={styles.checkmark}>
                      <Check size={12} color={COLORS.black} />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Step 1: Staff */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Personel Seçin</Text>
            {STAFF.map((member) => (
              <TouchableOpacity
                key={member.id}
                style={[styles.optionCard, selectedStaff === member.id && styles.optionCardActive]}
                onPress={() => setSelectedStaff(member.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.staffAvatar, { backgroundColor: `${member.color}20` }]}>
                  <Text style={[styles.staffAvatarText, { color: member.color }]}>
                    {member.name.charAt(0)}
                  </Text>
                </View>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionName}>{member.name}</Text>
                  <Text style={styles.optionMeta}>{member.specialty}</Text>
                </View>
                {selectedStaff === member.id && (
                  <View style={styles.checkmark}>
                    <Check size={12} color={COLORS.black} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Step 2: Date & Time */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Tarih ve Saat Seçin</Text>

            {/* Date picker */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
              {dates.map((d) => (
                <TouchableOpacity
                  key={d.key}
                  style={[styles.dateChip, selectedDate === d.key && styles.dateChipActive]}
                  onPress={() => setSelectedDate(d.key)}
                >
                  <Text style={[styles.dateDay, selectedDate === d.key && styles.dateDayActive]}>
                    {d.day}
                  </Text>
                  <Text style={[styles.dateNum, selectedDate === d.key && styles.dateNumActive]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Time slots */}
            <Text style={styles.subTitle}>Müsait Saatler</Text>
            <View style={styles.timeGrid}>
              {TIME_SLOTS.map((slot) => (
                <TouchableOpacity
                  key={slot}
                  style={[styles.timeSlot, selectedTime === slot && styles.timeSlotActive]}
                  onPress={() => setSelectedTime(slot)}
                >
                  <Text style={[styles.timeSlotText, selectedTime === slot && styles.timeSlotTextActive]}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && service && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Randevu Özeti</Text>
            <View style={styles.summaryCard}>
              {[
                { label: "Hizmet", value: service.name },
                { label: "Personel", value: STAFF.find((s) => s.id === selectedStaff)?.name ?? "-" },
                { label: "Tarih", value: format(new Date(selectedDate), "d MMMM yyyy, EEEE", { locale: tr }) },
                { label: "Saat", value: selectedTime ?? "-" },
                { label: "Süre", value: `${service.duration} dakika` },
                { label: "Ücret", value: `₺${service.price}` },
              ].map((item) => (
                <View key={item.label} style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{item.label}</Text>
                  <Text style={styles.summaryValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom actions */}
      <View style={styles.bottom}>
        {step > 0 && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setStep((s) => s - 1)}
          >
            <ChevronLeft size={18} color={COLORS.white} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
          onPress={() => {
            if (step < 3) setStep((s) => s + 1);
            else router.push("/(tabs)/appointments");
          }}
          disabled={!canProceed()}
        >
          <Text style={styles.nextBtnText}>
            {step === 3 ? "Randevuyu Onayla" : "Devam Et"}
          </Text>
          {step < 3 && <ChevronRight size={18} color={COLORS.black} />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },

  progress: { flexDirection: "row", paddingHorizontal: 20, paddingVertical: 16, gap: 0 },
  progressStep: { flex: 1, alignItems: "center", gap: 4 },
  progressDot: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: "rgba(250,250,250,0.1)",
    justifyContent: "center", alignItems: "center",
  },
  progressDotActive: { backgroundColor: COLORS.gold },
  progressNum: { fontSize: 10, fontWeight: "700", color: COLORS.whiteAlpha50 },
  progressNumActive: { color: COLORS.black },
  progressLabel: { fontSize: 10, color: COLORS.whiteAlpha50 },
  progressLabelActive: { color: COLORS.gold, fontWeight: "600" },

  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 20 },
  stepContainer: { gap: 12 },
  stepTitle: { fontSize: 18, fontWeight: "700", color: COLORS.white, marginBottom: 4 },
  subTitle: { fontSize: 13, fontWeight: "600", color: COLORS.whiteAlpha50, marginTop: 8 },

  optionCard: {
    backgroundColor: COLORS.blackCard, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.blackBorder,
    flexDirection: "row", alignItems: "center", padding: 14, gap: 12,
  },
  optionCardActive: { borderColor: COLORS.gold, backgroundColor: "rgba(201,168,76,0.08)" },
  optionInfo: { flex: 1 },
  optionName: { fontSize: 14, fontWeight: "600", color: COLORS.white },
  optionMeta: { fontSize: 12, color: COLORS.whiteAlpha50, marginTop: 2 },
  optionRight: { alignItems: "flex-end", gap: 6 },
  optionPrice: { fontSize: 16, fontWeight: "700", color: COLORS.gold },
  checkmark: { width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.gold, justifyContent: "center", alignItems: "center" },

  staffAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  staffAvatarText: { fontSize: 18, fontWeight: "700" },

  dateScroll: { marginBottom: 16 },
  dateChip: {
    width: 52, marginRight: 8, paddingVertical: 10,
    backgroundColor: COLORS.blackCard, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.blackBorder,
    alignItems: "center",
  },
  dateChipActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  dateDay: { fontSize: 10, color: COLORS.whiteAlpha50, fontWeight: "500" },
  dateDayActive: { color: COLORS.black },
  dateNum: { fontSize: 18, fontWeight: "700", color: COLORS.white, marginTop: 2 },
  dateNumActive: { color: COLORS.black },

  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  timeSlot: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    backgroundColor: COLORS.blackCard, borderWidth: 1, borderColor: COLORS.blackBorder,
  },
  timeSlotActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  timeSlotText: { fontSize: 13, fontWeight: "500", color: COLORS.whiteAlpha50 },
  timeSlotTextActive: { color: COLORS.black, fontWeight: "700" },

  summaryCard: { backgroundColor: COLORS.blackCard, borderRadius: 16, borderWidth: 1, borderColor: COLORS.blackBorder, padding: 16, gap: 0 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" },
  summaryLabel: { fontSize: 13, color: COLORS.whiteAlpha50 },
  summaryValue: { fontSize: 13, fontWeight: "600", color: COLORS.white },

  bottom: { flexDirection: "row", gap: 10, padding: 20, borderTopWidth: 1, borderTopColor: COLORS.blackBorder },
  backBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.blackSoft, borderWidth: 1, borderColor: COLORS.blackBorder, justifyContent: "center", alignItems: "center" },
  nextBtn: { flex: 1, height: 48, backgroundColor: COLORS.gold, borderRadius: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { fontSize: 15, fontWeight: "700", color: COLORS.black },
});
