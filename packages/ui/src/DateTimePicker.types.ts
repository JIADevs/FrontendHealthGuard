export interface DateTimePickerProps {
  label?: string;
  /** ISO string "YYYY-MM-DDTHH:mm" */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  /** ISO string "YYYY-MM-DDTHH:mm" */
  minDate?: string;
  /** ISO string "YYYY-MM-DDTHH:mm" */
  maxDate?: string;
  id?: string;
}
