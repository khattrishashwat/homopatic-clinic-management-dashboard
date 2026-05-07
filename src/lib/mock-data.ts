// Mock data for the clinic management dashboard

export interface Appointment {
  id: string;
  patientName: string;
  patientId: string;
  date: string;
  time: string;
  status: "pending" | "approved" | "completed" | "missed" | "rescheduled" | "rejected";
  mode: "online" | "offline";
  paymentStatus: "paid" | "pending" | "failed";
  problem: string;
  notes?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  phone: string;
  email: string;
  address: string;
  familyGroupId?: string;
  familyName?: string;
  registeredDate: string;
  lastVisit: string;
  totalVisits: number;
  conditions: string[];
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  medicines: { name: string; dosage: string; duration: string }[];
  notes: string;
  followUp?: string;
}

export interface Payment {
  id: string;
  patientName: string;
  patientId: string;
  amount: number;
  date: string;
  mode: "online" | "offline";
  status: "completed" | "pending" | "failed" | "refunded";
  description: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  offerPrice?: number;
  category: string;
  stock: number;
  featured: boolean;
  image?: string;
}

export interface Order {
  id: string;
  customerName: string;
  products: string[];
  total: number;
  date: string;
  status: "pending" | "packed" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "paid" | "pending";
}

export interface Notification {
  id: string;
  type: "booking" | "approval" | "reminder" | "payment";
  message: string;
  recipient: string;
  status: "sent" | "failed" | "pending";
  date: string;
  channel: "whatsapp" | "sms" | "email";
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  status: "published" | "draft";
  date: string;
  author: string;
  seoTitle?: string;
  seoDescription?: string;
}

export const mockAppointments: Appointment[] = [
  { id: "APT001", patientName: "Raj Sharma", patientId: "PAT001", date: "2026-05-07", time: "10:00 AM", status: "approved", mode: "offline", paymentStatus: "paid", problem: "Chronic hair fall", notes: "Follow-up visit" },
  { id: "APT002", patientName: "Priya Sharma", patientId: "PAT002", date: "2026-05-07", time: "10:30 AM", status: "pending", mode: "online", paymentStatus: "pending", problem: "PCOD symptoms" },
  { id: "APT003", patientName: "Ananya Verma", patientId: "PAT003", date: "2026-05-07", time: "11:00 AM", status: "completed", mode: "offline", paymentStatus: "paid", problem: "Migraine headaches" },
  { id: "APT004", patientName: "Vikram Singh", patientId: "PAT004", date: "2026-05-07", time: "11:30 AM", status: "missed", mode: "online", paymentStatus: "pending", problem: "Skin allergy" },
  { id: "APT005", patientName: "Meera Patel", patientId: "PAT005", date: "2026-05-08", time: "12:00 PM", status: "rescheduled", mode: "offline", paymentStatus: "paid", problem: "Digestive issues" },
  { id: "APT006", patientName: "Arjun Reddy", patientId: "PAT006", date: "2026-05-08", time: "02:00 PM", status: "pending", mode: "online", paymentStatus: "pending", problem: "Anxiety & stress" },
  { id: "APT007", patientName: "Sneha Gupta", patientId: "PAT007", date: "2026-05-09", time: "03:00 PM", status: "approved", mode: "offline", paymentStatus: "paid", problem: "Joint pain" },
  { id: "APT008", patientName: "Aryan Sharma", patientId: "PAT008", date: "2026-05-09", time: "04:00 PM", status: "pending", mode: "online", paymentStatus: "pending", problem: "Asthma symptoms" },
];

