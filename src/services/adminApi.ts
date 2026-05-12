import httpClient, { type AdminUser, type ApiResponse, type PaginationMeta } from "@/utils/httpsclient";

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface ListResult<T> {
  data: T[];
  pagination?: PaginationMeta;
}

export interface SlotRef {
  _id: string;
  startTime: string;
  endTime: string;
  available?: boolean;
}

export interface AppointmentDto {
  _id: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  patient?: PatientDto | string;
  slot?: SlotRef;
  status: "pending" | "confirmed" | "approved" | "rejected" | "cancelled" | "completed" | "missed" | "rescheduled";
  consultation_type?: "online" | "offline";
  payment_status?: "pending" | "paid" | "failed";
  reason?: string;
  notes?: string;
  createdAt?: string;
}

export interface PatientDto {
  _id: string;
  patientId: string;
  name: string;
  email: string;
  phone: string;
  gender?: "male" | "female" | "other";
  dob?: string;
  address?: string | { street?: string; city?: string; state?: string; postal_code?: string; country?: string };
  family_group?: string;
  family_members?: PatientDto[];
  medical_history?: string[];
  notes?: string;
  created_at?: string;
}

export interface PrescriptionDto {
  _id: string;
  patient?: PatientDto;
  title?: string;
  medicines: { name: string; dosage: string; duration: string; notes?: string }[];
  notes?: string;
  created_at?: string;
}

export interface MedicalRecordDto {
  _id: string;
  patient?: PatientDto;
  title: string;
  description?: string;
  file_url: string;
  file_type?: string;
  record_date?: string;
  created_at?: string;
}

export interface PaymentDto {
  _id: string;
  patient?: PatientDto;
  amount: number;
  description?: string;
  customer_name?: string;
  payment_method?: string;
  status: "created" | "pending" | "captured" | "failed" | "refunded";
  created_at?: string;
}

