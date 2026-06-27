import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronRight, MapPin, Store } from "lucide-react-native";
import { supabase } from "../../lib/supabase";

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

interface Studio {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  instagram_handle: string | null;
}

export default function BookScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [studios, setStudios] = useState<Studio[]>([]);

  useEffect(() => {
    supabase
      .from("tenants")
      .select("id, slug, name, city, instagram_handle")
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => {
        setStudios(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Randevu Al</Text>
        <Text style={styles.subtitle}>Stüdyo seçin ve randevunuzu oluşturun</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Stüdyolar</Text>

        {loading ? (
          <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} />
        ) : studios.length === 0 ? (
          <View style={styles.empty}>
            <Store size={40} color={COLORS.whiteAlpha30} />
            <Text style={styles.emptyText}>Şu an aktif stüdyo yok.</Text>
          </View>
        ) : (
          studios.map((studio) => (
            <TouchableOpacity
              key={studio.id}
              style={styles.studioCard}
              activeOpacity={0.8}
              onPress={() => router.push(`/booking/${studio.slug}`)}
            >
              <View style={styles.studioImage}>
                <Text style={{ fontSize: 32 }}>💅</Text>
              </View>

              <View style={styles.studioInfo}>
                <Text style={styles.studioName}>{studio.name}</Text>

                {studio.city ? (
                  <View style={styles.locationRow}>
                    <MapPin size={11} color={COLORS.whiteAlpha50} />
                    <Text style={styles.locationText}>{studio.city}</Text>
                  </View>
                ) : null}

                <View style={styles.studioFooter}>
                  {studio.instagram_handle ? <Text style={styles.handleText}>@{studio.instagram_handle}</Text> : <View />}
                  <View style={styles.bookBtn}>
                    <Text style={styles.bookBtnText}>Randevu Al</Text>
                    <ChevronRight size={12} color={COLORS.black} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  header: { padding: 20, paddingBottom: 0 },
  title: { fontSize: 22, fontWeight: "700", color: COLORS.white },
  subtitle: { fontSize: 13, color: COLORS.whiteAlpha50, marginTop: 4 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },

  sectionTitle: { fontSize: 14, fontWeight: "600", color: COLORS.whiteAlpha50, marginBottom: 12 },

  empty: { alignItems: "center", gap: 10, marginTop: 50 },
  emptyText: { color: COLORS.whiteAlpha50, fontSize: 14 },

  studioCard: {
    backgroundColor: COLORS.blackCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.blackBorder,
    overflow: "hidden",
    marginBottom: 16,
  },
  studioImage: { height: 120, backgroundColor: COLORS.blackSoft, justifyContent: "center", alignItems: "center" },
  studioInfo: { padding: 16 },
  studioName: { fontSize: 16, fontWeight: "700", color: COLORS.white },

  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  locationText: { fontSize: 12, color: COLORS.whiteAlpha50 },
  handleText: { fontSize: 12, color: COLORS.whiteAlpha50 },

  studioFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14 },
  bookBtn: {
    backgroundColor: COLORS.gold,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  bookBtnText: { fontSize: 13, fontWeight: "600", color: COLORS.black },
});
