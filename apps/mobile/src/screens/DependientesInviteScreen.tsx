import { useState, useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCreateDelegationMutation } from "@helu/api/hooks";
import { palette, spacing, fontSize, fontWeight, radii, useAppTheme } from "@helu/ui";
import Toast from "react-native-toast-message";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "DependientesInvite">;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function DependientesInviteScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<Props["route"]>();
    const { relationship } = route.params;
    const t = useAppTheme();
    const styles = useMemo(() => makeStyles(), []);

    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState<string | null>(null);

    const createMutation = useCreateDelegationMutation();

    const isDependent = relationship === "I_WANT_TO_MANAGE_THEM";
    const title = isDependent ? "Invitar dependiente" : "Invitar cuidador";
    const placeholder = isDependent
        ? "Email del dependiente"
        : "Email del cuidador";
    const description = isDependent
        ? "Ingresá el email de la persona cuya cuenta querés gestionar."
        : "Ingresá el email de la persona que va a gestionar tu cuenta.";

    const validate = (): boolean => {
        if (!email.trim()) {
            setEmailError("El email es obligatorio");
            return false;
        }
        if (!EMAIL_REGEX.test(email.trim())) {
            setEmailError("El formato del email no es válido");
            return false;
        }
        setEmailError(null);
        return true;
    };

    const handleSubmit = () => {
        if (!validate()) return;

        createMutation.mutate(
            { email: email.trim(), relationship, permissions: "FULL_ACCESS" },
            {
                onSuccess: () => {
                    Toast.show({
                        type: "success",
                        text1: "Invitación enviada",
                        text2: `Se envió la invitación a ${email.trim()}`,
                    });
                    navigation.goBack();
                },
                onError: (error) => {
                    const apiError = error as { message?: string };
                    Toast.show({
                        type: "error",
                        text1: "Error al enviar",
                        text2: apiError.message ?? "Intentá de nuevo",
                    });
                },
            },
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: t.surface.bg }} edges={["bottom"]}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <ScrollView
                    contentContainerStyle={{ padding: spacing[4], flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={[styles.title, { color: t.text.primary }]}>{title}</Text>
                    <Text style={[styles.description, { color: t.text.secondary }]}>
                        {description}
                    </Text>

                    <View style={styles.fieldGroup}>
                        <Text style={[styles.label, { color: t.text.secondary }]}>
                            Email
                        </Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: t.surface.bgCard,
                                    borderColor: emailError ? palette.status.error[400] : t.border.default,
                                    color: t.text.primary,
                                },
                            ]}
                            value={email}
                            onChangeText={(v) => {
                                setEmail(v);
                                if (emailError) setEmailError(null);
                            }}
                            placeholder={placeholder}
                            placeholderTextColor={t.text.muted}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            autoComplete="email"
                            accessibilityLabel="Email de la invitación"
                        />
                        {emailError ? (
                            <Text style={[styles.fieldError, { color: palette.status.error[500] }]}>
                                {emailError}
                            </Text>
                        ) : null}
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.submitBtn,
                            { backgroundColor: palette.brand[500] },
                            createMutation.isPending && { opacity: 0.7 },
                        ]}
                        onPress={handleSubmit}
                        disabled={createMutation.isPending}
                        accessibilityLabel="Enviar invitación"
                        accessibilityRole="button"
                    >
                        {createMutation.isPending ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.submitBtnText}>Enviar invitación</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

function makeStyles() {
    return StyleSheet.create({
        title: {
            fontSize: fontSize["2xl"],
            fontWeight: fontWeight.bold,
            marginBottom: spacing[2],
        },
        description: {
            fontSize: fontSize.base,
            lineHeight: 22,
            marginBottom: spacing[6],
        },
        fieldGroup: {
            marginBottom: spacing[5],
        },
        label: {
            fontSize: fontSize.sm,
            fontWeight: fontWeight.medium,
            marginBottom: spacing[1],
        },
        input: {
            borderWidth: 1,
            borderRadius: radii.md,
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[3],
            fontSize: fontSize.base,
        },
        fieldError: {
            fontSize: fontSize.sm,
            marginTop: spacing[1],
        },
        submitBtn: {
            paddingVertical: spacing[4],
            borderRadius: radii.md,
            alignItems: "center",
            justifyContent: "center",
            marginTop: spacing[2],
        },
        submitBtnText: {
            color: "#fff",
            fontSize: fontSize.md,
            fontWeight: fontWeight.semibold,
        },
    });
}
