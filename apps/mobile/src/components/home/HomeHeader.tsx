import { View } from "react-native";
import { Bell } from "lucide-react-native";
import { IconButton, spacing, useAppTheme } from "@helu/ui";
import { HeluWordmark } from "../brand";

/** Encabezado v2 (kit `mtop`): solo el logo y la campana. La racha y el nivel viven en sus tarjetas. */
export function HomeHeader({ unread, onNotifications }: { unread: number; onNotifications: () => void }) {
  const t = useAppTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[2], minHeight: 44 }}>
      <View style={{ flex: 1 }}>
        <HeluWordmark size={20} />
      </View>
      <IconButton
        icon={<Bell size={18} color={t.text.secondary} />}
        accessibilityLabel={unread > 0 ? `Notificaciones, ${unread} sin leer` : "Notificaciones"}
        badge={unread > 0}
        onPress={onNotifications}
      />
    </View>
  );
}
