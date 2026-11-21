import Svg, { Circle, Path } from "react-native-svg";
import type { MoodEnum } from "@helu/api";
import { semanticDark, semanticLight, useAppTheme } from "@helu/ui";
import { MOOD_CONFIG } from "./moodConfig";

export interface MoodFaceProps {
    mood: MoodEnum;
    size?: number;
}

/** Mood fill color for the current theme (faces and mood bars share it). */
export function useMoodColor(mood: MoodEnum): string {
    const { mode } = useAppTheme();
    const tokens = mode === "dark" ? semanticDark : semanticLight;
    return tokens[MOOD_CONFIG[mood].colorKey];
}

/**
 * Drawn mood face (mockup `kit.js` · `mood()`): a colored disc with the same dark eyes and a mouth
 * that goes from a frown (Muy mal) to a wide smile (Excelente). The features stay dark in both
 * themes so the face reads the same on any surface. Decorative: callers render the label.
 */
export function MoodFace({ mood, size = 44 }: MoodFaceProps) {
    const fill = useMoodColor(mood);
    const ink = semanticLight["text-primary"];
    const c = MOOD_CONFIG[mood].curve;
    const mouth = `M13 ${27 - c / 2} Q20 ${27 + c} 27 ${27 - c / 2}`;

    return (
        <Svg width={size} height={size} viewBox="0 0 40 40" accessible={false}>
            <Circle cx={20} cy={20} r={18} fill={fill} />
            <Circle cx={14} cy={17} r={2.4} fill={ink} />
            <Circle cx={26} cy={17} r={2.4} fill={ink} />
            <Path d={mouth} stroke={ink} strokeWidth={2.6} fill="none" strokeLinecap="round" />
        </Svg>
    );
}