export interface ProductDto {
  _id: string;
  name: string;
  slug: string;
  short_description?: string;
  description?: string;
  price: number;
  compare_price?: number;
  category?: string | CategoryDto;
  stock?: number;
  in_stock?: boolean;
  image?: string;
  image_alt?: string;
  gallery?: { url: string; alt: string }[];
  active?: boolean;
  featured?: boolean;
  sku?: string;
  attributes?: {
    shortDescription?: string;
    benefits?: string[];
    ingredients?: string[];
    usage?: string;
    faqs?: Array<{ q: string; a: string }>;
    featured?: boolean;
    recommended?: boolean;
    durationWeeks?: number;
  };
  average_rating?: number;
  total_reviews?: number;
  created_by?: { name: string; email: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderDto {
  _id: string;
  order_number: string;
  customer_name: string;
  items?: { product?: ProductDto; quantity: number; price: number }[];
  total: number;
  order_status: string;
  payment_status: string;
  created_at?: string;
}

export interface NotificationDto {
  _id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt?: string;
}

export interface BlogDto {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  category?: string | CategoryDto;
   featured_image?: string;
   featured_image_alt?: string;
   tags?: string[];
   author: string;
   author_bio?: string;
   published?: boolean;
   featured?: boolean;
   views?: number;
   published_at?: string;
   createdAt?: string;
   reading_time?: number;
  created_by?: { name: string; email: string };
}

export interface CategoryDto {
  _id: string;
  name: string;
  slug: string;
   description?: string;
   image?: string;
   image_alt?: string;
   active: boolean;
  type: "blog" | "product" | "both";
  createdAt?: string;
  updatedAt?: string;
}


export interface LoginResult {
  token: string;
  user: AdminUser;
}

const unwrapList = <T>(response: ApiResponse<T[] | { data?: T[]; pagination?: PaginationMeta }>): ListResult<T> => {
  if (Array.isArray(response.data)) {
    return { data: response.data, pagination: response.pagination };
  }

  return {
    data: response.data.data || [],
    pagination: response.data.pagination || response.pagination,
  };
};

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResult> => {
    const response = await httpClient.post<unknown>("/auth/login", { email, password }, { suppressToast: true });
    return { token: response.token || "", user: response.user as AdminUser };
  },
};

export const dashboardApi = {
  get: async () => (await httpClient.get<Record<string, number>>("/admin/dashboard")).data,
};

export const appointmentsApi = {
  list: async (params?: ListParams) => unwrapList<AppointmentDto>(await httpClient.get("/admin/appointments", { params })),
  updateStatus: async (id: string, status: string) =>
    (await httpClient.patch<AppointmentDto>(`/admin/appointments/${id}/status`, { status })).data,
  complete: async (id: string) => (await httpClient.patch<AppointmentDto>(`/admin/appointments/${id}/complete`)).data,
  missed: async (id: string) => (await httpClient.patch<AppointmentDto>(`/admin/appointments/${id}/missed`)).data,
};

export const slotsApi = {
  list: async () => (await httpClient.get<SlotRef[]>("/admin/slots")).data,
  update: async (id: string, data: Partial<SlotRef>) => (await httpClient.patch<SlotRef>(`/admin/slots/${id}`, data)).data,
  generateWeekends: async () => (await httpClient.post<unknown>("/admin/slots/generate-weekends", { daysAhead: 30, intervalMinutes: 30 })).data,
};

export const patientsApi = {
  list: async (params?: ListParams) => unwrapList<PatientDto>(await httpClient.get("/admin/patients", { params })),
  create: async (data: Partial<PatientDto>) => (await httpClient.post<PatientDto>("/admin/patients", data)).data,
  update: async (id: string, data: Partial<PatientDto>) => (await httpClient.patch<PatientDto>(`/admin/patients/${id}`, data)).data,
  delete: async (id: string) => (await httpClient.delete(`/admin/patients/${id}`)).data,
  profile: async (id: string) => (await httpClient.get<unknown>(`/admin/patients/${id}/profile`)).data,
};

export const prescriptionsApi = {
  list: async (params?: ListParams) => unwrapList<PrescriptionDto>(await httpClient.get("/admin/prescriptions", { params })),
  create: async (data: unknown) => (await httpClient.post<PrescriptionDto>("/admin/prescriptions", data)).data,
  update: async (id: string, data: unknown) => (await httpClient.patch<PrescriptionDto>(`/admin/prescriptions/${id}`, data)).data,
  delete: async (id: string) => (await httpClient.delete(`/admin/prescriptions/${id}`)).data,
};

export const medicalRecordsApi = {
  list: async (params?: ListParams) => unwrapList<MedicalRecordDto>(await httpClient.get("/admin/medical-records", { params })),
  upload: async (data: FormData) => (await httpClient.post<MedicalRecordDto>("/admin/medical-records", data)).data,
  delete: async (id: string) => (await httpClient.delete(`/admin/medical-records/${id}`)).data,
};

export const paymentsApi = {
  list: async (params?: ListParams) => unwrapList<PaymentDto>(await httpClient.get("/admin/payments", { params })),
};

export const productsApi = {
  list: async (params?: ListParams) => unwrapList<ProductDto>(await httpClient.get("/admin/products", { params })),
  create: async (data: Partial<ProductDto> | FormData) => (await httpClient.post<ProductDto>("/admin/products", data)).data,
  getbyId: async (id: string) => (await httpClient.get<ProductDto>(`/admin/products/${id}`)).data,
  update: async (id: string, data: Partial<ProductDto> | FormData) => (await httpClient.patch<ProductDto>(`/admin/products/${id}`, data)).data,
  delete: async (id: string) => (await httpClient.delete(`/admin/products/${id}`)).data,
  uploadImage: async (id: string, formData: FormData) => (await httpClient.patch<ProductDto>(`/admin/products/${id}`, formData)).data,
};

export const ordersApi = {
  list: async (params?: ListParams) => unwrapList<OrderDto>(await httpClient.get("/admin/orders", { params })),
  updateStatus: async (id: string, status: string) => (await httpClient.patch<OrderDto>(`/admin/orders/${id}/status`, { status })).data,
};

// In your adminApi.ts or notifications service file

export const notificationsApi = {
  list: (params?: { limit?: number; page?: number }) => 
    httpClient.get<ApiResponse<NotificationDto[]>>("/admin/notifications", { params }),
  
  get: (id: string) => 
    httpClient.get<ApiResponse<NotificationDto>>(`/admin/notifications/${id}`),
  
  create: (data: { title: string; message: string; type: string }) => 
    httpClient.post<NotificationDto>("/admin/notifications", data),
  
  markAsRead: (id: string) => 
    httpClient.patch<NotificationDto>(`/admin/notifications/${id}/read`),
  
  sendManual: (data: { title: string; message: string; type: string }) => 
    httpClient.post<{ success: boolean; message: string }>("/admin/notifications", data),
  
  delete: (id: string) => 
    httpClient.delete<{ message: string }>(`/admin/notifications/${id}`),
};

export const blogsApi = {
 list: async () => (await httpClient.get<BlogDto[]>("/admin/blogs")).data,
  create: async (data: Partial<BlogDto> | FormData) => (await httpClient.post<BlogDto>("/admin/blogs", data)).data,
  update: async (id: string, data: Partial<BlogDto> | FormData) => (await httpClient.patch<BlogDto>(`/admin/blogs/${id}`, data)).data,
  delete: async (id: string) => (await httpClient.delete(`/admin/blogs/${id}`)).data,
};

export const categoriesApi = {
  list: async () => (await httpClient.get<CategoryDto[]>("/admin/categories")).data,
  create: async (data: Partial<CategoryDto> | FormData) => (await httpClient.post<CategoryDto>("/admin/categories", data)).data,
  update: async (id: string, data: Partial<CategoryDto> | FormData) => (await httpClient.patch<CategoryDto>(`/admin/categories/${id}`, data)).data,
  delete: async (id: string) => (await httpClient.delete(`/admin/categories/${id}`)).data,
};

export const settingsApi = {
  getAppointment: async () => (await httpClient.get<Record<string, unknown>>("/admin/settings/appointment")).data,
  updateAppointment: async (data: Record<string, unknown>) => (await httpClient.patch<Record<string, unknown>>("/admin/settings/appointment", data)).data,
  getPayment: async () => (await httpClient.get<Record<string, unknown>>("/admin/settings/payment")).data,
  updatePayment: async (data: Record<string, unknown>) => (await httpClient.patch<Record<string, unknown>>("/admin/settings/payment", data)).data,
  getNotification: async () => (await httpClient.get<Record<string, unknown>>("/admin/settings/notification")).data,
  updateNotification: async (data: Record<string, unknown>) => (await httpClient.patch<Record<string, unknown>>("/admin/settings/notification", data)).data,
};
