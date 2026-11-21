import axios from 'axios';
import { validationDetails } from '@/api/axios';
import type { ApiError } from '@/types';

/**
 * Message sent by the API in `error.message` (the field messages of a validation error when it has them),
 * or `fallback` when there is none
 */
export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError<{ error?: ApiError }>(error)) {
    const apiError = error.response?.data?.error;
    return validationDetails(apiError) || apiError?.message || fallback;
  }
  return fallback;
};
