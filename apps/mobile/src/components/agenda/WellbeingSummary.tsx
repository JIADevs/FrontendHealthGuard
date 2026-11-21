import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import type { DailyCheckIn, MoodEnum } from "@helu/api";
import { useDailyCheckInsQuery } from "@helu/api/hooks";
import { Skeleton, SkeletonGroup, nativeFont, spacing, useAppTheme, useSkeletonVisible } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { MOOD_CONFIG, MOOD_ORDER } from "./moodConfig";
import { MoodFace, useMoodColor } from "./MoodFace";

const WEEKDAY_INITIALS = ["D", "L", "M", "M", "J", "V", "S"];
const BAR_UNIT = 16; // px per mood point (mockup: 1–5 → 16–80 px)

interface MoodDay {
    key: string;
    label: string;
    mood: MoodEnum | null;
}

function localKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** The last 7 days (oldest first, today last) with the latest mood logged each day. */
function useMoodWeek() {
    // Whole local days, so the query key stays the same across remounts during the day.
    const range = useMemo(() => {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - 6);
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        return { startDate: start.toISOString(), endDate: end.toISOString(), start };
    }, []);
    const query = useDailyCheckInsQuery({ page: 1, limit: 50, startDate: range.startDate, endDate: range.endDate });

    const days = useMemo<MoodDay[]>(() => {
        const latestByDay = new Map<string, DailyCheckIn>();
        for (const checkIn of query.data?.items ?? []) {
            const key = localKey(new Date(checkIn.recordedAt));
            const kept = latestByDay.get(key);
            if (!kept || kept.recordedAt < checkIn.recordedAt) latestByDay.set(key, checkIn);
        }
        return Array.from({ length: 7 }, (_, i) => {
            const day = new Date(range.start);
            day.setDate(day.getDate() + i);
            const key = localKey(day);
            return { key, label: i === 6 ? "Hoy" : WEEKDAY_INITIALS[day.getDay()], mood: latestByDay.get(key)?.mood ?? null };
        });
    }, [query.data, range.start]);

    const latest = useMemo(() => {
        const items = query.data?.items ?? [];
        return items.reduce<DailyCheckIn | undefined>((best, c) => (!best || c.recordedAt > best.recordedAt ? c : best), undefined);
    }, [query.data]);

    return { days, latest, isLoading: query.isLoading };
}

/**
 * «TU BIENESTAR · Cómo te sentiste últimamente» (mockup Bienestar): latest mood, the five-face
 * legend and one bar per day for the last week. Each bar carries its face (inicio-agenda.md ·
 * Bienestar v2). The title and legend are local, so only the bars are a skeleton while loading.
 */
export function WellbeingSummary() {
    const t = useAppTheme();
    const styles = useMemo(() => makeStyles(t), [t]);
    const { days, latest, isLoading } = useMoodWeek();
    const showSkeleton = useSkeletonVisible(isLoading);

    return (
        <View style={styles.card}>
            <View style={styles.headRow}>
                <View style={styles.headText}>
                    <Text style={styles.eyebrow}>TU BIENESTAR</Text>
                    <Text style={styles.title} accessibilityRole="header">Cómo te sentiste últimamente</Text>
                </View>
                {latest ? (
                    <View style={styles.latest} accessible accessibilityLabel={`Último registro: ${MOOD_CONFIG[latest.mood].label}`}>
                        <MoodFace mood={latest.mood} size={36} />
                        <Text style={styles.latestLabel}>{MOOD_CONFIG[latest.mood].label}</Text>
                    </View>
                ) : null}
            </View>

            <View style={styles.legend} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                {MOOD_ORDER.map((mood) => (
                    <View key={mood} style={styles.legendItem}>
                        <MoodFace mood={mood} size={14} />
                        <Text style={styles.legendText}>{MOOD_CONFIG[mood].label}</Text>
                    </View>
                ))}
            </View>

            {showSkeleton ? (
                <SkeletonGroup label="Cargando tu semana" style={styles.bars}>
                    {days.map((day) => (
                        <View key={day.key} style={styles.barCol}>
                            <Skeleton width="100%" height={BAR_UNIT * 3} />
                        </View>
                    ))}
                </SkeletonGroup>
            ) : (
                <View style={styles.bars}>
                    {days.map((day) => (
                        <MoodBar key={day.key} day={day} styles={styles} />
                    ))}
                </View>
            )}
            <View style={styles.dayRow}>
                {days.map((day) => (
                    <Text key={day.key} style={styles.dayLabel}>{day.label}</Text>
                ))}
            </View>
        </View>
    );
}

function MoodBar({ day, styles }: { day: MoodDay; styles: ReturnType<typeof makeStyles> }) {
    if (!day.mood) {
        return (
            <View style={styles.barCol} accessible accessibilityLabel={`${day.label}: sin registro`}>
                <View style={styles.barEmpty} />
            </View>
        );
    }
    return <FilledBar day={day} mood={day.mood} styles={styles} />;
}

function FilledBar({ day, mood, styles }: { day: MoodDay; mood: MoodEnum; styles: ReturnType<typeof makeStyles> }) {
    const color = useMoodColor(mood);
    const { label, score } = MOOD_CONFIG[mood];
    return (
        <View style={styles.barCol} accessible accessibilityLabel={`${day.label}: ${label}`}>
            <MoodFace mood={mood} size={20} />
            <View style={[styles.bar, { height: score * BAR_UNIT, backgroundColor: color }]} />
        </View>
    );
}

function makeStyles(t: ThemeContextValue) {
    return StyleSheet.create({
        // MASTER «Tarjeta»: radio 18, padding 16, borde 1 px + canto de 3 px
        card: {
            marginHorizontal: spacing[4],
            marginTop: spacing[3],
            padding: spacing[4],
            gap: spacing[3],
            borderRadius: 18,
            borderWidth: 1,
            borderColor: t.border.default,
            backgroundColor: t.surface.bgCard,
            boxShadow: `0 3px 0 ${t.border.default}`,
        },
        headRow: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
        headText: { flex: 1, gap: 2 },
        eyebrow: {
            fontSize: 11,
            letterSpacing: 0.9,
            fontFamily: nativeFont("heading", 900),
            color: t.accent.wellbeingFg,
        },
        title: { fontSize: 17, fontFamily: nativeFont("heading", 800), color: t.text.primary },
        latest: { alignItems: "center", gap: 4 },
        latestLabel: { fontSize: 12, fontFamily: nativeFont("body", 400), color: t.text.secondary },
        legend: { flexDirection: "row", flexWrap: "wrap", columnGap: spacing[3], rowGap: spacing[1] },
        legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
        legendText: { fontSize: 12, fontFamily: nativeFont("body", 400), color: t.text.secondary },
        bars: { flexDirection: "row", alignItems: "flex-end", gap: spacing[2], height: 118 },
        barCol: { flex: 1, height: "100%", alignItems: "center", justifyContent: "flex-end", gap: 4 },
        bar: { width: "100%", borderTopLeftRadius: 10, borderTopRightRadius: 10, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
        barEmpty: { width: "100%", height: 8, borderRadius: 4, backgroundColor: t.border.default },
        dayRow: { flexDirection: "row", gap: spacing[2] },
        dayLabel: {
            flex: 1,
            textAlign: "center",
            fontSize: 12,
            fontFamily: nativeFont("heading", 800),
            color: t.text.secondary,
        },
    });
}
