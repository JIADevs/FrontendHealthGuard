export interface TimePickerProps {
  label?: string;
  /** Time string "HH:mm" (24-hour) */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
}
