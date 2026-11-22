import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { Skeleton, nativeFont, radii, useAppTheme } from "@helu/ui";

/**
 * Pieces for skeletons that copy the real screen (movimiento-interacciones.md §6c): what is fixed
 * (field labels, card titles, header actions) is real text or a placeholder of the same size;
 * only what comes from the server is a gray block.
 */

/** A form field while it loads: the real label (Nunito 800 13) and a block of the input's height. */
export function SkeletonField({ label, height = 48 }: { label: string; height?: number }) {
  const t = useAppTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 13, fontFamily: nativeFont("heading", 800), color: t.text.primary }}>{label}</Text>
      <Skeleton height={height} radius={radii.input} />
    </View>
  );
}

/** Two fields side by side (date and time). */
export function SkeletonFieldRow({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: "row", gap: 12 }}>{children}</View>;
}

/** A row of option chips (reminders, frequency). */
export function SkeletonChips({ widths = [64, 84, 72] }: { widths?: number[] }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {widths.map((w, i) => (
        <Skeleton key={i} width={w} height={44} radius={12} />
      ))}
    </View>
  );
}

/** The 44 px icon button a detail header shows on the right, so it does not pop in with the data. */
export function SkeletonHeaderAction() {
  return <Skeleton width={44} height={44} radius={22} />;
}
