import Svg, { Path } from "react-native-svg";
import { colors } from "@helu/ui";

/** Llama de racha (kit `flame()`), naranja con núcleo amarillo. */
export function Flame({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path
        fill={colors.orange[500]}
        d="M12 1.5c.6 3.2 2.6 4.9 4.3 6.9 1.6 1.9 2.7 3.8 2.7 6.4A7 7 0 0 1 12 21.8a7 7 0 0 1-7-7c0-2.6 1.2-4.6 2.6-6 .1 1.8.9 3.1 2.2 3.6C9.6 8.6 10.4 4.6 12 1.5z"
      />
      <Path
        fill={colors.amber[300]}
        d="M12 11c.4 1.8 1.6 2.6 2.4 3.6.6.8.9 1.5.9 2.4a3.3 3.3 0 0 1-6.6 0c0-1.4.7-2.4 1.5-3.1.2.8.6 1.3 1.1 1.5-.1-1.6.2-3.1.7-4.4z"
      />
    </Svg>
  );
}