export const mockPatients: Patient[] = [
  { id: "PAT001", name: "Raj Sharma", age: 45, gender: "male", phone: "+91 98765 43210", email: "raj@email.com", address: "Mumbai, Maharashtra", familyGroupId: "FAM001", familyName: "Sharma Family", registeredDate: "2025-01-15", lastVisit: "2026-05-07", totalVisits: 12, conditions: ["Hair Fall", "Stress"] },
  { id: "PAT002", name: "Priya Sharma", age: 38, gender: "female", phone: "+91 98765 43211", email: "priya@email.com", address: "Mumbai, Maharashtra", familyGroupId: "FAM001", familyName: "Sharma Family", registeredDate: "2025-02-20", lastVisit: "2026-05-07", totalVisits: 8, conditions: ["PCOD", "Migraine"] },
  { id: "PAT003", name: "Ananya Verma", age: 29, gender: "female", phone: "+91 87654 32109", email: "ananya@email.com", address: "Delhi", registeredDate: "2025-06-10", lastVisit: "2026-05-07", totalVisits: 5, conditions: ["Migraine"] },
  { id: "PAT004", name: "Vikram Singh", age: 52, gender: "male", phone: "+91 76543 21098", email: "vikram@email.com", address: "Pune, Maharashtra", registeredDate: "2025-03-05", lastVisit: "2026-04-20", totalVisits: 15, conditions: ["Skin Allergy", "Diabetes"] },
  { id: "PAT005", name: "Meera Patel", age: 34, gender: "female", phone: "+91 65432 10987", email: "meera@email.com", address: "Ahmedabad, Gujarat", registeredDate: "2025-07-22", lastVisit: "2026-05-01", totalVisits: 3, conditions: ["Digestive Issues"] },
  { id: "PAT006", name: "Arjun Reddy", age: 28, gender: "male", phone: "+91 54321 09876", email: "arjun@email.com", address: "Hyderabad, Telangana", registeredDate: "2025-09-14", lastVisit: "2026-04-28", totalVisits: 6, conditions: ["Anxiety", "Insomnia"] },
  { id: "PAT007", name: "Sneha Gupta", age: 60, gender: "female", phone: "+91 43210 98765", email: "sneha@email.com", address: "Kolkata, West Bengal", registeredDate: "2024-11-30", lastVisit: "2026-05-05", totalVisits: 20, conditions: ["Joint Pain", "Arthritis"] },
  { id: "PAT008", name: "Aryan Sharma", age: 16, gender: "male", phone: "+91 98765 43212", email: "aryan@email.com", address: "Mumbai, Maharashtra", familyGroupId: "FAM001", familyName: "Sharma Family", registeredDate: "2025-04-10", lastVisit: "2026-05-03", totalVisits: 4, conditions: ["Asthma"] },
];

export const mockPrescriptions: Prescription[] = [
  { id: "PRE001", patientId: "PAT001", patientName: "Raj Sharma", date: "2026-05-07", medicines: [{ name: "Lycopodium 200C", dosage: "3 pills", duration: "2 weeks" }, { name: "Silicea 30C", dosage: "2 pills", duration: "1 month" }], notes: "Continue hair oil application. Avoid stress.", followUp: "2026-05-21" },
  { id: "PRE002", patientId: "PAT002", patientName: "Priya Sharma", date: "2026-05-07", medicines: [{ name: "Pulsatilla 30C", dosage: "3 pills morning", duration: "3 weeks" }, { name: "Sepia 200C", dosage: "Single dose", duration: "Once" }], notes: "Monitor cycle regularity. Diet chart provided.", followUp: "2026-05-28" },
  { id: "PRE003", patientId: "PAT003", patientName: "Ananya Verma", date: "2026-05-07", medicines: [{ name: "Belladonna 30C", dosage: "2 pills as needed", duration: "When pain occurs" }, { name: "Natrum Mur 200C", dosage: "3 pills morning", duration: "1 month" }], notes: "Avoid screen time before bed.", followUp: "2026-06-04" },
];

export const mockPayments: Payment[] = [
  { id: "PAY001", patientName: "Raj Sharma", patientId: "PAT001", amount: 800, date: "2026-05-07", mode: "online", status: "completed", description: "Consultation fee" },
  { id: "PAY002", patientName: "Ananya Verma", patientId: "PAT003", amount: 1200, date: "2026-05-07", mode: "offline", status: "completed", description: "Consultation + Medicine" },
  { id: "PAY003", patientName: "Vikram Singh", patientId: "PAT004", amount: 800, date: "2026-04-20", mode: "online", status: "pending", description: "Consultation fee" },
  { id: "PAY004", patientName: "Meera Patel", patientId: "PAT005", amount: 1500, date: "2026-05-01", mode: "offline", status: "completed", description: "Full package" },
  { id: "PAY005", patientName: "Sneha Gupta", patientId: "PAT007", amount: 2000, date: "2026-05-05", mode: "online", status: "completed", description: "Monthly package" },
  { id: "PAY006", patientName: "Priya Sharma", patientId: "PAT002", amount: 800, date: "2026-05-07", mode: "online", status: "pending", description: "Consultation fee" },
];

