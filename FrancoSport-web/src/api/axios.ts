/**
 * Axios Configuration
 * Franco Sport E-Commerce
 *
 * Configuración centralizada de Axios con interceptors
 * para manejo de autenticación, errores y logging
 */

import axios, { AxiosError } from 'axios';
import type {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosRequestHeaders,
} from 'axios';
import { API_CONFIG, STORAGE_KEYS } from '@/constants/config';
import type { ApiResponse, ApiError } from '@/types';

// ===== CREAR INSTANCIA DE AXIOS =====

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ===== REQUEST INTERCEPTOR =====
// Usamos InternalAxiosRequestConfig para cumplir con la firma interna de Axios
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    // Agregar token JWT si existe
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      // Asegurar que headers exista y tenga el tipo esperado
      if (!config.headers) {
        config.headers = {} as AxiosRequestHeaders;
      }
      // Asignar Authorization de forma segura
      (config.headers as AxiosRequestHeaders)['Authorization'] = `Bearer ${token}`;
    }

    // Log de request en desarrollo
    if (import.meta.env.DEV) {
      console.log('📤 Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        // data puede no existir en todas las configuraciones
        data: (config as any).data,
      });
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// ===== RESPONSE INTERCEPTOR =====

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // Log de response en desarrollo
    if (import.meta.env.DEV) {
      console.log('📥 Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }

    return response;
  },
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Log de error (excepto 404)
    if (error.response?.status !== 404) {
      console.error('❌ Response Error:', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.message,
        data: error.response?.data,
      });
    }

    // Manejar errores específicos
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Si es error de login, dejar que el componente lo maneje
          if (originalRequest?.url?.includes('/auth/login')) {
            return Promise.reject(error);
          }

          // Token expirado o inválido
          if (originalRequest && !originalRequest._retry) {
            if (isRefreshing) {
              return new Promise(function (resolve, reject) {
                failedQueue.push({ resolve, reject });
              })
                .then((token) => {
                  if (originalRequest.headers) {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                  }
                  return axiosInstance(originalRequest);
                })
                .catch((err) => {
                  return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
              const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN); // Asumimos que guardamos esto

              if (!refreshToken) {
                throw new Error('No refresh token available');
              }

              const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh`, {
                refreshToken,
              });

              const { token } = response.data.data;

              localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);

              axiosInstance.defaults.headers.common['Authorization'] = 'Bearer ' + token;
              if (originalRequest.headers) {
                originalRequest.headers['Authorization'] = 'Bearer ' + token;
              }

              processQueue(null, token);
              return axiosInstance(originalRequest);
            } catch (err) {
              processQueue(err, null);
              handleUnauthorized();
              return Promise.reject(err);
            } finally {
              isRefreshing = false;
            }
          } else {
            handleUnauthorized();
          }
          break;

        case 403:
          // No tiene permisos
          console.warn('⛔ Forbidden:', (data as any).message);
          break;

        case 404:
          // Recurso no encontrado - Silently handle or debug log only
          // console.warn('🔍 Not Found:', (data as any).message);
          break;

        case 422:
          // Errores de validación
          console.warn('⚠️ Validation Error:', (data as any).error);
          break;

        case 429:
          // Too many requests
          console.warn('🚫 Rate Limited:', (data as any).message);
          break;

        case 500:
        case 503:
          // Error del servidor
          console.error('💥 Server Error:', (data as any).message);
          break;

        default:
          console.error('❓ Unknown Error:', error.message);
      }
    } else if (error.request) {
      // Request hecho pero no hay respuesta
      console.error('🌐 Network Error: No response received');
    } else {
      // Error al configurar el request
      console.error('⚙️ Setup Error:', error.message);
    }

    return Promise.reject(error);
  }
);

// ===== HANDLE UNAUTHORIZED (401) =====

function handleUnauthorized() {
  console.warn('🔒 Unauthorized: Redirecting to login...');

  // Limpiar localStorage
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN); // Limpiar refresh token también
  localStorage.removeItem(STORAGE_KEYS.USER_DATA);

  // Redirigir a login (solo si no estamos ya ahí)
  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login';
  }
}

// ===== HELPER FUNCTIONS =====

/**
 * Extrae el mensaje de error de la respuesta
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiError = (error.response?.data as any)?.error as ApiError | undefined;
    return apiError?.message || error.message || 'Ha ocurrido un error';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Ha ocurrido un error desconocido';
}

/**
 * Verifica si hay conexión a internet
 */
export function isNetworkError(error: unknown): boolean {
  return axios.isAxiosError(error) && !error.response;
}

/**
 * Verifica si es un error de autenticación
 */
export function isAuthError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return error.response?.status === 401;
  }
  return false;
}

/**
 * Verifica si es un error de validación
 */
export function isValidationError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return error.response?.status === 422;
  }
  return false;
}

// ===== EXPORT =====

export default axiosInstance;
export { axiosInstance as api };
