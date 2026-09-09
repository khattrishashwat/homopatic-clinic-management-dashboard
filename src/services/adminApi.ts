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

export interface CategoryDto {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  type?: "product" | "blog" | "general";
  image?: string;
  count?: number;
  active?: boolean;
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
  recommended?: boolean;
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

export interface BlogDto {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category?: string | CategoryDto;
  tags?: string[];
  image?: string;
  featured?: boolean;
  published?: boolean;
  status?: string;
  author?: { name: string; email?: string } | string;
  views?: number;
  readTime?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReviewDto {
  _id: string;
  review_type: "product_review" | "blog_comment" | "google_review" | "testimonial" | "patient_story";
  target_id?: string;
  target_slug?: string;
  reviewer_name: string;
  reviewer_email?: string;
  rating: number;
  title?: string;
  comment: string;
  profileImage?: string;
  relativeTime?: string;
  approved: boolean;
  order?: number;
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
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ChatbotSettingsDto {
  enabled: boolean;
  welcome_message: string;
  suggested_questions: string[];
}

export interface LoginResult {
  token: string;
  user: AdminUser;
}

function unwrapList<T>(res: ApiResponse<T[]> | { data?: { data?: T[]; pagination?: PaginationMeta; [key: string]: unknown } | T[] }): ListResult<T> {
  const payload = (res as any)?.data !== undefined ? (res as any).data : res;
  if (Array.isArray(payload)) {
    return { data: payload };
  }
  if (payload && Array.isArray((payload as any).data)) {
    return { data: (payload as any).data, pagination: (payload as any).pagination };
  }
  return { data: [] };
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResult> => {
    const res = await httpClient.post<LoginResult>("/admin/auth/login", { email, password });
    return res.data;
  },
  me: async (): Promise<AdminUser> => {
    const res = await httpClient.get<AdminUser>("/admin/auth/me");
    return res.data;
  },
  logout: async (): Promise<void> => {
    await httpClient.post("/admin/auth/logout");
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

export const notificationsApi = {
  list: async (params?: ListParams) =>
    unwrapList<NotificationDto>(await httpClient.get("/admin/notifications", { params })),
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
  list: async (params?: ListParams) => unwrapList<BlogDto>(await httpClient.get("/admin/blogs", { params })),
  create: async (data: Partial<BlogDto> | FormData) => (await httpClient.post<BlogDto>("/admin/blogs", data)).data,
  update: async (id: string, data: Partial<BlogDto> | FormData) => (await httpClient.patch<BlogDto>(`/admin/blogs/${id}`, data)).data,
  delete: async (id: string) => (await httpClient.delete(`/admin/blogs/${id}`)).data,
};

export const categoriesApi = {
  list: async (params?: ListParams) => unwrapList<CategoryDto>(await httpClient.get("/admin/categories", { params })),
  create: async (data: Partial<CategoryDto> | FormData) => (await httpClient.post<CategoryDto>("/admin/categories", data)).data,
  update: async (id: string, data: Partial<CategoryDto> | FormData) => (await httpClient.patch<CategoryDto>(`/admin/categories/${id}`, data)).data,
  delete: async (id: string) => (await httpClient.delete(`/admin/categories/${id}`)).data,
};

export const reviewsApi = {
  list: async (params?: ListParams) => unwrapList<ReviewDto>(await httpClient.get("/admin/reviews", { params })),
  create: async (data: Partial<ReviewDto>) => (await httpClient.post<ReviewDto>("/admin/reviews", data)).data,
  update: async (id: string, data: Partial<ReviewDto>) => (await httpClient.patch<ReviewDto>(`/admin/reviews/${id}`, data)).data,
  delete: async (id: string) => (await httpClient.delete(`/admin/reviews/${id}`)).data,
};

export const settingsApi = {
  getAppointment: async () => (await httpClient.get<Record<string, unknown>>("/admin/settings/appointment")).data,
  updateAppointment: async (data: Record<string, unknown>) => (await httpClient.patch<Record<string, unknown>>("/admin/settings/appointment", data)).data,
  getPayment: async () => (await httpClient.get<Record<string, unknown>>("/admin/settings/payment")).data,
  updatePayment: async (data: Record<string, unknown>) => (await httpClient.patch<Record<string, unknown>>("/admin/settings/payment", data)).data,
  getNotification: async () => (await httpClient.get<Record<string, unknown>>("/admin/settings/notification")).data,
  updateNotification: async (data: Record<string, unknown>) => (await httpClient.patch<Record<string, unknown>>("/admin/settings/notification", data)).data,
  getChatbot: async () => (await httpClient.get<ChatbotSettingsDto>("/admin/settings/chatbot")).data,
  updateChatbot: async (data: Partial<ChatbotSettingsDto>) => (await httpClient.patch<ChatbotSettingsDto>("/admin/settings/chatbot", data)).data,
};