export const mockProducts: Product[] = [
  { id: "PRD001", name: "Hair Fall Control Kit", price: 2499, offerPrice: 1999, category: "Hair Care", stock: 45, featured: true },
  { id: "PRD002", name: "PCOD Balance Kit", price: 3499, offerPrice: 2999, category: "Women's Health", stock: 30, featured: true },
  { id: "PRD003", name: "Immunity Booster Pack", price: 1499, category: "General", stock: 100, featured: false },
  { id: "PRD004", name: "Stress Relief Drops", price: 599, category: "Mental Health", stock: 80, featured: false },
  { id: "PRD005", name: "Digestive Care Tablets", price: 899, offerPrice: 749, category: "Digestive", stock: 60, featured: true },
  { id: "PRD006", name: "Joint Pain Relief Oil", price: 799, category: "Pain Relief", stock: 55, featured: false },
];

export const mockOrders: Order[] = [
  { id: "ORD001", customerName: "Raj Sharma", products: ["Hair Fall Control Kit"], total: 1999, date: "2026-05-06", status: "shipped", paymentStatus: "paid" },
  { id: "ORD002", customerName: "Meera Patel", products: ["Digestive Care Tablets", "Immunity Booster Pack"], total: 2248, date: "2026-05-05", status: "delivered", paymentStatus: "paid" },
  { id: "ORD003", customerName: "Ananya Verma", products: ["PCOD Balance Kit"], total: 2999, date: "2026-05-07", status: "pending", paymentStatus: "paid" },
  { id: "ORD004", customerName: "Vikram Singh", products: ["Stress Relief Drops"], total: 599, date: "2026-05-04", status: "packed", paymentStatus: "paid" },
  { id: "ORD005", customerName: "Sneha Gupta", products: ["Joint Pain Relief Oil"], total: 799, date: "2026-05-03", status: "delivered", paymentStatus: "paid" },
];

export const mockNotifications: Notification[] = [
  { id: "NOT001", type: "booking", message: "New appointment booking from Priya Sharma", recipient: "+91 98765 43211", status: "sent", date: "2026-05-07 09:30", channel: "whatsapp" },
  { id: "NOT002", type: "approval", message: "Appointment approved for Raj Sharma at 10:00 AM", recipient: "+91 98765 43210", status: "sent", date: "2026-05-07 08:00", channel: "whatsapp" },
  { id: "NOT003", type: "reminder", message: "Reminder: Appointment tomorrow at 12:00 PM", recipient: "+91 65432 10987", status: "failed", date: "2026-05-07 06:00", channel: "whatsapp" },
  { id: "NOT004", type: "payment", message: "Payment of ₹800 received successfully", recipient: "+91 98765 43210", status: "sent", date: "2026-05-07 10:15", channel: "whatsapp" },
  { id: "NOT005", type: "reminder", message: "Follow-up reminder for Ananya Verma", recipient: "+91 87654 32109", status: "pending", date: "2026-05-08 06:00", channel: "whatsapp" },
];

export const mockBlogs: BlogPost[] = [
  { id: "BLG001", title: "Understanding Homeopathy for Hair Fall", slug: "homeopathy-hair-fall", excerpt: "Learn how homeopathic remedies can help control hair fall naturally...", status: "published", date: "2026-04-28", author: "Dr. Clinic", seoTitle: "Homeopathy for Hair Fall - Natural Treatment", seoDescription: "Discover effective homeopathic treatments for hair fall." },
  { id: "BLG002", title: "PCOD Management with Homeopathy", slug: "pcod-homeopathy", excerpt: "A comprehensive guide to managing PCOD symptoms through homeopathic medicine...", status: "published", date: "2026-04-20", author: "Dr. Clinic", seoTitle: "PCOD Treatment with Homeopathy", seoDescription: "Natural PCOD management through homeopathic remedies." },
  { id: "BLG003", title: "Boosting Immunity Naturally", slug: "boost-immunity", excerpt: "Tips and homeopathic remedies to strengthen your immune system...", status: "draft", date: "2026-05-01", author: "Dr. Clinic" },
];

export const dashboardStats = {
  totalAppointments: 1247,
  todayAppointments: 8,
  pendingApprovals: 3,
  activePatients: 156,
  monthlyRevenue: 124500,
  weeklyRevenue: 32800,
};

export const revenueData = [
  { month: "Jan", revenue: 85000, appointments: 95 },
  { month: "Feb", revenue: 92000, appointments: 108 },
  { month: "Mar", revenue: 78000, appointments: 88 },
  { month: "Apr", revenue: 105000, appointments: 120 },
  { month: "May", revenue: 124500, appointments: 135 },
];

export const appointmentModeData = [
  { name: "Online", value: 45, fill: "var(--color-chart-1)" },
  { name: "Offline", value: 55, fill: "var(--color-chart-2)" },
];