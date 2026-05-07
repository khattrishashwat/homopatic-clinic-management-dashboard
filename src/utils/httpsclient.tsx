import axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse, 
  AxiosError, 
  InternalAxiosRequestConfig,
  CancelTokenSource,
  Canceler
} from "axios";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

// Custom types
interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
  statusCode?: number;
}

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: {
    startTime: Date;
  };
  _retry?: boolean;
}

interface ApiResponse<T = any> {
  data: T;
  message: string;
  success: boolean;
  statusCode: number;
}

// Configuration interface
interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
  withCredentials?: boolean;
}

class HttpClient {
  private instance: AxiosInstance;
  private cancelTokens: Map<string, CancelTokenSource> = new Map();

  constructor(config: HttpClientConfig = {}) {
    this.instance = axios.create({
      baseURL: config.baseURL || `${import.meta.env.VITE_API_BASE_URL}/api`,
      timeout: config.timeout || 30000,
      withCredentials: config.withCredentials || false,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config): CustomAxiosRequestConfig => {
        const token = localStorage.getItem("token");
        if (token && config.headers) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }
        config.metadata = { startTime: new Date() };
        return config as CustomAxiosRequestConfig;
      },
      (error: AxiosError) => Promise.reject(error)
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response: AxiosResponse): AxiosResponse => {
        const endTime = new Date();
        const startTime = (response.config as CustomAxiosRequestConfig).metadata?.startTime;
        const responseTime = startTime ? endTime.getTime() - startTime.getTime() : null;

        if (responseTime !== null && process.env.NODE_ENV === "development") {
          console.log(`📡 ${response.config.method?.toUpperCase()} ${response.config.url} - ${responseTime}ms`);
        }

        return response;
      },
      (error: AxiosError) => this.handleError(error)
    );
  }

  private handleError(error: AxiosError): Promise<never> {
    const status = error.response?.status;
    const errorData = error.response?.data as ApiErrorResponse;
    const message = errorData?.message || "An error occurred";
    const originalRequest = error.config as CustomAxiosRequestConfig;

    // Log error in development
    if (process.env.NODE_ENV === "development") {
      console.error("🚨 API Error:", {
        status,
        message,
        url: originalRequest?.url,
        method: originalRequest?.method,
        data: errorData?.errors,
      });
    }

    switch (status) {
      case 401:
        // Only show session expired popup for endpoints other than login
        if (!originalRequest?._retry && !originalRequest?.url?.includes("auth/login")) {
          originalRequest._retry = true;
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = "/admin-panel/login";
        }
        break;

      case 403:
        toast.error("Access Denied: " + message);
        break;

      case 404:
        toast.warn(message);
        break;

      case 422:
        // Validation errors
        if (errorData?.errors) {
          const validationMessages = Object.values(errorData.errors).flat();
          validationMessages.forEach((msg: string) => toast.error(msg));
        } else {
          toast.error(message);
        }
        break;

      case 429:
        toast.warn("Too Many Requests: Please wait before trying again");
        break;

      case 500:
        toast.error("Server Error: " + message);
        break;

      default:
        if (error.code === "ECONNABORTED") {
          toast.error("Request timeout. Please try again.");
        } else if (error.message === "Network Error") {
          toast.error("Network error. Please check your connection.");
        } else {
          toast.error(message);
        }
    }

    return Promise.reject(error);
  }

  // Generic GET request
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  // Generic POST request
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  // Generic PUT request
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  // Generic PATCH request
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  // Generic DELETE request
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  // File upload with progress
  async upload<T = any>(
    url: string,
    file: File,
    onProgress?: (percentage: number) => void,
    additionalData?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append("file", file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const response = await this.instance.post<ApiResponse<T>>(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent: ProgressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentage);
        }
      },
    });

    return response.data;
  }

  // Cancel ongoing request
  cancelRequest(requestKey: string): void {
    const cancelToken = this.cancelTokens.get(requestKey);
    if (cancelToken) {
      cancelToken.cancel(`Request ${requestKey} cancelled`);
      this.cancelTokens.delete(requestKey);
    }
  }

  // Create cancelable request
  createCancelableRequest(requestKey: string): CancelTokenSource {
    const source = axios.CancelToken.source();
    this.cancelTokens.set(requestKey, source);
    return source;
  }

  // Get the raw axios instance for advanced use cases
  getInstance(): AxiosInstance {
    return this.instance;
  }
}

// Create and export singleton instance
const httpClient = new HttpClient();

// Export types
export type { ApiResponse, ApiErrorResponse, HttpClientConfig };
export default httpClient;