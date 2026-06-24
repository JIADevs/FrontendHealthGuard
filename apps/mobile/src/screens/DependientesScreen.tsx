import { useState, useCallback, useMemo, useLayoutEffect } from "react";
import {
    View,
    ScrollView,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { UserPlus } from "lucide-react-native";
import { useAuthStore } from "@helu/stores";
import {
    useManagedUsersQuery,
    useManagersQuery,
    useDelegationContextColorsQuery,
    useUpdateDelegationColorsMutation,
    useProfileQuery,
} from "@helu/api/hooks";
import { palette, spacing, fontSize, fontWeight, radii, useAppTheme } from "@helu/ui";
import {
    DelegationRequestCard,
    DelegationPendingOutboundCard,
    ManagerCard,
    ManagedPatientCard,
    DelegationInviteModeSheet,
} from "../components/dependientes";
import type { RootStackParamList } from "../navigation/RootNavigator";
import type { DelegationRelationship, DelegationContextColors } from "@helu/api";
import { isDelegationInbound } from "@helu/api";

export function DependientesScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const t = useAppTheme();
    const styles = useMemo(() => makeStyles(), []);

    const managedQuery = useManagedUsersQuery();
    const managersQuery = useManagersQuery();
    const contextColorsQuery = useDelegationContextColorsQuery();
    const updateColors = useUpdateDelegationColorsMutation();

    const switchPatientContext = useAuthStore((s) => s.switchPatientContext);
    const activePatientId = useAuthStore((s) => s.activePatientId);
    const isManaging = useAuthStore((s) => s.isManaging);
    const storeUserEmail = useAuthStore((s) => s.user?.email);
    const profile = useProfileQuery();
    const userEmail = (profile.data?.email ?? storeUserEmail ?? "").toLowerCase();

    const [inviteSheetVisible, setInviteSheetVisible] = useState(false);
    const contextColors = contextColorsQuery.data ?? {};

    useFocusEffect(
        useCallback(() => {
            managedQuery.refetch();
            managersQuery.refetch();
            void contextColorsQuery.refetch();
        }, []),
    );

    const managed = managedQuery.data ?? [];
    const managers = managersQuery.data ?? [];

    const activeDelegations = managed.filter((d) => d.status === "ACTIVE");
    const activeManagers = managers.filter((m) => m.status === "ACTIVE");
    const pendingItems = [
        ...managed.filter((d) => d.status === "PENDING"),
        ...managers.filter((m) => m.status === "PENDING"),
    ];
    const pendingInbound = pendingItems.filter((d) => isDelegationInbound(d, userEmail));
    const pendingOutbound = pendingItems.filter((d) => !isDelegationInbound(d, userEmail));

    const isLoading = managedQuery.isLoading || managersQuery.isLoading;

    const handleSwitchContext = useCallback(
        (patientId: string) => {
            switchPatientContext(patientId);
            navigation.navigate("MainTabs");
        },
        [switchPatientContext, navigation],
    );

    const handleColorsUpdate = useCallback(
        (updated: DelegationContextColors) => {
            updateColors.mutate(updated);
        },
        [updateColors],
    );

    const handleInviteSelect = useCallback(
        (relationship: DelegationRelationship) => {
            navigation.navigate("DependientesInvite", { relationship, backTitle: "Dependientes" });
        },
        [navigation],
    );

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    style={[styles.inviteBtn, { backgroundColor: palette.brand[500] }]}
                    onPress={() => setInviteSheetVisible(true)}
                    accessibilityLabel="Invitar"
                    accessibilityRole="button"
                >
                    <UserPlus size={18} color="#fff" />
                    <Text style={styles.inviteBtnText}>Invitar</Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation, styles.inviteBtn, styles.inviteBtnText]);

    if (isLoading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: t.surface.bg }} edges={["bottom"]}>
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <ActivityIndicator size="large" color={palette.brand[500]} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: t.surface.bg }} edges={["bottom"]}>
            <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: spacing[10] }}>
                {/* "Mi cuenta" row — only when managing */}
                {isManaging && (
                    <TouchableOpacity
                        style={[styles.myAccountRow, { backgroundColor: t.surface.bgCard, borderColor: t.border.light }]}
                        onPress={() => {
                            switchPatientContext(null);
                            navigation.navigate("MainTabs");
                        }}
                        accessibilityLabel="Volver a mi cuenta"
                        accessibilityRole="button"
                    >
                        <Text style={[styles.myAccountText, { color: t.brand.fg }]}>
                            ← Volver a mi cuenta
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Section: Personas que gestiono */}
                <SectionHeader title="Personas que gestiono" />
                {activeDelegations.length === 0 ? (
                    <EmptyState message="Todavía no gestionas la cuenta de nadie." theme={t} />
                ) : (
                    activeDelegations.map((d, idx) => (
                        <ManagedPatientCard
                            key={d.id}
                            delegation={d}
                            contextColors={contextColors}
                            colorIndex={idx}
                            isActive={activePatientId === (d.dependentUserId ?? d.id)}
                            onSwitchContext={handleSwitchContext}
                            onColorsUpdate={handleColorsUpdate}
                        />
                    ))
                )}

                {/* Section: Quién gestiona mi cuenta */}
                <SectionHeader title="Quién gestiona mi cuenta" />
                {activeManagers.length === 0 ? (
                    <EmptyState message="Nadie gestiona tu cuenta todavía." theme={t} />
                ) : (
                    activeManagers.map((m) => <ManagerCard key={m.id} manager={m} />)
                )}

                {/* Section: Solicitudes pendientes */}
                <SectionHeader title="Solicitudes pendientes" />
                {pendingInbound.length === 0 && pendingOutbound.length === 0 ? (
                    <EmptyState message="No tienes invitaciones pendientes." theme={t} />
                ) : (
                    <>
                        {pendingInbound.map((item) => (
                            <DelegationRequestCard key={item.id} delegation={item} />
                        ))}
                        {pendingOutbound.map((item) => (
                            <DelegationPendingOutboundCard key={item.id} delegation={item} />
                        ))}
                    </>
                )}
            </ScrollView>

            <DelegationInviteModeSheet
                visible={inviteSheetVisible}
                onClose={() => setInviteSheetVisible(false)}
                onSelect={handleInviteSelect}
            />
        </SafeAreaView>
    );
}

