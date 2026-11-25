export interface DocumentUploadOverrides {
    title?: string;
    typeId?: string;
    subtypeIds?: string[];
    specialtyIds?: string[];
    tagValueIds?: string[];
    treatmentId?: string | null;
    silent?: boolean;
    skipSuccessToast?: boolean;
}
