export const COMPANY_INFO = {
  // Identity
  name: "TTN HR – Tuyển Dụng & Cung Ứng Nhân Lực",
  legalName: "CÔNG TY TNHH TTN HR",
  alternateNames: [
    "Việc Làm HR",
    "TTN Human Resources",
    "TTN HR Bình Dương",
    "Tuyển dụng TTN",
    "CÔNG TY TNHH TTN HR",
    "TTN HR",
    "HR TTN"
  ],
  description: "TTN HR - Đối tác tin cậy về cung ứng lao động phổ thông và tuyển dụng tại Bình Dương, Hồ Chí Minh...",
  slogan: "Đối tác nhân sự tin cậy - Giải pháp toàn diện",

  // URLs & Assets
  baseUrl: "https://timviec.vieclamhr.com", // Subdomain (Current Site)
  mainDomain: "https://vieclamhr.com",      // Parent Domain
  logo: "https://vieclamhr.com/ttn-logo.webp",

  // Contact
  contact: {
    phone: "+84-844-456-787",
    email: "hrlongtuyendung@gmail.com",
    availableLanguage: ["Vietnamese", "Chinese"]
  },

  // Location & Map
  address: {
    street: "Đường DB4, Vĩnh Tân",
    locality: "Tân Uyên",
    region: "Bình Dương",
    postalCode: "82000",
    country: "VN"
  },
  geo: {
    latitude: 11.1444095,
    longitude: 106.7019746
  },
  hasMap: "https://maps.app.goo.gl/RWd4A1JszUubM6ddA",

  // Operations
  openingHours: {
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    opens: "08:00",
    closes: "17:00"
  },
  areaServed: ["Bình Dương", "Thành phố Hồ Chí Minh", "Tân Uyên"],

  // Social & External Links
  socialLinks: [
    "https://www.facebook.com/61585460484367",
    "https://www.tiktok.com/@vieclam.ttn.hr",
    "https://zalo.me/0844456787",
    "https://www.google.com/maps?cid=8824493389288761795"
  ]
} as const;