function SectionHeader({ title }: { title: string }) {
    const t = useAppTheme();
    return (
        <Text
            style={{
                fontSize: fontSize.sm,
                fontWeight: fontWeight.semibold,
                color: t.text.secondary,
                textTransform: "uppercase",
                letterSpacing: 0.6,
                marginTop: spacing[4],
                marginBottom: spacing[2],
            }}
        >
            {title}
        </Text>
    );
}

function EmptyState({ message, theme }: { message: string; theme: ReturnType<typeof useAppTheme> }) {
    return (
        <View
            style={{
                padding: spacing[4],
                borderRadius: radii.md,
                backgroundColor: theme.surface.bgCard,
                marginBottom: spacing[2],
                borderWidth: 1,
                borderColor: theme.border.light,
                borderStyle: "dashed",
            }}
        >
            <Text style={{ color: theme.text.muted, fontSize: fontSize.sm, textAlign: "center" }}>
                {message}
            </Text>
        </View>
    );
}

function makeStyles() {
    return StyleSheet.create({
        inviteBtn: {
            flexDirection: "row",
            alignItems: "center",
            gap: spacing[1],
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[2],
            borderRadius: radii.sm,
            marginRight: spacing[2],
        },
        inviteBtnText: {
            color: "#fff",
            fontSize: fontSize.sm,
            fontWeight: fontWeight.semibold,
        },
        myAccountRow: {
            padding: spacing[3],
            borderRadius: radii.md,
            borderWidth: 1,
            marginBottom: spacing[3],
            alignItems: "center",
        },
        myAccountText: {
            fontSize: fontSize.base,
            fontWeight: fontWeight.semibold,
        },
    });
}
