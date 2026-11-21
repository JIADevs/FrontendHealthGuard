import { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Pill, CalendarDays, Heart, Route } from "lucide-react-native";
import { nativeFont, spacing } from "../../tokens/tokens";
import { useAppTheme } from "../../tokens/ThemeProvider";
import type { ThemeContextValue } from "../../tokens/ThemeProvider";
import { formatDayShort } from "./calendarDateUtils";
import { filterEventsForDates, type AgendaEvent } from "./mapCalendarApiToEvents";

const MAX_ICONS = 3;

/** Inicial del día como en el mockup (L M M J V S D); el nombre completo va en la etiqueta accesible. */
const DAY_LETTER = ["D", "L", "M", "M", "J", "V", "S"];
const DAY_NAME = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

type IconKind = "medication" | "appointment" | "checkin" | "task";

/** Ícono por tipo de evento (inicio-agenda.md §Calendario). Lo usan la tira y la leyenda. */
export const CALENDAR_TYPE_ICONS: Record<IconKind, typeof Pill> = {
    medication: Pill,
    appointment: CalendarDays,
    checkin: Heart,
    task: Route,
};

/** Color de módulo por tipo. Las tareas usan el acento de misiones (marca), no el de mochilas. */
export function calendarTypeColor(t: ThemeContextValue, kind: IconKind): string {
    if (kind === "medication") return t.accent.medFg;
    if (kind === "appointment") return t.accent.calFg;
    if (kind === "checkin") return t.accent.wellbeingFg;
    return t.accent.missionFg;
}

export type CalendarTypeKind = IconKind;

interface WeekStripProps {
    dates: string[];
    selectedDate: string;
    events: AgendaEvent[];
    onSelectDate: (date: string) => void;
}

export function WeekStrip({ dates, selectedDate, events, onSelectDate }: WeekStripProps) {
    const t = useAppTheme();
    const styles = useMemo(() => makeStyles(t), [t]);

    return (
        <View style={styles.row}>
            {dates.map((date) => {
                const { day, isToday } = formatDayShort(date);
                const dow = new Date(`${date}T12:00:00`).getDay();
                const selected = date === selectedDate;
                const dayEvents = filterEventsForDates(events, [date]);
                const kinds = iconKinds(dayEvents);
                const visible = kinds.slice(0, MAX_ICONS);
                const extra = kinds.length - visible.length;
                const ink = selected ? t.text.onSolid : t.text.primary;
                const iconColor = (kind: IconKind) => (selected ? t.text.onSolid : calendarTypeColor(t, kind));

                return (
                    <Pressable
                        key={date}
                        style={[styles.day, selected && styles.daySelected, isToday && !selected && styles.dayToday]}
                        onPress={() => onSelectDate(date)}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={`${isToday ? "Hoy, " : ""}${DAY_NAME[dow]} ${day}`}
                    >
                        <Text style={[styles.weekday, { color: selected ? t.text.onSolid : t.text.secondary }]}>
                            {DAY_LETTER[dow]}
                        </Text>
                        <Text style={[styles.number, { color: ink }]}>{day}</Text>
                        <View style={styles.icons}>
                            {visible.map((kind) => {
                                const Icon = CALENDAR_TYPE_ICONS[kind];
                                return <Icon key={kind} size={11} strokeWidth={2.6} color={iconColor(kind)} />;
                            })}
                            {extra > 0 ? (
                                <Text style={[styles.extra, { color: selected ? t.text.onSolid : t.text.secondary }]}>
                                    +{extra}
                                </Text>
                            ) : null}
                        </View>
                    </Pressable>
                );
            })}
        </View>
    );
}

function iconKinds(events: AgendaEvent[]): IconKind[] {
    const kinds: IconKind[] = [];
    if (events.some((event) => event.type === "medication")) kinds.push("medication");
    if (events.some((event) => event.type === "appointment" || event.type === "exam")) kinds.push("appointment");
    if (events.some((event) => event.type === "checkin")) kinds.push("checkin");
    if (events.some((event) => event.type === "task")) kinds.push("task");
    return kinds;
}

function makeStyles(t: ThemeContextValue) {
    // Kit `weekStrip`: radio 16, borde 1 px + canto inferior de 3 px; letra Nunito 800 12,5 y número Nunito 900 18.
    return StyleSheet.create({
        row: {
            flexDirection: "row",
            gap: 6,
            paddingHorizontal: spacing[4],
            paddingTop: spacing[2],
        },
        day: {
            flex: 1,
            alignItems: "center",
            gap: spacing[1],
            paddingTop: 8,
            paddingBottom: 9,
            borderRadius: 16,
            borderWidth: 1,
            borderBottomWidth: 4,
            borderColor: t.border.default,
            backgroundColor: t.surface.bgCard,
        },
        daySelected: {
            backgroundColor: t.brand.solid,
            borderColor: t.brand.text,
            borderBottomColor: t.brand.edge,
        },
        dayToday: {
            borderColor: t.brand.solid,
        },
        weekday: {
            fontSize: 12.5,
            fontFamily: nativeFont("heading", 800),
        },
        number: {
            fontSize: 18,
            fontFamily: nativeFont("heading", 900),
        },
        icons: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            height: 12,
        },
        extra: {
            fontSize: 11,
            fontFamily: nativeFont("heading", 800),
        },
    });
}
