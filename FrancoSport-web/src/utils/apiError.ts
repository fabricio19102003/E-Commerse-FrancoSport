import axios from 'axios';

/**
 * Message sent by the API in `error.message`, or `fallback` when there is none
 */
export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError<{ error?: { message?: string } }>(error)) {
    return error.response?.data?.error?.message || fallback;
  }
  return fallback;
};
