import { useEffect, useMemo, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, ChevronRight, Check, CheckCircle2 } from "lucide-react-native";
import { addDays, addMinutes, format, isBefore, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { formatPrice, minutesToDisplay, isValidPhone } from "@nailstudio/shared";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { getAvailability, createBooking, type Availability } from "../../lib/api";

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

const STEPS = ["Hizmet", "Personel", "Tarih & Saat", "Onay"];

const toMin = (hhmm: string) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
const toHHMM = (mins: number) => `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

export default function BookingScreen() {
  const { studioSlug } = useLocalSearchParams<{ studioSlug: string }>();
  const router = useRouter();
  const { session, profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);

  const [step, setStep] = useState(0);
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [time, setTime] = useState<string | null>(null);

  const [avail, setAvail] = useState<Availability | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load studio + its services/staff
  useEffect(() => {
    async function load() {
      const { data: t } = await supabase
        .from("tenants").select("id, name, slug, currency").eq("slug", studioSlug).eq("is_active", true).maybeSingle();
      if (!t) { setLoading(false); return; }
      setTenant(t);
      const [{ data: svc }, { data: stf }] = await Promise.all([
        supabase.from("services").select("id, name, description, duration_minutes, price")
          .eq("tenant_id", t.id).eq("is_active", true).order("sort_order"),
        supabase.from("staff").select("id, display_name, specialties, color")
          .eq("tenant_id", t.id).eq("is_active", true).eq("accepts_online_booking", true),
      ]);
      setServices(svc ?? []);
      setStaff(stf ?? []);
      setLoading(false);
    }
    load();
  }, [studioSlug]);

  // Prefill customer info from the logged-in profile
  useEffect(() => {
    setForm((f) => ({
      firstName: f.firstName || profile?.first_name || "",
      lastName: f.lastName || profile?.last_name || "",
      phone: f.phone || profile?.phone || "",
      email: f.email || session?.user?.email || "",
    }));
  }, [profile, session]);

  const selectedServices = services.filter((s) => serviceIds.includes(s.id));
  const totalDuration = selectedServices.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + Number(s.price ?? 0), 0);
  const member = staff.find((s) => s.id === staffId);
  const currency = tenant?.currency ?? "TRY";

  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(new Date(), i);
    return { key: format(d, "yyyy-MM-dd"), day: format(d, "EEE", { locale: tr }), num: format(d, "d") };
  });

  // Fetch availability when entering the date/time step
  useEffect(() => {
    if (step !== 2 || !staffId || !tenant) return;
    setLoadingSlots(true);
    setTime(null);
    getAvailability(staffId, date, tenant.id)
      .then(setAvail)
      .catch((e) => { setAvail(null); setError(e?.message ?? "Müsaitlik alınamadı"); })
      .finally(() => setLoadingSlots(false));
  }, [step, staffId, date, tenant]);

  const slots = useMemo(() => {
    const wh = avail?.workingHours;
    const stepMin = avail?.slotDuration && avail.slotDuration > 0 ? avail.slotDuration : 30;
    if (!wh || totalDuration === 0) return [] as string[];
    const open = toMin(wh.start), close = toMin(wh.end);
    const bStart = wh.breakStart ? toMin(wh.breakStart) : null;
    const bEnd = wh.breakEnd ? toMin(wh.breakEnd) : null;
    const out: string[] = [];
    for (let t = open; t + totalDuration <= close; t += stepMin) {
      const end = t + totalDuration;
      if (bStart != null && bEnd != null && t < bEnd && bStart < end) continue;
      out.push(toHHMM(t));
    }
    return out;
  }, [avail, totalDuration]);

  const slotTaken = (slot: string) => {
    const start = parseISO(`${date}T${slot}:00`);
    const end = addMinutes(start, totalDuration);
    if (isBefore(start, new Date())) return true;
    return (avail?.busy ?? []).some((b) => isBefore(start, parseISO(b.ends_at)) && isBefore(parseISO(b.starts_at), end));
  };
  const availableSlots = slots.filter((s) => !slotTaken(s));

  const toggleService = (id: string) =>
    setServiceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const canProceed =
    (step === 0 && serviceIds.length > 0) ||
    (step === 1 && !!staffId) ||
    (step === 2 && !!time) ||
    (step === 3 && form.firstName.trim() !== "" && isValidPhone(form.phone));

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    const { ok, data } = await createBooking({
      tenantId: tenant.id,
      serviceIds,
      staffId: staffId!,
      startsAt: `${date}T${time}:00`,
      customer: { firstName: form.firstName, lastName: form.lastName, phone: form.phone, email: form.email },
    });
    setSubmitting(false);
    if (!ok) { setError(data?.error ?? "Randevu oluşturulamadı"); return; }
    setDone(true);
  };

  // ── Loading / not found ──
  if (loading) {
    return <SafeAreaView style={styles.center}><ActivityIndicator color={COLORS.gold} /></SafeAreaView>;
  }
  if (!tenant) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={{ fontSize: 40 }}>💅</Text>
        <Text style={styles.stepTitle}>Stüdyo bulunamadı</Text>
        <TouchableOpacity style={[styles.nextBtn, { marginTop: 16, paddingHorizontal: 24 }]} onPress={() => router.back()}>
          <Text style={styles.nextBtnText}>Geri dön</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Success ──
  if (done) {
    return (
      <SafeAreaView style={styles.center}>
        <CheckCircle2 size={56} color={COLORS.gold} />
        <Text style={[styles.stepTitle, { marginTop: 12 }]}>
          {avail?.autoConfirm ? "Randevunuz Onaylandı!" : "Randevu Talebiniz Alındı!"}
        </Text>
        <Text style={styles.subTitle}>{tenant.name}</Text>
        <TouchableOpacity style={[styles.nextBtn, { marginTop: 24, paddingHorizontal: 24 }]} onPress={() => router.replace("/(tabs)/appointments")}>
          <Text style={styles.nextBtnText}>Randevularım</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {/* Progress */}
      <View style={styles.progress}>
        {STEPS.map((s, i) => (
          <View key={s} style={styles.progressStep}>
            <View style={[styles.progressDot, i <= step && styles.progressDotActive]}>
              {i < step ? <Check size={10} color={COLORS.black} /> : (
                <Text style={[styles.progressNum, i === step && styles.progressNumActive]}>{i + 1}</Text>
              )}
            </View>
            <Text style={[styles.progressLabel, i === step && styles.progressLabelActive]}>{s}</Text>
          </View>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Step 0: Services */}
        {step === 0 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Hizmet Seçin</Text>
            {services.length === 0 && <Text style={styles.subTitle}>Bu stüdyoda aktif hizmet yok.</Text>}
            {services.map((s) => {
              const active = serviceIds.includes(s.id);
              return (
                <TouchableOpacity key={s.id} style={[styles.optionCard, active && styles.optionCardActive]}
                  onPress={() => toggleService(s.id)} activeOpacity={0.8}>
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionName}>{s.name}</Text>
                    <Text style={styles.optionMeta}>{minutesToDisplay(s.duration_minutes ?? 0)}</Text>
                  </View>
                  <View style={styles.optionRight}>
                    <Text style={styles.optionPrice}>{formatPrice(s.price ?? 0, currency)}</Text>
                    {active && <View style={styles.checkmark}><Check size={12} color={COLORS.black} /></View>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Step 1: Staff */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Personel Seçin</Text>
            {staff.length === 0 && <Text style={styles.subTitle}>Online randevuya açık personel yok.</Text>}
            {staff.map((m) => {
              const active = staffId === m.id;
              const color = m.color ?? COLORS.gold;
              return (
                <TouchableOpacity key={m.id} style={[styles.optionCard, active && styles.optionCardActive]}
                  onPress={() => setStaffId(m.id)} activeOpacity={0.8}>
                  <View style={[styles.staffAvatar, { backgroundColor: `${color}33` }]}>
                    <Text style={[styles.staffAvatarText, { color }]}>{m.display_name?.charAt(0)}</Text>
                  </View>
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionName}>{m.display_name}</Text>
                    {m.specialties?.length ? <Text style={styles.optionMeta}>{m.specialties.join(", ")}</Text> : null}
                  </View>
                  {active && <View style={styles.checkmark}><Check size={12} color={COLORS.black} /></View>}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Step 2: Date & Time */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Tarih ve Saat Seçin</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
              {dates.map((d) => {
                const active = date === d.key;
                return (
                  <TouchableOpacity key={d.key} style={[styles.dateChip, active && styles.dateChipActive]} onPress={() => setDate(d.key)}>
                    <Text style={[styles.dateDay, active && styles.dateDayActive]}>{d.day}</Text>
                    <Text style={[styles.dateNum, active && styles.dateNumActive]}>{d.num}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.subTitle}>Müsait Saatler</Text>
            {loadingSlots ? (
              <ActivityIndicator color={COLORS.gold} style={{ marginTop: 16 }} />
            ) : avail?.onLeave ? (
              <Text style={styles.muted}>Personel bu tarihte izinli. Başka gün seçin.</Text>
            ) : !avail?.workingHours ? (
              <Text style={styles.muted}>Personel bu gün çalışmıyor. Başka gün seçin.</Text>
            ) : availableSlots.length === 0 ? (
              <Text style={styles.muted}>Bu tarihte uygun saat kalmadı. Başka gün seçin.</Text>
            ) : (
              <View style={styles.timeGrid}>
                {slots.map((slot) => {
                  const taken = slotTaken(slot);
                  const active = time === slot;
                  return (
                    <TouchableOpacity key={slot} disabled={taken}
                      style={[styles.timeSlot, active && styles.timeSlotActive, taken && { opacity: 0.3 }]}
                      onPress={() => setTime(slot)}>
                      <Text style={[styles.timeSlotText, active && styles.timeSlotTextActive]}>{slot}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Step 3: Confirm + contact */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Bilgileriniz</Text>
            <View style={styles.summaryCard}>
              {[
                { label: "Hizmetler", value: selectedServices.map((s) => s.name).join(", ") },
                { label: "Personel", value: member?.display_name ?? "-" },
                { label: "Tarih", value: format(parseISO(date), "d MMMM yyyy, EEEE", { locale: tr }) },
                { label: "Saat", value: time ?? "-" },
                { label: "Süre", value: minutesToDisplay(totalDuration) },
                { label: "Ücret", value: formatPrice(totalPrice, currency) },
              ].map((item) => (
                <View key={item.label} style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{item.label}</Text>
                  <Text style={styles.summaryValue}>{item.value}</Text>
                </View>
              ))}
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Ad *</Text>
                <TextInput style={styles.input} value={form.firstName} onChangeText={(v) => setForm((f) => ({ ...f, firstName: v }))} placeholder="Ad" placeholderTextColor={COLORS.whiteAlpha50} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Soyad</Text>
                <TextInput style={styles.input} value={form.lastName} onChangeText={(v) => setForm((f) => ({ ...f, lastName: v }))} placeholder="Soyad" placeholderTextColor={COLORS.whiteAlpha50} />
              </View>
            </View>
            <View>
              <Text style={styles.label}>Telefon *</Text>
              <TextInput style={styles.input} value={form.phone} onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))} placeholder="05XX XXX XX XX" placeholderTextColor={COLORS.whiteAlpha50} keyboardType="phone-pad" />
            </View>
            <View>
              <Text style={styles.label}>E-posta</Text>
              <TextInput style={styles.input} value={form.email} onChangeText={(v) => setForm((f) => ({ ...f, email: v }))} placeholder="ornek@email.com" placeholderTextColor={COLORS.whiteAlpha50} keyboardType="email-address" autoCapitalize="none" />
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        )}
      </ScrollView>

      {/* Bottom actions */}
      <View style={styles.bottom}>
        {step > 0 && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep((s) => s - 1)}>
            <ChevronLeft size={18} color={COLORS.white} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, (!canProceed || submitting) && styles.nextBtnDisabled]}
          disabled={!canProceed || submitting}
          onPress={() => { if (step < 3) setStep((s) => s + 1); else submit(); }}
        >
          {submitting ? <ActivityIndicator color={COLORS.black} /> : (
            <>
              <Text style={styles.nextBtnText}>{step === 3 ? "Randevuyu Onayla" : "Devam Et"}</Text>
              {step < 3 && <ChevronRight size={18} color={COLORS.black} />}
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  center: { flex: 1, backgroundColor: COLORS.black, justifyContent: "center", alignItems: "center", gap: 6, padding: 24 },

  progress: { flexDirection: "row", paddingHorizontal: 20, paddingVertical: 16, gap: 0 },
  progressStep: { flex: 1, alignItems: "center", gap: 4 },
  progressDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(250,250,250,0.1)", justifyContent: "center", alignItems: "center" },
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
  muted: { fontSize: 13, color: COLORS.whiteAlpha50, marginTop: 16, textAlign: "center" },
  errorText: { color: "#EF4444", fontSize: 13, marginTop: 4 },

  optionCard: { backgroundColor: COLORS.blackCard, borderRadius: 16, borderWidth: 1, borderColor: COLORS.blackBorder, flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
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
  dateChip: { width: 52, marginRight: 8, paddingVertical: 10, backgroundColor: COLORS.blackCard, borderRadius: 14, borderWidth: 1, borderColor: COLORS.blackBorder, alignItems: "center" },
  dateChipActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  dateDay: { fontSize: 10, color: COLORS.whiteAlpha50, fontWeight: "500" },
  dateDayActive: { color: COLORS.black },
  dateNum: { fontSize: 18, fontWeight: "700", color: COLORS.white, marginTop: 2 },
  dateNumActive: { color: COLORS.black },

  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  timeSlot: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: COLORS.blackCard, borderWidth: 1, borderColor: COLORS.blackBorder },
  timeSlotActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  timeSlotText: { fontSize: 13, fontWeight: "500", color: COLORS.whiteAlpha50 },
  timeSlotTextActive: { color: COLORS.black, fontWeight: "700" },

  summaryCard: { backgroundColor: COLORS.blackCard, borderRadius: 16, borderWidth: 1, borderColor: COLORS.blackBorder, padding: 16 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" },
  summaryLabel: { fontSize: 13, color: COLORS.whiteAlpha50 },
  summaryValue: { fontSize: 13, fontWeight: "600", color: COLORS.white, flexShrink: 1, textAlign: "right", marginLeft: 8 },

  label: { fontSize: 12, color: COLORS.whiteAlpha50, marginBottom: 6 },
  input: { backgroundColor: COLORS.blackCard, borderWidth: 1, borderColor: COLORS.blackBorder, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: COLORS.white, fontSize: 14 },

  bottom: { flexDirection: "row", gap: 10, padding: 20, borderTopWidth: 1, borderTopColor: COLORS.blackBorder },
  backBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.blackSoft, borderWidth: 1, borderColor: COLORS.blackBorder, justifyContent: "center", alignItems: "center" },
  nextBtn: { flex: 1, height: 48, backgroundColor: COLORS.gold, borderRadius: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { fontSize: 15, fontWeight: "700", color: COLORS.black },
});
