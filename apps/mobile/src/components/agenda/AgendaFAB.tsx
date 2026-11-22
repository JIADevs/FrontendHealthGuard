import { Fab } from "../Fab";

interface AgendaFABProps {
  onPress: () => void;
}

export function AgendaFAB({ onPress }: AgendaFABProps) {
  return <Fab onPress={onPress} accessibilityLabel="Agregar a agenda" />;
}
