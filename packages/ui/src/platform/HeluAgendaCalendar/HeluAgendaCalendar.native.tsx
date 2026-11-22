import type { ReactNode } from "react";
import { ScrollView, Text, View, StyleSheet, Pressable } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { IconButton } from "../../primitives/IconButton/IconButton.native";
import Animated from "react-native-reanimated";
import { SkeletonCard, SkeletonGroup, contentEntering, useSkeletonVisible } from "../../motion/motion.native";
import { fontSize, nativeFont, spacing } from "../../tokens/tokens";
import { useAppTheme } from "../../tokens/ThemeProvider";
import { DayEventList } from "./DayEventList";
import { WeekStrip, CALENDAR_TYPE_ICONS, calendarTypeColor, type CalendarTypeKind } from "./WeekStrip";
import { useHeluAgendaCalendar } from "./useHeluAgendaCalendar";
import { buildWeekDates, startOfWeek, todayLocalDateKey } from "./calendarDateUtils";
import { filterEventsForDates, type AgendaEvent } from "./mapCalendarApiToEvents";

export interface HeluAgendaCalendarProps {
    initialDate?: string;
    onMedicationPress?: (event: Extract<AgendaEvent, { type: "medication" }>) => void;
    onAppointmentPress?: (event: Extract<AgendaEvent, { type: "appointment" | "exam" }>) => void;
    onCheckInPress?: (event: Extract<AgendaEvent, { type: "checkin" }>) => void;
    onTaskPress?: (event: Extract<AgendaEvent, { type: "task" }>) => void;
    onMedicationTake?: (event: Extract<AgendaEvent, { type: "medication" }>) => void;
    onTaskComplete?: (event: Extract<AgendaEvent, { type: "task" }>) => void;
    takingCycleId?: string;
    /** Content for a day with no events (mockup «Calendario · día sin eventos»). Defaults to a short line. */
    renderEmptyDay?: (dateKey: string) => ReactNode;
}

export function HeluAgendaCalendar({
    initialDate,
    onMedicationPress,
    onAppointmentPress,
    onCheckInPress,
    onTaskPress,
    onMedicationTake,
    onTaskComplete,
    renderEmptyDay,
    takingCycleId,
}: HeluAgendaCalendarProps) {
    const calendar = useHeluAgendaCalendar(initialDate);
    const t = useAppTheme();
    const weekDates = buildWeekDates(calendar.selectedDate);
    const dayEvents = filterEventsForDates(calendar.events, [calendar.selectedDate]);
    // Never say «nada agendado» before knowing: skeleton until the selected day is loaded (§6c).
    const showSkeleton = useSkeletonVisible(calendar.isLoading || calendar.isDayLoading);

    function openEvent(event: AgendaEvent) {
        if (event.type === "medication") onMedicationPress?.(event);
        else if (event.type === "appointment" || event.type === "exam") onAppointmentPress?.(event);
        else if (event.type === "checkin") onCheckInPress?.(event);
        else onTaskPress?.(event);
    }

    return (
        <View style={styles.root}>
            <WeekHeader
                selectedDate={calendar.selectedDate}
                onPrevious={calendar.goPrevious}
                onNext={calendar.goNext}
                onGoToday={calendar.goToToday}
            />

            <WeekStrip
                dates={weekDates}
                selectedDate={calendar.selectedDate}
                events={calendar.events}
                onSelectDate={calendar.selectDate}
            />

            <CalendarLegend />

            <Text style={[styles.dayTitle, { color: t.text.primary }]} accessibilityRole="header">
                {dayTitle(calendar.selectedDate)}
            </Text>

            {showSkeleton ? (
                // §6c «Agenda · Calendario»: 3 filas con el borde de color en gris y el bloque del botón.
                <SkeletonGroup label="Cargando la agenda del día" style={styles.skeleton}>
                    <SkeletonCard tile={false} edge action />
                    <SkeletonCard tile={false} edge />
                    <SkeletonCard tile={false} edge />
                </SkeletonGroup>
            ) : calendar.isError ? (
                <View style={styles.center}>
                    <Text style={[styles.errorText, { color: t.status.errorFg }]}>
                        No se pudieron cargar los eventos del calendario. Revisa tu conexión e intenta de nuevo.
                    </Text>
                </View>
            ) : (
                <Animated.View entering={contentEntering} style={styles.list}>
                    <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
                        {dayEvents.length === 0 ? (
                            renderEmptyDay ? (
                                renderEmptyDay(calendar.selectedDate)
                            ) : (
                                <Text style={[styles.empty, { color: t.text.secondary }]}>Nada para este día</Text>
                            )
                        ) : (
                            <DayEventList
                                events={dayEvents}
                                onEventPress={openEvent}
                                onMedicationTake={onMedicationTake}
                                onTaskComplete={onTaskComplete}
                                takingCycleId={takingCycleId}
                            />
                        )}
                    </ScrollView>
                </Animated.View>
            )}
        </View>
    );
}

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Mockup: «Hoy, martes 3»; otro día: «Jueves 5 de noviembre». */
function dayTitle(isoDate: string): string {
    const d = new Date(`${isoDate}T12:00:00`);
    if (isoDate === todayLocalDateKey()) return `Hoy, ${WEEKDAYS[d.getDay()]} ${d.getDate()}`;
    return capitalize(`${WEEKDAYS[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`);
}

