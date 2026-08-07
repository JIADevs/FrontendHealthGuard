import { TextField } from "@helu/ui";

interface DocumentDescriptionFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function DocumentDescriptionField({
  value,
  onChange,
  disabled = false,
}: DocumentDescriptionFieldProps) {
  return (
    <TextField
      label="Descripción"
      value={value}
      onChange={onChange}
      placeholder="Notas opcionales sobre el documento"
      multiline
      numberOfLines={3}
      disabled={disabled}
      accessibilityLabel="Descripción del documento"
    />
  );
}
