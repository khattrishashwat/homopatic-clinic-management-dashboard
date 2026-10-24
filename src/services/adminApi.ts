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
  bookingType?: "online" | "offline" | "both";
  durationMinutes?: number;
}

export interface TimeRangeDto {
  startTime: string;
  endTime: string;
}

export interface DayScheduleDto {
  dayOfWeek: number;
  enabled: boolean;
  timeRanges: TimeRangeDto[];
}

export interface DateOverrideDto {
  _id?: string;
  date: string;
  isClosed: boolean;
  timeRanges: TimeRangeDto[];
  note?: string;
}

export interface BookingScheduleDto {
  _id?: string;
  bookingType: "online" | "offline";
  slotDuration: number;
  defaultSchedule: {
    enabled: boolean;
    timeRanges: TimeRangeDto[];
  };
  weeklySchedule: DayScheduleDto[];
  dateOverrides: DateOverrideDto[];
  updatedAt?: string;
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
  bookingType?: "ONLINE" | "OFFLINE" | string;
  planType?: "FIFTEEN_DAYS" | "SEVEN_DAYS" | "ONE_MONTH" | null | string;
  planDuration?: number | null;
  baseAmount?: number;
  deliveryCharge?: number;
  totalAmount?: number;
  amount?: number;
  payment_status?: "pending" | "paid" | "failed";
  paymentMethod?: "online" | "offline" | string;
  concern?: string;
  customConcern?: string;
  reason?: string;
  address?: string;
  city?: string;
  pincode?: string;
  notes?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  createdAt?: string;
}

export interface PatientDto {
  _id: string;
  patientId: string;
  name: string;
  email: string;
  phone: string;
  age?: number;
  date_of_admission?: string;
  gender?: "M" | "F" | "male" | "female" | "other" | string;
  dob?: string;
  address?: string | { street?: string; city?: string; state?: string; postal_code?: string; country?: string };
  family_group?: string;
  family_members?: PatientDto[];
  medical_history?: string[];
  notes?: string;
  relationship?: string;
  created_at?: string;
}

export interface PrescriptionMedicineDto {
  name: string;
  potency?: string;
  dosage: string;
  route?: string;
  frequency?: string;
  duration: string;
  quantity?: string;
  instructions?: string;
  foodTiming?: string;
  notes?: string;
}

export interface PrescriptionVitalsDto {
  height?: string;
  weight?: string;
  bp?: string;
  pulse?: string;
  spo2?: string;
  temperature?: string;
  blood_sugar?: string;
}

export interface PrescriptionAdviceDto {
  general?: string;
  diet_lifestyle?: string;
  follow_up?: string;
  next_visit?: string;
}

export interface PrescriptionDto {
  _id: string;
  prescriptionNumber?: string;
  patient?: PatientDto;
  title?: string;
  prescription_date?: string;
  doctor_info?: {
    name?: string;
    qualification?: string;
    specialization?: string;
    reg_no?: string;
    phone?: string;
  };
  clinic_info?: {
    name?: string;
    tagline?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
  };
  patient_snapshot?: {
    name?: string;
    patientId?: string;
    gender?: string;
    age?: number;
    phone?: string;
  };
  vitals?: PrescriptionVitalsDto;
  medicines: PrescriptionMedicineDto[];
  advice?: PrescriptionAdviceDto;
  notes?: string;
  pdf_url?: string;
  pdf_s3_key?: string;
  image_url?: string;
  image_s3_key?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
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
  type?: "product" | "blog" | "both" | "general" | "health_concern" | string;
  image?: string;
  count?: number;
  active?: boolean;
  status?: string;
}

