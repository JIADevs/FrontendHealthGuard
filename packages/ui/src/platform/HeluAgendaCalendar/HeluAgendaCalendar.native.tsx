import { useMemo, useRef, useState, type ReactNode } from "react";
import { ScrollView, Text, View, StyleSheet, Pressable } from "react-native";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react-native";
import { useCalendarEventsQuery } from "@helu/api/reactQueryHooks";
import { BottomSheet } from "../../containers/BottomSheet/BottomSheet.native";
import type { BottomSheetHandle } from "../../containers/BottomSheet/BottomSheet.types";
import { Button } from "../../primitives/Button/Button.native";
import { IconTile } from "../../primitives/IconTile/IconTile.native";
import { buildDayActivityMap } from "./dayActivityIndicators";
import { IconButton } from "../../primitives/IconButton/IconButton.native";
import Animated from "react-native-reanimated";
import { SkeletonCard, SkeletonGroup, contentEntering, useSkeletonVisible } from "../../motion/motion.native";
import { fontSize, nativeFont, spacing } from "../../tokens/tokens";
import { useAppTheme } from "../../tokens/ThemeProvider";
import { DayEventList } from "./DayEventList";
import { WeekStrip, CALENDAR_TYPE_ICONS, calendarTypeColor, type CalendarTypeKind } from "./WeekStrip";
import { useHeluAgendaCalendar } from "./useHeluAgendaCalendar";
import { addMonths, buildMonthGrid, buildWeekDates, endOfMonth, startOfMonth, startOfWeek, todayLocalDateKey } from "./calendarDateUtils";
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
    const [monthSheetOpen, setMonthSheetOpen] = useState(false);

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
                onOpenMonth={() => setMonthSheetOpen(true)}
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

            {monthSheetOpen ? (
                <MonthSheet
                    selectedDate={calendar.selectedDate}
                    onPick={(date) => calendar.selectDate(date)}
                    onClose={() => setMonthSheetOpen(false)}
                />
            ) : null}
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
    onOpenMonth,
}: {
    selectedDate: string;
    onPrevious: () => void;
    onNext: () => void;
    onGoToday: () => void;
    onOpenMonth: () => void;
}) {
    const t = useAppTheme();
    const d = new Date(`${selectedDate}T12:00:00`);
    const label = capitalize(`${MONTHS[d.getMonth()]} ${d.getFullYear()}`);
    const inCurrentWeek = startOfWeek(selectedDate) === startOfWeek(todayLocalDateKey());
    return (
        <View style={styles.weekHeader}>
            {/* v2.10 · «Noviembre 2026 ⌄» abre la hoja «Ir a una fecha» (inicio-agenda.md · Calendario). */}
            <View style={styles.monthLabelWrap}>
                <Pressable
                    onPress={onOpenMonth}
                    accessibilityRole="button"
                    accessibilityLabel={`${label}, ir a una fecha`}
                    hitSlop={8}
                    style={({ pressed }) => [styles.monthLabelButton, pressed && { opacity: 0.6 }]}
                >
                    <Text style={[styles.monthLabel, { color: t.text.primary }]}>{label}</Text>
                    <ChevronDown size={16} strokeWidth={2.6} color={t.text.secondary} />
                </Pressable>
            </View>
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

/**
 * v2.10 · Hoja «Ir a una fecha»: el mes completo con los mismos íconos por tipo de la tira (hasta 3),
 * flechas de mes, la leyenda y «Volver a hoy». Tocar un día cierra la hoja y la agenda salta allá.
 * Mientras llega el mes, los días van sin íconos: nunca «sin eventos» antes de saberlo.
 */
function MonthSheet({ selectedDate, onPick, onClose }: { selectedDate: string; onPick: (date: string) => void; onClose: () => void }) {
    const t = useAppTheme();
    const sheetRef = useRef<BottomSheetHandle>(null);
    const [month, setMonth] = useState(startOfMonth(selectedDate));
    const query = useCalendarEventsQuery(month, endOfMonth(month));
    const activity = useMemo(() => buildDayActivityMap(query.data ?? []), [query.data]);
    // Always 6 rows, so the sheet keeps its height when a month needs 5 (no jump between months).
    const cells = useMemo(() => {
        const grid = buildMonthGrid(month);
        while (grid.length < 42) grid.push({ kind: "empty" });
        return grid;
    }, [month]);
    const d = new Date(`${month}T12:00:00`);
    const label = capitalize(`${MONTHS[d.getMonth()]} ${d.getFullYear()}`);
    const pick = (date: string) => sheetRef.current?.close(() => onPick(date)) ?? onPick(date);

    return (
        <BottomSheet
            ref={sheetRef}
            eyebrow="AGENDA"
            title="Ir a una fecha"
            icon={<IconTile tone="brand" size="lg" round icon={<CalendarDays size={24} strokeWidth={2.2} color={t.brand.text} />} />}
            onClose={onClose}
        >
            <View style={styles.sheetBody}>
                <View style={styles.sheetMonthRow}>
                    <Text style={[styles.monthLabel, styles.grow, { color: t.text.primary }]} accessibilityRole="header" accessibilityLiveRegion="polite">
                        {label}
                    </Text>
                    <IconButton
                        icon={<ChevronLeft size={16} color={t.text.primary} />}
                        accessibilityLabel="Mes anterior"
                        onPress={() => setMonth(addMonths(month, -1))}
                    />
                    <IconButton
                        icon={<ChevronRight size={16} color={t.text.primary} />}
                        accessibilityLabel="Mes siguiente"
                        onPress={() => setMonth(addMonths(month, 1))}
                    />
                </View>
                <View style={styles.monthGrid}>
                    {["L", "M", "M", "J", "V", "S", "D"].map((w, i) => (
                        <Text key={i} style={[styles.monthWeekday, { color: t.text.secondary }]}>
                            {w}
                        </Text>
                    ))}
                    {cells.map((cell, i) => {
                        if (cell.kind === "empty") return <View key={`e${i}`} style={[styles.monthCellSlot, styles.monthCellEmpty]} />;
                        const day = activity.get(cell.date);
                        const kinds: CalendarTypeKind[] = day
                            ? ([
                                  day.hasMedications && "medication",
                                  day.hasAppointments && "appointment",
                                  day.hasCheckIn && "checkin",
                                  day.hasTasks && "task",
                              ].filter(Boolean) as CalendarTypeKind[]).slice(0, 3)
                            : [];
                        const selected = cell.date === selectedDate;
                        return (
                            <View key={cell.date} style={styles.monthCellSlot}>
                                <Pressable
                                    onPress={() => pick(cell.date)}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected }}
                                    accessibilityLabel={`${cell.dayNumber}${cell.isToday ? ", hoy" : ""}${kinds.length ? `, ${kinds.length} ${kinds.length === 1 ? "tipo de evento" : "tipos de eventos"}` : ""}`}
                                    style={({ pressed }) => [
                                        styles.monthCell,
                                        selected
                                            ? { backgroundColor: t.brand.solid, borderColor: t.brand.text, borderBottomColor: t.brand.edge, borderBottomWidth: 3 }
                                            : cell.isToday
                                              ? { backgroundColor: t.brand.tint, borderColor: t.brand.focus, borderWidth: 2 }
                                              : { backgroundColor: t.surface.bgCard, borderColor: t.border.default },
                                        pressed && { opacity: 0.7 },
                                    ]}
                                >
                                    <Text style={[styles.monthDay, { color: selected ? t.text.onSolid : cell.isToday ? t.brand.text : t.text.primary }]}>
                                        {cell.dayNumber}
                                    </Text>
                                    <View style={styles.monthIcons}>
                                        {kinds.map((k) => {
                                            const Icon = CALENDAR_TYPE_ICONS[k];
                                            return <Icon key={k} size={9} strokeWidth={2.6} color={selected ? t.text.onSolid : calendarTypeColor(t, k)} />;
                                        })}
                                    </View>
                                </Pressable>
                            </View>
                        );
                    })}
                </View>
                <CalendarLegend />
                <Button variant="secondary" fullWidth icon={<CalendarDays size={16} color={t.brand.text} />} onPress={() => pick(todayLocalDateKey())}>
                    Volver a hoy
                </Button>
                <Text style={[styles.sheetHint, { color: t.text.secondary }]}>Toca un día para ir a esa semana.</Text>
            </View>
        </BottomSheet>
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
    monthLabelWrap: {
        flex: 1,
        alignItems: "flex-start",
    },
    monthLabelButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        minHeight: 44,
    },
    grow: {
        flex: 1,
    },
    sheetBody: {
        gap: spacing[3],
    },
    sheetMonthRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[2],
    },
    monthGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        rowGap: 6,
    },
    monthWeekday: {
        width: `${100 / 7}%`,
        textAlign: "center",
        fontSize: 11.5,
        fontFamily: nativeFont("heading", 800),
        paddingBottom: 2,
    },
    monthCellSlot: {
        width: `${100 / 7}%`,
        paddingHorizontal: 3,
    },
    monthCellEmpty: {
        height: 44,
    },
    monthCell: {
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        borderBottomWidth: 2,
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
    },
    monthDay: {
        fontSize: 14,
        fontFamily: nativeFont("heading", 900),
    },
    monthIcons: {
        flexDirection: "row",
        gap: 1,
        height: 9,
    },
    sheetHint: {
        fontSize: fontSize.sm,
        fontFamily: nativeFont("body", 400),
        textAlign: "center",
    },
    monthLabel: {
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
