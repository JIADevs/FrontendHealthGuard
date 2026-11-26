import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { motion, spacing } from "@helu/ui";
import { MascotHint } from "../components/brand/MascotHint";

const KEY = "helu.swipe-hint-seen";

type Status = "unknown" | "unseen" | "showing" | "seen";

interface SwipeDiscoveryState {
  status: Status;
  /** The list that is teaching the gesture right now */
  owner: string | null;
  /** The first card already peeked: a remount of the list does not move it again */
  peeked: boolean;
  load: () => void;
  claim: (owner: string) => void;
  markPeeked: () => void;
  dismiss: () => void;
}

/**
 * «Descubrir» (movimiento-interacciones.md §4b, mockup module 14 · D1): the first time a list with
 * swipe actions shows cards, its first card peeks 44 px and the mascot says how to swipe. Once per
 * install, in whichever list comes first; the flag is saved as soon as it shows. The hint stays
 * until the person opens a row (in this app session); the card peeks only once.
 */
const useSwipeDiscoveryStore = create<SwipeDiscoveryState>((set, get) => ({
  status: "unknown",
  owner: null,
  peeked: false,
  load: () => {
    if (get().status !== "unknown") return;
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (get().status === "unknown") set({ status: v ? "seen" : "unseen" });
      })
      .catch(() => set({ status: "seen" }));
  },
  claim: (owner) => {
    if (get().status !== "unseen") return;
    set({ status: "showing", owner });
    AsyncStorage.setItem(KEY, "1").catch(() => undefined);
  },
  markPeeked: () => set({ peeked: true }),
  dismiss: () => {
    if (get().status === "showing") set({ status: "seen", owner: null });
  },
}));

/**
 * `ready`: the list shows at least one card. Returns whether this list peeks its first card, the
 * hint to render above the list, and `dismiss` for when a row opens.
 */
export function useSwipeDiscovery(owner: string, ready: boolean) {
  const { status, owner: current, peeked, load, claim, markPeeked, dismiss } = useSwipeDiscoveryStore();
  useEffect(load, [load]);
  useEffect(() => {
    if (ready && status === "unseen") claim(owner);
  }, [claim, owner, ready, status]);
  const mine = status === "showing" && current === owner;
  const peek = mine && !peeked;
  // The row starts its peek on this render; later mounts of the list just show the hint.
  useEffect(() => {
    if (peek) markPeeked();
  }, [markPeeked, peek]);

  const hint = mine ? (
    <Animated.View entering={FadeIn.duration(motion.base)} exiting={FadeOut.duration(motion.fast)} style={{ marginBottom: spacing[3] }}>
      <MascotHint pose="point" text="Desliza una tarjeta a la izquierda para ver sus acciones." />
    </Animated.View>
  ) : undefined;

  return { peek, hint, dismiss };
}
