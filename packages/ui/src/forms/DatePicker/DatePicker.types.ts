export interface DatePickerProps {
  label?: string;
  /** ISO date string "YYYY-MM-DD" */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  /** ISO date string "YYYY-MM-DD" */
  minDate?: string;
  /** ISO date string "YYYY-MM-DD" */
  maxDate?: string;
  id?: string;
}