export interface ProductDto {
  _id: string;
  name: string;
  slug: string;
  short_description?: string;
  description?: string;
  whyWeChooseThis?: string;
  why_we_choose_this?: string;
  price: number;
  compare_price?: number;
  category?: string | CategoryDto;
  stock?: number;
  in_stock?: boolean;
  image?: string;
  image_s3_key?: string;
  image_alt?: string;
  video_url?: string;
  video_s3_key?: string;
  gallery?: { url: string; alt: string; s3_key?: string }[];
  active?: boolean;
  featured?: boolean;
  recommended?: boolean;
  sku?: string;
  attributes?: {
    shortDescription?: string;
    whyWeChooseThis?: string;
    benefits?: string[];
    ingredients?: string[];
    usage?: string;
    faqs?: Array<{ q: string; a: string }>;
    featured?: boolean;
    recommended?: boolean;
    durationWeeks?: number;
    [key: string]: unknown;
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
  featured_image?: string;
  featured_image_alt?: string;
  featured?: boolean;
  published?: boolean;
  published_at?: string;
  status?: string;
  author?: { name: string; email?: string } | string;
  author_bio?: string;
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
  status?: "pending" | "approved" | "rejected";
  verified_purchase?: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderShippingAddressDto {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export interface OrderPaymentDto {
  _id?: string;
  amount?: number;
  payment_method?: string;
  status?: string;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  created_at?: string;
}

export interface OrderDto {
  _id: string;
  order_number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  items?: { product?: ProductDto; quantity: number; price: number }[];
  subtotal?: number;
  tax?: number;
  shipping_cost?: number;
  discount?: number;
  total: number;
  coupon_code?: string;
  shipping_address?: OrderShippingAddressDto;
  payment?: OrderPaymentDto | string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  order_status: string;
  payment_status: string;
  dispatch_date?: string;
  tracking_number?: string;
  courier_name?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CouponDto {
  _id: string;
  code: string;
  description?: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minimumOrderValue?: number;
  maximumDiscount?: number | null;
  usageLimit?: number | null;
  perCustomerLimit: number;
  usedCount: number;
  startDate?: string;
  endDate?: string | null;
  active: boolean;
  applicableProducts?: ProductDto[] | string[];
  created_at?: string;
  updated_at?: string;
}

export interface CouponUsageDto {
  _id: string;
  coupon: string;
  couponCode: string;
  order: {
    _id: string;
    order_number: string;
    total: number;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    order_status?: string;
    payment_status?: string;
    created_at?: string;
  };
  customerEmail: string;
  customerMobile: string;
  discountAmount: number;
  usedAt: string;
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

export interface FaqDto {
  _id: string;
  question: string;
  answer: string;
  category?: string;
  order?: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatbotQuestionDto {
  _id: string;
  question: string;
  answer: string;
  keywords?: string[];
  order?: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
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
    const res = await httpClient.post<LoginResult>(
      "/admin/auth/login",
      { email, password },
      { suppressToast: true }
    );
    const payload = res as any;
    const token = payload?.token || payload?.data?.token || "";
    const user = payload?.user || payload?.data?.user || payload?.data || null;
    return { token, user };
  },
  me: async (): Promise<AdminUser> => {
    const res = await httpClient.get<AdminUser>("/admin/auth/me");
    const payload = res as any;
    return payload?.user || payload?.data?.user || payload?.data;
  },
  logout: async (): Promise<void> => {
    await httpClient.post("/admin/auth/logout");
  },
};

export interface DashboardStatsDto {
  totalAppointments: number;
  totalSlots: number;
  activePatients: number;
  pendingApprovals: number;
  totalRevenue: number;
  totalOrders?: number;
  onlineCount?: number;
  offlineCount?: number;
  monthlyTrends?: Array<{ month: string; revenue: number; appointments: number }>;
  serverDate?: string;
  [key: string]: any;
}

export const dashboardApi = {
  get: async (params?: { startDate?: string; endDate?: string }): Promise<DashboardStatsDto> =>
    (await httpClient.get<DashboardStatsDto>("/admin/dashboard", { params })).data,
};

export const appointmentsApi = {
  list: async (params?: ListParams) => unwrapList<AppointmentDto>(await httpClient.get("/admin/appointments", { params })),
  updateStatus: async (id: string, status: string) =>
    (await httpClient.patch<AppointmentDto>(`/admin/appointments/${id}/status`, { status })).data,
  complete: async (id: string) => (await httpClient.patch<AppointmentDto>(`/admin/appointments/${id}/complete`)).data,
  missed: async (id: string) => (await httpClient.patch<AppointmentDto>(`/admin/appointments/${id}/missed`)).data,
  delete: async (id: string) => (await httpClient.delete<{ success: boolean; message: string }>(`/admin/appointments/${id}`)).data,
  exportExcel: async (params?: { format?: "xlsx" | "csv"; status?: string; startDate?: string; endDate?: string }) =>
    (await httpClient.get<{ success: boolean; message: string; data: { downloadUrl: string; filename: string; s3Key: string; count: number } }>("/admin/appointments/export/excel", { params })).data,
};

export const slotsApi = {
  list: async () => (await httpClient.get<SlotRef[]>("/admin/slots")).data,
  update: async (id: string, data: Partial<SlotRef>) => (await httpClient.patch<SlotRef>(`/admin/slots/${id}`, data)).data,
  generateWeekends: async () => (await httpClient.post<unknown>("/admin/slots/generate-weekends", { daysAhead: 30, intervalMinutes: 30 })).data,
  getSchedule: async (type: "online" | "offline") => (await httpClient.get<BookingScheduleDto>(`/admin/slots/schedule/${type}`)).data,
  updateSchedule: async (type: "online" | "offline", data: Partial<BookingScheduleDto>) =>
    (await httpClient.put<BookingScheduleDto>(`/admin/slots/schedule/${type}`, data)).data,
  setDateOverride: async (type: "online" | "offline", data: DateOverrideDto) =>
    (await httpClient.post<BookingScheduleDto>(`/admin/slots/schedule/${type}/override`, data)).data,
  removeDateOverride: async (type: "online" | "offline", date: string) =>
    (await httpClient.delete<BookingScheduleDto>(`/admin/slots/schedule/${type}/override/${date}`)).data,
  previewSlots: async (type: "online" | "offline", date: string) =>
    (await httpClient.get<{ slots: SlotRef[]; effective: any }>(`/admin/slots/schedule/${type}/preview`, { params: { date } })).data,
};

export const patientsApi = {
  list: async (params?: ListParams) => unwrapList<PatientDto>(await httpClient.get("/admin/patients", { params })),
  create: async (data: Partial<PatientDto>) => (await httpClient.post<PatientDto>("/admin/patients", data)).data,
  createFamily: async (data: any) => (await httpClient.post<{ success: boolean; data: any }>("/admin/patients/family", data)).data,
  bulkImport: async (patients: any[]) => (await httpClient.post<{ success: boolean; data: any }>("/admin/patients/bulk-import", { patients })).data,
  importExcel: async (formData: FormData) =>
    (await httpClient.post<{ success: boolean; message: string; data: { count: number; importedPatients: any[]; errors: any[]; filename: string; s3Key?: string } }>("/admin/patients/import/excel", formData)).data,
  exportExcel: async (params?: { format?: "xlsx" | "csv"; search?: string }) =>
    (await httpClient.get<{ success: boolean; message: string; data: { downloadUrl: string; filename: string; s3Key: string; count: number } }>("/admin/patients/export/excel", { params })).data,
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
  list: async (params?: ListParams & { patientId?: string; file_type?: string }) =>
    unwrapList<MedicalRecordDto>(await httpClient.get("/admin/medical-records", { params })),
  upload: async (data: FormData) => (await httpClient.post<MedicalRecordDto>("/admin/medical-records", data)).data,
  uploadBulk: async (data: FormData) =>
    (await httpClient.post<{ success: boolean; message: string; count: number; data: MedicalRecordDto[] }>("/admin/medical-records/bulk", data)).data,
  delete: async (id: string) => (await httpClient.delete(`/admin/medical-records/${id}`)).data,
};

export const paymentsApi = {
  list: async (params?: ListParams) => unwrapList<PaymentDto>(await httpClient.get("/admin/payments", { params })),
};

/**
 * Normalizes HTML strings to plain text, replacing block elements and list items with readable line breaks and bullets.
 */
export function htmlToPlainText(html?: string): string {
  if (!html || typeof html !== "string") return "";
  if (!/<[a-z][\s\S]*>/i.test(html)) {
    return html.trim();
  }

  let text = html;

  // Replace block element endings / breaks with appropriate newlines
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/p>/gi, "\n\n");
  text = text.replace(/<\/h[1-6]>/gi, "\n\n");
  text = text.replace(/<\/div>/gi, "\n");

  // Format list items with bullet points
  text = text.replace(/<li[^>]*>/gi, "• ");
  text = text.replace(/<\/li>/gi, "\n");

  // Table rows
  text = text.replace(/<\/tr>/gi, "\n");

  // Remove all other remaining HTML tags
  text = text.replace(/<[^>]+>/g, "");

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));

  // Normalize line breaks
  text = text.replace(/\r\n|\r/g, "\n");
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/[ \t]+\n/g, "\n").replace(/\n[ \t]+/g, "\n");
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}

/**
 * Maps raw API Product response to ProductDto:
 * 1. Ensures description is normalized to plain text.
 * 2. Maps whyWeChooseThis from whyWeChooseThis, why_we_choose_this, or attributes.whyWeChooseThis.
 */
export function mapProductDto(raw: any): ProductDto {
  if (!raw || typeof raw !== "object") return raw as ProductDto;
  return {
    ...raw,
    description: raw.description ? htmlToPlainText(raw.description) : (raw.description ?? ""),
    whyWeChooseThis:
      raw.whyWeChooseThis ??
      raw.why_we_choose_this ??
      (raw.attributes && typeof raw.attributes === "object" ? (raw.attributes as any).whyWeChooseThis : undefined) ??
      "",
  } as ProductDto;
}

function prepareProductPayload(data: Partial<ProductDto> | FormData): Partial<ProductDto> | FormData {
  if (data instanceof FormData) {
    const whyWeChooseThis = data.get("whyWeChooseThis");
    if (whyWeChooseThis !== null && typeof whyWeChooseThis === "string") {
      if (!data.has("why_we_choose_this")) {
        data.append("why_we_choose_this", whyWeChooseThis);
      }
      const existingAttrsRaw = data.get("attributes");
      let attrs: Record<string, unknown> = {};
      if (typeof existingAttrsRaw === "string") {
        try {
          attrs = JSON.parse(existingAttrsRaw);
        } catch {
          attrs = {};
        }
      }
      if (!attrs.whyWeChooseThis) {
        attrs.whyWeChooseThis = whyWeChooseThis;
        data.set("attributes", JSON.stringify(attrs));
      }
    }
    return data;
  }

  if (data && typeof data === "object") {
    const payload: any = { ...data };
    if (payload.whyWeChooseThis !== undefined) {
      payload.why_we_choose_this = payload.why_we_choose_this ?? payload.whyWeChooseThis;
      payload.attributes = {
        ...(payload.attributes || {}),
        whyWeChooseThis: payload.whyWeChooseThis,
      };
    }
    return payload;
  }

  return data;
}

export const productsApi = {
  list: async (params?: ListParams) => {
    const result = unwrapList<ProductDto>(await httpClient.get("/admin/products", { params }));
    return {
      ...result,
      data: (result.data || []).map(mapProductDto),
    };
  },
  create: async (data: Partial<ProductDto> | FormData) => {
    const payload = prepareProductPayload(data);
    const res = await httpClient.post<ProductDto>("/admin/products", payload);
    return mapProductDto(res.data);
  },
  getbyId: async (id: string) => {
    const res = await httpClient.get<ProductDto>(`/admin/products/${id}`);
    return mapProductDto(res.data);
  },
  update: async (id: string, data: Partial<ProductDto> | FormData) => {
    const payload = prepareProductPayload(data);
    const res = await httpClient.patch<ProductDto>(`/admin/products/${id}`, payload);
    return mapProductDto(res.data);
  },
  delete: async (id: string) => (await httpClient.delete(`/admin/products/${id}`)).data,
  uploadImage: async (id: string, formData: FormData) => {
    const res = await httpClient.patch<ProductDto>(`/admin/products/${id}`, formData);
    return mapProductDto(res.data);
  },
  exportExcel: async (params?: { format?: "xlsx" | "csv"; category?: string; active?: string | boolean }) =>
    (await httpClient.get<{ success: boolean; message: string; data: { downloadUrl: string; filename: string; s3Key: string; count: number } }>("/admin/products/export/excel", { params })).data,
};

export const ordersApi = {
  list: async (params?: ListParams) => unwrapList<OrderDto>(await httpClient.get("/admin/orders", { params })),
  getById: async (id: string) => {
    const res = await httpClient.get<OrderDto>(`/admin/orders/${id}`);
    const payload = res as any;
    return (payload?.data !== undefined ? payload.data : payload) as OrderDto;
  },
  updateStatus: async (id: string, status: string) => (await httpClient.patch<OrderDto>(`/admin/orders/${id}/status`, { status })).data,
  dispatch: async (id: string, data?: { tracking_number?: string; courier_name?: string; notes?: string }) =>
    (await httpClient.post<{ success: boolean; data: OrderDto; message: string }>(`/admin/orders/${id}/dispatch`, data)).data,
  delete: async (id: string, force = false) =>
    (await httpClient.delete<{ success: boolean; message: string }>(`/admin/orders/${id}`, { params: { force } })).data,
  exportExcel: async (params?: { format?: "xlsx" | "csv"; order_status?: string; payment_status?: string }) =>
    (await httpClient.get<{ success: boolean; message: string; data: { downloadUrl: string; filename: string; s3Key: string; count: number } }>("/admin/orders/export/excel", { params })).data,
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
  list: async (params?: ListParams & { review_type?: string; type?: string; status?: string; product?: string; target_slug?: string; search?: string }) => {
    const p = { ...params };
    if (p.review_type && !p.type) {
      p.type = p.review_type;
    }
    return unwrapList<ReviewDto>(await httpClient.get("/admin/reviews", { params: p }));
  },
  create: async (data: Partial<ReviewDto> | Record<string, unknown>) => (await httpClient.post<ReviewDto>("/admin/reviews", data)).data,
  update: async (id: string, data: Partial<ReviewDto> | Record<string, unknown>) => (await httpClient.patch<ReviewDto>(`/admin/reviews/${id}`, data)).data,
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

export const faqsApi = {
  list: async (params?: ListParams) => unwrapList<FaqDto>(await httpClient.get("/admin/faqs", { params })),
  getById: async (id: string) => (await httpClient.get<FaqDto>(`/admin/faqs/${id}`)).data,
  create: async (data: Partial<FaqDto>) => (await httpClient.post<FaqDto>("/admin/faqs", data)).data,
  update: async (id: string, data: Partial<FaqDto>) => (await httpClient.put<FaqDto>(`/admin/faqs/${id}`, data)).data,
  delete: async (id: string) => (await httpClient.delete(`/admin/faqs/${id}`)).data,
  toggleStatus: async (id: string, active: boolean) => (await httpClient.patch<FaqDto>(`/admin/faqs/${id}/status`, { active })).data,
};

export const chatbotQuestionsApi = {
  list: async (params?: ListParams) => unwrapList<ChatbotQuestionDto>(await httpClient.get("/admin/chatbot/questions", { params })),
  getById: async (id: string) => (await httpClient.get<ChatbotQuestionDto>(`/admin/chatbot/questions/${id}`)).data,
  create: async (data: Partial<ChatbotQuestionDto>) => (await httpClient.post<ChatbotQuestionDto>("/admin/chatbot/questions", data)).data,
  update: async (id: string, data: Partial<ChatbotQuestionDto>) => (await httpClient.put<ChatbotQuestionDto>(`/admin/chatbot/questions/${id}`, data)).data,
  delete: async (id: string) => (await httpClient.delete(`/admin/chatbot/questions/${id}`)).data,
  toggleStatus: async (id: string, active: boolean) => (await httpClient.patch<ChatbotQuestionDto>(`/admin/chatbot/questions/${id}/status`, { active })).data,
};

export const couponsApi = {
  list: async (params?: ListParams) => unwrapList<CouponDto>(await httpClient.get("/admin/coupons", { params })),
  getById: async (id: string) => (await httpClient.get<{ data: CouponDto; usages?: CouponUsageDto[] }>(`/admin/coupons/${id}`)).data,
  create: async (data: Partial<CouponDto>) => (await httpClient.post<CouponDto>("/admin/coupons", data)).data,
  update: async (id: string, data: Partial<CouponDto>) => (await httpClient.patch<CouponDto>(`/admin/coupons/${id}`, data)).data,
  toggleStatus: async (id: string) => (await httpClient.patch<CouponDto>(`/admin/coupons/${id}/status`)).data,
  delete: async (id: string) => (await httpClient.delete(`/admin/coupons/${id}`)).data,
  getUsage: async (id: string, params?: ListParams) => unwrapList<CouponUsageDto>(await httpClient.get(`/admin/coupons/${id}/usage`, { params })),
};

export interface MediaUploadResult {
  key: string;
  s3Key: string;
  url: string;
  canonicalUrl?: string;
  bucket: string;
  filename?: string;
  originalname?: string;
  mimetype?: string;
  contentType?: string;
  size: number;
}

export const mediaApi = {
  upload: async (formData: FormData) =>
    (await httpClient.post<MediaUploadResult>("/admin/media/upload", formData)).data,
  getPresignedUrl: async (key: string, options?: { download?: boolean; filename?: string }) =>
    (await httpClient.get<{ url: string; key: string; expiresIn: number }>("/admin/media/presigned-url", { params: { key, download: options?.download, filename: options?.filename } })).data,
  delete: async (key: string) =>
    (await httpClient.delete<{ message: string; key?: string }>("/admin/media", { params: { key } })).data,
};

export const excelApi = {
  importPatients: patientsApi.importExcel,
  exportPatients: patientsApi.exportExcel,
  exportAppointments: appointmentsApi.exportExcel,
  exportOrders: ordersApi.exportExcel,
  exportProducts: productsApi.exportExcel,
};