/** Mockup: mes y año a la izquierda (H3) y dos botones redondos de 44 px; «Hoy» solo fuera de la semana actual. */
function WeekHeader({
    selectedDate,
    onPrevious,
    onNext,
    onGoToday,
}: {
    selectedDate: string;
    onPrevious: () => void;
    onNext: () => void;
    onGoToday: () => void;
}) {
    const t = useAppTheme();
    const d = new Date(`${selectedDate}T12:00:00`);
    const label = capitalize(`${MONTHS[d.getMonth()]} ${d.getFullYear()}`);
    const inCurrentWeek = startOfWeek(selectedDate) === startOfWeek(todayLocalDateKey());
    return (
        <View style={styles.weekHeader}>
            <Text style={[styles.monthLabel, { color: t.text.primary }]} accessibilityRole="header">
                {label}
            </Text>
            {!inCurrentWeek ? (
                <Pressable onPress={onGoToday} accessibilityRole="button" style={styles.todayLink}>
                    <Text style={[styles.todayText, { color: t.brand.text }]}>Hoy</Text>
                </Pressable>
            ) : null}
            <IconButton
                icon={<ChevronLeft size={16} color={t.text.primary} />}
                accessibilityLabel="Semana anterior"
                onPress={onPrevious}
            />
            <IconButton
                icon={<ChevronRight size={16} color={t.text.primary} />}
                accessibilityLabel="Semana siguiente"
                onPress={onNext}
            />
        </View>
    );
}

function CalendarLegend() {
    const t = useAppTheme();
    // v2.3: la leyenda repite los íconos de la tira, así el tipo no depende solo del color.
    const items: { kind: CalendarTypeKind; label: string }[] = [
        { kind: "medication", label: "Tomas" },
        { kind: "appointment", label: "Citas" },
        { kind: "checkin", label: "Check-in" },
        { kind: "task", label: "Tareas" },
    ];
    return (
        <View style={styles.legend}>
            {items.map((item) => {
                const Icon = CALENDAR_TYPE_ICONS[item.kind];
                return (
                    <View key={item.kind} style={styles.legendItem}>
                        <Icon size={14} strokeWidth={2.4} color={calendarTypeColor(t, item.kind)} />
                        <Text style={[styles.legendLabel, { color: t.text.secondary }]}>{item.label}</Text>
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: spacing[6],
    },
    list: {
        flex: 1,
    },
    skeleton: {
        gap: spacing[3],
        paddingHorizontal: spacing[4],
    },
    listContent: {
        paddingBottom: spacing[6],
    },
    empty: {
        fontSize: fontSize.sm,
        textAlign: "center",
        paddingHorizontal: spacing[4],
        paddingTop: spacing[4],
    },
    errorText: {
        fontSize: fontSize.sm,
        textAlign: "center",
    },
    // Kit `.legend`: Inter 600 13, íconos de 14 y separación 6 × 14
    legend: {
        flexDirection: "row",
        flexWrap: "wrap",
        rowGap: 6,
        columnGap: 14,
        paddingHorizontal: spacing[4],
        paddingTop: spacing[3],
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    legendLabel: {
        fontSize: fontSize.sm,
        fontFamily: nativeFont("body", 600),
    },
    weekHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[2],
        paddingHorizontal: spacing[4],
    },
    monthLabel: {
        flex: 1,
        fontSize: fontSize.md,
        fontFamily: nativeFont("heading", 800),
    },
    todayLink: {
        minHeight: 44,
        justifyContent: "center",
        paddingHorizontal: spacing[2],
    },
    todayText: {
        fontSize: 14,
        fontFamily: nativeFont("heading", 800),
    },
    dayTitle: {
        fontSize: fontSize.md,
        fontFamily: nativeFont("heading", 800),
        paddingHorizontal: spacing[4],
        paddingTop: spacing[4],
        paddingBottom: spacing[3],
    },
});
