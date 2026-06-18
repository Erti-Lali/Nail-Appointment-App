import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronRight, MapPin, Star, Clock } from "lucide-react-native";

const COLORS = {
  gold: "#C9A84C",
  goldLight: "rgba(201,168,76,0.15)",
  black: "#0A0A0A",
  blackSoft: "#1A1A1A",
  blackCard: "#141414",
  blackBorder: "#2A2A2A",
  white: "#FAFAFA",
  whiteAlpha50: "rgba(250,250,250,0.5)",
  whiteAlpha30: "rgba(250,250,250,0.3)",
};

// Mock studios
const STUDIOS = [
  {
    id: "1",
    slug: "glamour-nails",
    name: "Glamour Nails",
    city: "İstanbul, Kadıköy",
    rating: 4.9,
    reviewCount: 128,
    image: null,
    tags: ["Gel", "Nail Art", "Manikür"],
    nextSlot: "Bugün 14:00",
  },
  {
    id: "2",
    slug: "luxe-nails-studio",
    name: "Luxe Nails Studio",
    city: "İstanbul, Beşiktaş",
    rating: 4.7,
    reviewCount: 89,
    image: null,
    tags: ["Kalıcı Oje", "Pedikür"],
    nextSlot: "Yarın 10:00",
  },
];

export default function BookScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Randevu Al</Text>
        <Text style={styles.subtitle}>Stüdyo seçin ve randevunuzu oluşturun</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Search */}
        <View style={styles.searchBox}>
          <MapPin size={16} color={COLORS.whiteAlpha50} />
          <Text style={styles.searchText}>Konum veya stüdyo ara...</Text>
        </View>

        {/* Studios */}
        <Text style={styles.sectionTitle}>Yakınımdaki Stüdyolar</Text>
        {STUDIOS.map((studio) => (
          <TouchableOpacity
            key={studio.id}
            style={styles.studioCard}
            activeOpacity={0.8}
            onPress={() => router.push(`/booking/${studio.slug}`)}
          >
            {/* Image placeholder */}
            <View style={styles.studioImage}>
              <Text style={{ fontSize: 32 }}>💅</Text>
            </View>

            <View style={styles.studioInfo}>
              <View style={styles.studioRow}>
                <Text style={styles.studioName}>{studio.name}</Text>
                <View style={styles.ratingBadge}>
                  <Star size={10} color={COLORS.gold} fill={COLORS.gold} />
                  <Text style={styles.ratingText}>{studio.rating}</Text>
                </View>
              </View>

              <View style={styles.locationRow}>
                <MapPin size={11} color={COLORS.whiteAlpha50} />
                <Text style={styles.locationText}>{studio.city}</Text>
              </View>

              <View style={styles.tags}>
                {studio.tags.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.studioFooter}>
                <View style={styles.nextSlot}>
                  <Clock size={11} color={COLORS.gold} />
                  <Text style={styles.nextSlotText}>{studio.nextSlot}</Text>
                </View>
                <View style={styles.bookBtn}>
                  <Text style={styles.bookBtnText}>Randevu Al</Text>
                  <ChevronRight size={12} color={COLORS.black} />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
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

  searchBox: {
    backgroundColor: COLORS.blackSoft,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.blackBorder,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 24,
  },
  searchText: { color: COLORS.whiteAlpha30, fontSize: 14 },

  sectionTitle: { fontSize: 14, fontWeight: "600", color: COLORS.whiteAlpha50, marginBottom: 12 },

  studioCard: {
    backgroundColor: COLORS.blackCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.blackBorder,
    overflow: "hidden",
    marginBottom: 16,
  },
  studioImage: {
    height: 120,
    backgroundColor: COLORS.blackSoft,
    justifyContent: "center",
    alignItems: "center",
  },
  studioInfo: { padding: 16 },
  studioRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  studioName: { fontSize: 16, fontWeight: "700", color: COLORS.white },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: COLORS.goldLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingText: { fontSize: 11, fontWeight: "600", color: COLORS.gold },

  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  locationText: { fontSize: 12, color: COLORS.whiteAlpha50 },

  tags: { flexDirection: "row", gap: 6, marginTop: 10, flexWrap: "wrap" },
  tag: {
    backgroundColor: "rgba(250,250,250,0.06)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.blackBorder,
  },
  tagText: { fontSize: 11, color: COLORS.whiteAlpha50 },

  studioFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
  },
  nextSlot: { flexDirection: "row", alignItems: "center", gap: 4 },
  nextSlotText: { fontSize: 12, color: COLORS.gold, fontWeight: "500" },
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
