import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui';
import { changePassword } from '@/api/users.service';
import { cn } from '@/utils/cn';

/** Focuses an element and centers it, so the sticky site header never hides the field with the error. */
const focusVisible = (element: HTMLElement | null | undefined) => {
  if (!element) return;
  element.focus({ preventScroll: true });
  element.scrollIntoView({ block: 'center', behavior: 'smooth' });
};


type FieldName = 'current_password' | 'new_password' | 'confirm_password';
type FieldErrors = Partial<Record<FieldName, string>>;

const FIELD_ORDER: FieldName[] = ['current_password', 'new_password', 'confirm_password'];
const MIN_PASSWORD_LENGTH = 8;
const EMPTY_FORM: Record<FieldName, string> = {
  current_password: '',
  new_password: '',
  confirm_password: '',
};

interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
    details?: { field?: string; message?: string }[];
  };
}

/** Same rule the API enforces for registration and password changes, checked before sending. */
const validate = (form: Record<FieldName, string>): FieldErrors => {
  const errors: FieldErrors = {};
  if (!form.current_password) {
    errors.current_password = 'La contraseña actual es obligatoria';
  }
  if (form.new_password.length < MIN_PASSWORD_LENGTH) {
    errors.new_password = `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`;
  }
  if (!form.confirm_password) {
    errors.confirm_password = 'Confirma la nueva contraseña';
  } else if (form.confirm_password !== form.new_password) {
    errors.confirm_password = 'Las contraseñas no coinciden';
  }
  return errors;
};

/** Maps an API error to the field it belongs to, or to a general message. */
const toFormError = (error: unknown): { fields: FieldErrors; general?: string } => {
  if (!axios.isAxiosError<ApiErrorBody>(error) || !error.response) {
    return { fields: {}, general: 'No se pudo conectar con el servidor. Inténtalo de nuevo.' };
  }
  const apiError = error.response.data?.error;
  const message = apiError?.message || 'No se pudo cambiar la contraseña. Inténtalo de nuevo.';

  if (apiError?.code === 'INVALID_PASSWORD') {
    return { fields: { current_password: message } };
  }
  if (apiError?.code === 'VALIDATION_ERROR' && apiError.details?.length) {
    const fields: FieldErrors = {};
    for (const detail of apiError.details) {
      const field = FIELD_ORDER.find((name) => name === detail.field);
      if (field && detail.message && !fields[field]) fields[field] = detail.message;
    }
    if (Object.keys(fields).length > 0) return { fields };
  }
  return { fields: {}, general: message };
};

interface PasswordFieldProps {
  name: FieldName;
  label: string;
  /** Noun used in the show/hide button name, e.g. "contraseña actual" */
  toggleName: string;
  value: string;
  autoComplete: string;
  helperText?: string;
  error?: string;
  inputRef: (element: HTMLInputElement | null) => void;
  onChange: (value: string) => void;
}

const PasswordField: React.FC<PasswordFieldProps> = ({
  name,
  label,
  toggleName,
  value,
  autoComplete,
  helperText,
  error,
  inputRef,
  onChange,
}) => {
  const [visible, setVisible] = useState(false);
  const inputId = `change-password-${name}`;
  const helperId = `${inputId}-help`;
  const errorId = `${inputId}-error`;
  const describedBy = [helperText ? helperId : null, error ? errorId : null].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
        {label}
      </label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-tertiary" aria-hidden="true" />
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          placeholder="••••••••"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'min-h-[44px] w-full rounded-md border bg-surface py-2.5 pl-10 pr-12 text-text-primary',
            'placeholder:text-text-tertiary transition-all duration-300',
            'focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary',
            error ? 'border-red-500 focus:ring-red-500' : 'border-surface-lighter'
          )}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? `Ocultar ${toggleName}` : `Mostrar ${toggleName}`}
          aria-pressed={visible}
          className={cn(
            'absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-md',
            'text-text-tertiary transition-colors hover:text-text-primary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
          )}
        >
          {visible ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>
      {helperText && (
        <p id={helperId} className="text-sm text-text-tertiary">
          {helperText}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};

export const ChangePasswordForm: React.FC = () => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSending, setIsSending] = useState(false);
  // Bumped on each failed submit so focus moves to the first error even when the same field fails twice
  const [focusRequest, setFocusRequest] = useState(0);

  const inputRefs = useRef<Partial<Record<FieldName, HTMLInputElement | null>>>({});
  const generalErrorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusRequest === 0) return;
    const firstInvalid = FIELD_ORDER.find((name) => errors[name]);
    if (firstInvalid) {
      focusVisible(inputRefs.current[firstInvalid]);
    } else {
      focusVisible(generalErrorRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRequest]);

  const handleChange = (name: FieldName, value: string) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setGeneralError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSending) return;

    setSuccess(false);
    setGeneralError(null);

    const clientErrors = validate(form);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      setFocusRequest((n) => n + 1);
      return;
    }

    setErrors({});
    setIsSending(true);
    try {
      await changePassword(form);
      setForm(EMPTY_FORM);
      setSuccess(true);
    } catch (error) {
      const { fields, general } = toFormError(error);
      setErrors(fields);
      setGeneralError(general ?? null);
      setFocusRequest((n) => n + 1);
    } finally {
      setIsSending(false);
    }
  };

  const fieldProps = (name: FieldName) => ({
    name,
    value: form[name],
    error: errors[name],
    inputRef: (element: HTMLInputElement | null) => {
      inputRefs.current[name] = element;
    },
    onChange: (value: string) => handleChange(name, value),
  });

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-lg space-y-6" aria-busy={isSending}>
      <p className="text-sm text-text-secondary">
        Al cambiar tu contraseña se cerrará la sesión en tus otros dispositivos.
      </p>

      {generalError && (
        <div
          ref={generalErrorRef}
          tabIndex={-1}
          role="alert"
          className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          {generalError}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-md border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-500"
        >
          Contraseña actualizada correctamente.
        </div>
      )}

      <PasswordField
        {...fieldProps('current_password')}
        label="Contraseña actual"
        toggleName="contraseña actual"
        autoComplete="current-password"
      />
      <PasswordField
        {...fieldProps('new_password')}
        label="Nueva contraseña"
        toggleName="nueva contraseña"
        autoComplete="new-password"
        helperText={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
      />
      <PasswordField
        {...fieldProps('confirm_password')}
        label="Confirmar nueva contraseña"
        toggleName="confirmación de la nueva contraseña"
        autoComplete="new-password"
      />

      <Button type="submit" size="lg" isLoading={isSending} className="min-h-[44px] w-full sm:w-auto">
        Cambiar contraseña
      </Button>
    </form>
  );
};
