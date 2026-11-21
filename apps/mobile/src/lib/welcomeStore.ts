import { create } from "zustand";

/**
 * La Bienvenida se muestra una sola vez, justo después de «Crear cuenta». No se persiste:
 * si la app se cierra antes, la persona entra directo a Inicio, que tiene su propio primer uso.
 */
interface WelcomeState {
  pending: boolean;
  setPending: (pending: boolean) => void;
}

export const useWelcomeStore = create<WelcomeState>((set) => ({
  pending: false,
  setPending: (pending) => set({ pending }),
}));
