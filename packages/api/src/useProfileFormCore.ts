/**
 * useProfileFormCore — lógica de formulario de perfil, agnóstica de plataforma.
 *
 * Maneja todo el estado de los campos, la población inicial desde la API y el guardado.
 * Cada plataforma provee un objeto `adapters` con los callbacks de feedback (toast,
 * navegación) específicos de su entorno.
 *
 * Uso:
 *   Web:    useProfileFormCore({ adapters: { onSuccess: () => sileo.success(...), onError: ... } })
 *   Mobile: useProfileFormCore({ adapters: { onSuccess: () => { Toast.show(...); nav.goBack() }, onError: ... } })
 */

import { useState, useEffect } from "react";
import { useProfileQuery, useUpdateProfileMutation } from "./reactQueryHooks";
import { isApiError } from "./errors";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProfileFormState {
  name: string;
  documentId: string;
  birthDate: string;
  gender: string;
  phone: string;
  address: string;
  bloodType: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  /** true while the update mutation is in flight */
  saving: boolean;
  /** true while the profile query is loading for the first time */
  loading: boolean;
}

export interface ProfileFormActions {
  setName: (v: string) => void;
  setDocumentId: (v: string) => void;
  setBirthDate: (v: string) => void;
  setGender: (v: string) => void;
  setPhone: (v: string) => void;
  setAddress: (v: string) => void;
  setBloodType: (v: string) => void;
  setEmergencyContactName: (v: string) => void;
  setEmergencyContactPhone: (v: string) => void;
  handleSave: () => void;
}

export interface ProfileFormAdapters {
  /** Called after the profile is successfully updated. */
  onSuccess: () => void;
  /** Called when the update fails; receives a human-readable title and message. */
  onError: (title: string, message: string) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProfileFormCore(adapters: ProfileFormAdapters): ProfileFormState & ProfileFormActions {
  const profile = useProfileQuery();
  const updateMut = useUpdateProfileMutation();

  const [name, setName] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  // Populate fields once the profile data is available
  useEffect(() => {
    if (!profile.data) return;
    const p = profile.data;
    setName(p.name ?? "");
    setDocumentId(p.documentId ?? "");
    setBirthDate(p.birthDate ?? "");
    setGender(p.gender ?? "");
    setPhone(p.phone ?? "");
    setAddress(p.address ?? "");
    setBloodType(p.bloodType ?? "");
    setEmergencyContactName(p.emergencyContactName ?? "");
    setEmergencyContactPhone(p.emergencyContactPhone ?? "");
  }, [profile.data]);

  function handleSave() {
    updateMut.mutate(
      {
        name: name || undefined,
        documentId: documentId || undefined,
        birthDate: birthDate || undefined,
        gender: gender || undefined,
        phone: phone || undefined,
        address: address || undefined,
        bloodType: bloodType || undefined,
        emergencyContactName: emergencyContactName || undefined,
        emergencyContactPhone: emergencyContactPhone || undefined,
      },
      {
        onSuccess: adapters.onSuccess,
        onError: (err) =>
          adapters.onError(
            "Error al guardar",
            isApiError(err) ? err.message : "No se pudo actualizar el perfil.",
          ),
      },
    );
  }

  return {
    name,
    documentId,
    birthDate,
    gender,
    phone,
    address,
    bloodType,
    emergencyContactName,
    emergencyContactPhone,
    saving: updateMut.isPending,
    loading: profile.isLoading,

    setName,
    setDocumentId,
    setBirthDate,
    setGender,
    setPhone,
    setAddress,
    setBloodType,
    setEmergencyContactName,
    setEmergencyContactPhone,
    handleSave,
  };
}
