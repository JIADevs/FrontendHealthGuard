import { useEffect } from "react";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMissionQuery, useUserProgressQuery } from "@helu/api";
import { useProfileQuery } from "@helu/api/hooks";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { MissionCelebration } from "../components/missions/MissionCelebration";
import { useManagingSomeone } from "../components/home/useManagingSomeone";
import { useMissionClosure } from "../lib/missionClosure";

function firstWord(name: string | null | undefined) {
  return name?.trim().split(/\s+/)[0] || null;
}

/**
 * Route only (modal, fade): the celebration of a mission the server just closed (RF-50). The detail
 * already holds the completed mission in cache, so it renders at once.
 */
export function MissionCelebrationScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { id } = useRoute<RouteProp<RootStackParamList, "MissionCelebration">>().params;
  const { data: mission } = useMissionQuery(id);
  const managing = useManagingSomeone();
  // In management mode the profile is the dependent's (X-Patient-Context): «¡Juan completó su misión!».
  const name = firstWord(useProfileQuery().data?.name);
  const setFollowUp = useMissionClosure((s) => s.setFollowUp);
  const setCelebrating = useMissionClosure((s) => s.setCelebrating);
  useEffect(() => {
    setCelebrating(id);
    return () => setCelebrating(null);
  }, [id, setCelebrating]);
  // The closure invalidated the progress: show streak, level and «Nueva insignia» once the server's
  // answer is in (celebrations wait for the server, MASTER §10). The preference can come from cache.
  const progress = useUserProgressQuery();
  const fresh = progress.isSuccess && !progress.isFetching ? progress.data : undefined;

  if (!mission) return null;
  return (
    <MissionCelebration
      mission={mission}
      managedName={managing ? name ?? "Tu familiar" : null}
      firstName={managing ? null : name}
      progress={fresh}
      celebrationsEnabled={progress.data?.celebrationsEnabled ?? true}
      onHome={() => {
        // v2.22: the follow-up opens over Inicio, after the celebration, never on top of it (RF-52).
        setFollowUp({ missionId: mission.id, type: mission.type, title: mission.title });
        navigation.popToTop();
        navigation.navigate("MainTabs", { screen: "Home" } as never);
      }}
      onDocuments={() => navigation.goBack()}
    />
  );
}
