export interface CompanyAddress {
  street: string;
  locality: string;
  region: string;
  postalCode: string;
  country: string;
}

export interface CompanyInfo {
  name: string;
  legalName: string;
  alternateNames: readonly string[];
  description: string;
  slogan: string;
  baseUrl: string;
  mainDomain: string;
  logo: string;
  contact: {
    phone: string;
    email: string;
    availableLanguage: readonly string[];
  };
  address: CompanyAddress;
  geo: {
    latitude: number;
    longitude: number;
  };
  hasMap: string;
  openingHours: {
    days: readonly string[];
    opens: string;
    closes: string;
  };
  areaServed: readonly string[];
  socialLinks: readonly string[];
}

const COMMON_DATA = {
  name: "TTN HR – Tuyển Dụng & Cung Ứng Nhân Lực",
  legalName: "CÔNG TY TNHH TTN HR",
  baseUrl: "https://timviec.vieclamhr.com",
  mainDomain: "https://vieclamhr.com",
  logo: "https://timviec.vieclamhr.com/logo.webp",
  contact: {
    phone: "+84-844-456-787",
    email: "hrlongtuyendung@gmail.com",
    availableLanguage: ["Vietnamese", "Chinese", "English"]
  },
  geo: {
    latitude: 11.1444095,
    longitude: 106.7019746
  },
  hasMap: "https://maps.app.goo.gl/RWd4A1JszUubM6ddA",
  openingHours: {
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    opens: "08:00",
    closes: "17:00"
  },
  socialLinks: [
    "https://www.facebook.com/vieclamhrttn",
    "https://www.tiktok.com/@vieclam.ttn.hr",
    "https://zalo.me/0844456787",
    "https://www.google.com/maps?cid=8824493389288761795"
  ]
} as const;

export const COMPANY_DATA: Record<string, CompanyInfo> = {
  vi: {
    ...COMMON_DATA,
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
    address: {
      street: "Đường DB4, Vĩnh Tân",
      locality: "Tân Uyên",
      region: "Bình Dương",
      postalCode: "82000",
      country: "VN"
    },
    areaServed: ["Bình Dương", "Thành phố Hồ Chí Minh", "Tân Uyên"]
  },
  zh: {
    ...COMMON_DATA,
    alternateNames: [
      "HR 招聘",
      "TTN 人力资源",
      "平阳 TTN HR",
      "TTN 招聘",
      "TTN HR 有限公司",
      "TTN HR",
      "HR TTN"
    ],
    description: "TTN HR - 平阳、胡志明市值得信赖的普工供应和招聘合作伙伴...",
    slogan: "值得信赖的人力资源合作伙伴 - 全面解决方案",
    address: {
      street: "平阳省新渊市永新坊DB4路",
      locality: "新渊市",
      region: "平阳省",
      postalCode: "82000",
      country: "VN"
    },
    areaServed: ["平阳省", "胡志明市", "新渊市"]
  },
  en: {
    ...COMMON_DATA,
    alternateNames: [
      "HR Jobs",
      "TTN Human Resources",
      "TTN HR Binh Duong",
      "TTN Recruitment",
      "TTN HR COMPANY LIMITED",
      "TTN HR",
      "HR TTN"
    ],
    description: "TTN HR - Trusted partner for general labor supply and recruitment in Binh Duong, Ho Chi Minh City...",
    slogan: "Trusted HR Partner - Comprehensive Solutions",
    address: {
      street: "DB4 Street, Vinh Tan",
      locality: "Tan Uyen",
      region: "Binh Duong",
      postalCode: "82000",
      country: "VN"
    },
    areaServed: ["Binh Duong", "Ho Chi Minh City", "Tan Uyen"]
  }
};

export function getCompanyInfo(locale: string): CompanyInfo {
  return COMPANY_DATA[locale] || COMPANY_DATA['vi'];
}
