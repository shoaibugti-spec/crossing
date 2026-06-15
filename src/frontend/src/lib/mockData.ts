import {
  AdStatus,
  DisputeStatus,
  KYCStatus,
  NotificationType,
  TransactionStatus,
  UserRole,
  VerificationLevel,
} from "../backend.d";

export interface MockAd {
  id: string;
  title: string;
  category: string;
  destinationCountry: string;
  originCountry: string;
  price: number;
  currency: string;
  processingTime: string;
  requirements: string[];
  status: AdStatus;
  views: number;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  sellerVerification: VerificationLevel;
  sellerTrustScore: number;
  sellerRating: number;
  sellerResponseRate: string;
  sellerMemberSince: string;
  description: string;
  createdAt: string;
}

export interface MockConversation {
  id: string;
  participantName: string;
  participantAvatar: string;
  adTitle: string;
  adId: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
}

export interface MockMessage {
  id: string;
  conversationId: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  isOwn: boolean;
}

export interface MockTransaction {
  id: string;
  adId: string;
  adTitle: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  createdAt: string;
}

export interface MockDispute {
  id: string;
  transactionId: string;
  reason: string;
  evidence: string;
  status: DisputeStatus;
  filedAt: string;
  resolutionNotes: string;
}

export interface MockReview {
  id: string;
  reviewerName: string;
  reviewerAvatar: string;
  adId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface MockNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  timestamp: string;
}

export const MOCK_ADS: MockAd[] = [
  {
    id: "ad-1",
    title: "Saudi Arabia Work Visa - Guaranteed Processing",
    category: "Work Visa",
    destinationCountry: "Saudi Arabia",
    originCountry: "Pakistan",
    price: 450,
    currency: "USD",
    processingTime: "15-21 business days",
    requirements: [
      "Valid passport (min 6 months validity)",
      "Medical fitness certificate",
      "Educational certificates (attested)",
      "Police clearance certificate",
      "Passport-size photographs (x4)",
      "Employment contract from Saudi employer",
    ],
    status: AdStatus.active,
    views: 342,
    sellerId: "seller-1",
    sellerName: "Ahmed Al-Rashidi",
    sellerAvatar: "AR",
    sellerVerification: VerificationLevel.fullyVerified,
    sellerTrustScore: 94,
    sellerRating: 4.8,
    sellerResponseRate: "98%",
    sellerMemberSince: "Jan 2022",
    description:
      "Specialized in Saudi Arabia work permits and iqama processing. 10+ years of experience with major Saudi companies. Guaranteed processing or full refund.",
    createdAt: "2025-12-10",
  },
  {
    id: "ad-2",
    title: "UAE Tourist Visa - Express 24hr Processing",
    category: "Tourist Visa",
    destinationCountry: "United Arab Emirates",
    originCountry: "India",
    price: 120,
    currency: "USD",
    processingTime: "1-2 business days",
    requirements: [
      "Scanned passport (first & last page)",
      "Passport-size photo (white background)",
      "Return flight ticket",
      "Hotel booking confirmation",
    ],
    status: AdStatus.active,
    views: 891,
    sellerId: "seller-2",
    sellerName: "Priya Sharma",
    sellerAvatar: "PS",
    sellerVerification: VerificationLevel.documentVerified,
    sellerTrustScore: 87,
    sellerRating: 4.6,
    sellerResponseRate: "94%",
    sellerMemberSince: "Mar 2023",
    description:
      "Fast UAE tourist visa processing for 30/60/90 day single and multiple entry visas. Trusted by 500+ clients. Emergency same-day processing available.",
    createdAt: "2025-12-15",
  },
  {
    id: "ad-3",
    title: "Schengen Student Visa - Germany, France, Netherlands",
    category: "Student Visa",
    destinationCountry: "Germany",
    originCountry: "Bangladesh",
    price: 680,
    currency: "USD",
    processingTime: "30-45 business days",
    requirements: [
      "University acceptance letter",
      "Proof of financial means (€10,000 min)",
      "Travel insurance",
      "Accommodation proof in destination country",
      "Academic transcripts (certified translation)",
      "Language proficiency certificate",
      "Motivation letter",
    ],
    status: AdStatus.active,
    views: 215,
    sellerId: "seller-3",
    sellerName: "Dr. Khalid Mehmood",
    sellerAvatar: "KM",
    sellerVerification: VerificationLevel.fullyVerified,
    sellerTrustScore: 97,
    sellerRating: 4.9,
    sellerResponseRate: "100%",
    sellerMemberSince: "Sep 2021",
    description:
      "Expert Schengen student visa consultant. Successfully processed 300+ student visas. Full documentation guidance, SOP writing, and follow-up included.",
    createdAt: "2025-12-05",
  },
  {
    id: "ad-4",
    title: "UK Skilled Worker Visa - Healthcare & IT Professionals",
    category: "Skilled Worker Visa",
    destinationCountry: "United Kingdom",
    originCountry: "Nigeria",
    price: 1200,
    currency: "USD",
    processingTime: "8-10 weeks",
    requirements: [
      "Certificate of Sponsorship from UK employer",
      "Proof of English language proficiency (IELTS/OET)",
      "Tuberculosis test results (if applicable)",
      "Bank statements (last 3 months)",
      "Passport (valid for duration of visa)",
    ],
    status: AdStatus.active,
    views: 178,
    sellerId: "seller-4",
    sellerName: "Michael Okonkwo",
    sellerAvatar: "MO",
    sellerVerification: VerificationLevel.fullyVerified,
    sellerTrustScore: 91,
    sellerRating: 4.7,
    sellerResponseRate: "96%",
    sellerMemberSince: "Jun 2022",
    description:
      "Specialized in UK Skilled Worker and Health & Care Worker visas. Partner with 50+ UK NHS trusts and tech companies. Free initial consultation.",
    createdAt: "2025-11-28",
  },
  {
    id: "ad-5",
    title: "Canada Express Entry - Points Assessment & Application",
    category: "Permanent Residency",
    destinationCountry: "Canada",
    originCountry: "Philippines",
    price: 2500,
    currency: "USD",
    processingTime: "6-12 months",
    requirements: [
      "Educational Credential Assessment (ECA)",
      "IELTS/CELPIP score 6.0+",
      "Work experience proof (reference letters)",
      "Police clearance certificate",
      "Medical examination results",
    ],
    status: AdStatus.active,
    views: 423,
    sellerId: "seller-5",
    sellerName: "Maria Santos",
    sellerAvatar: "MS",
    sellerVerification: VerificationLevel.documentVerified,
    sellerTrustScore: 83,
    sellerRating: 4.4,
    sellerResponseRate: "89%",
    sellerMemberSince: "Feb 2023",
    description:
      "RCIC-registered consultant for Canadian immigration. Free CRS score assessment. Full support from profile creation to landing PR.",
    createdAt: "2025-12-02",
  },
  {
    id: "ad-6",
    title: "Australia Working Holiday Visa (417/462) - Young Professionals",
    category: "Working Holiday Visa",
    destinationCountry: "Australia",
    originCountry: "South Korea",
    price: 340,
    currency: "USD",
    processingTime: "14-28 business days",
    requirements: [
      "Passport from eligible country",
      "Age 18-35 at time of application",
      "Health insurance coverage",
      "Proof of sufficient funds (AUD 5,000)",
      "No criminal convictions",
    ],
    status: AdStatus.active,
    views: 267,
    sellerId: "seller-6",
    sellerName: "Jin-ho Park",
    sellerAvatar: "JP",
    sellerVerification: VerificationLevel.basic,
    sellerTrustScore: 72,
    sellerRating: 4.2,
    sellerResponseRate: "82%",
    sellerMemberSince: "Jul 2024",
    description:
      "Helping young professionals navigate Australian working holiday visas. Includes job placement assistance and accommodation guidance for Sydney/Melbourne.",
    createdAt: "2025-12-18",
  },
  {
    id: "ad-7",
    title: "Jordan Work Permit - Construction & Hospitality Sector",
    category: "Work Visa",
    destinationCountry: "Jordan",
    originCountry: "Egypt",
    price: 280,
    currency: "USD",
    processingTime: "10-15 business days",
    requirements: [
      "Valid passport",
      "Job offer from Jordanian employer",
      "Medical certificate",
      "Two recent photographs",
    ],
    status: AdStatus.active,
    views: 134,
    sellerId: "seller-7",
    sellerName: "Hassan Ibrahim",
    sellerAvatar: "HI",
    sellerVerification: VerificationLevel.documentVerified,
    sellerTrustScore: 79,
    sellerRating: 4.3,
    sellerResponseRate: "87%",
    sellerMemberSince: "Nov 2023",
    description:
      "Authorized Jordan work permit agent. Serving construction, hospitality, and domestic workers. Includes airport reception and housing assistance.",
    createdAt: "2025-12-20",
  },
  {
    id: "ad-8",
    title: "New Zealand Skilled Migrant Visa - IT & Engineering",
    category: "Skilled Worker Visa",
    destinationCountry: "New Zealand",
    originCountry: "India",
    price: 1800,
    currency: "USD",
    processingTime: "4-8 months",
    requirements: [
      "Points assessment (minimum 160 points)",
      "IELTS 6.5+ overall",
      "Skills assessment from relevant authority",
      "Valid job offer (preferred)",
      "Health and character requirements",
    ],
    status: AdStatus.active,
    views: 198,
    sellerId: "seller-8",
    sellerName: "Ananya Krishnan",
    sellerAvatar: "AK",
    sellerVerification: VerificationLevel.fullyVerified,
    sellerTrustScore: 93,
    sellerRating: 4.8,
    sellerResponseRate: "97%",
    sellerMemberSince: "Apr 2022",
    description:
      "Licensed NZ immigration adviser. Expertise in skilled migrant, investor, and entrepreneur visas. 95% success rate across 200+ applications.",
    createdAt: "2025-11-25",
  },
];

export const MOCK_CONVERSATIONS: MockConversation[] = [
  {
    id: "conv-1",
    participantName: "Ahmed Al-Rashidi",
    participantAvatar: "AR",
    adTitle: "Saudi Arabia Work Visa - Guaranteed Processing",
    adId: "ad-1",
    lastMessage:
      "Yes, I can help with that. Please send your current documents.",
    lastMessageTime: "2 min ago",
    unread: 2,
  },
  {
    id: "conv-2",
    participantName: "Dr. Khalid Mehmood",
    participantAvatar: "KM",
    adTitle: "Schengen Student Visa - Germany, France, Netherlands",
    adId: "ad-3",
    lastMessage:
      "Your application has been submitted. Expect a response in 5-7 days.",
    lastMessageTime: "1 hour ago",
    unread: 0,
  },
  {
    id: "conv-3",
    participantName: "Priya Sharma",
    participantAvatar: "PS",
    adTitle: "UAE Tourist Visa - Express 24hr Processing",
    adId: "ad-2",
    lastMessage: "Please make the payment to start processing your visa.",
    lastMessageTime: "Yesterday",
    unread: 1,
  },
  {
    id: "conv-4",
    participantName: "Michael Okonkwo",
    participantAvatar: "MO",
    adTitle: "UK Skilled Worker Visa - Healthcare & IT",
    adId: "ad-4",
    lastMessage:
      "I've reviewed your profile. You qualify for the Health & Care Worker visa.",
    lastMessageTime: "2 days ago",
    unread: 0,
  },
];

export const MOCK_MESSAGES: MockMessage[] = [
  {
    id: "msg-1",
    conversationId: "conv-1",
    text: "Hello, I'm interested in your Saudi Arabia work visa service. I have an offer from a construction company in Riyadh.",
    senderId: "me",
    senderName: "You",
    timestamp: "10:30 AM",
    isOwn: true,
  },
  {
    id: "msg-2",
    conversationId: "conv-1",
    text: "Welcome! I'd be happy to help you. Construction visas for Riyadh are one of our specialties. What's your current position/trade?",
    senderId: "seller-1",
    senderName: "Ahmed Al-Rashidi",
    timestamp: "10:32 AM",
    isOwn: false,
  },
  {
    id: "msg-3",
    conversationId: "conv-1",
    text: "I'm a civil engineer with 8 years of experience. I have the job offer letter from Al-Fara'a Group.",
    senderId: "me",
    senderName: "You",
    timestamp: "10:35 AM",
    isOwn: true,
  },
  {
    id: "msg-4",
    conversationId: "conv-1",
    text: "Excellent! Al-Fara'a Group is well-known. For civil engineers, the process is typically 15-18 business days. Can you send me scanned copies of your passport, educational certificates, and the job offer letter?",
    senderId: "seller-1",
    senderName: "Ahmed Al-Rashidi",
    timestamp: "10:37 AM",
    isOwn: false,
  },
  {
    id: "msg-5",
    conversationId: "conv-1",
    text: "Yes, I can help with that. Please send your current documents.",
    senderId: "seller-1",
    senderName: "Ahmed Al-Rashidi",
    timestamp: "10:40 AM",
    isOwn: false,
  },
];

export const MOCK_TRANSACTIONS: MockTransaction[] = [
  {
    id: "txn-001",
    adId: "ad-2",
    adTitle: "UAE Tourist Visa - Express 24hr Processing",
    buyerId: "me",
    buyerName: "You",
    sellerId: "seller-2",
    sellerName: "Priya Sharma",
    amount: 120,
    currency: "USD",
    status: TransactionStatus.completed,
    createdAt: "2025-12-10",
  },
  {
    id: "txn-002",
    adId: "ad-3",
    adTitle: "Schengen Student Visa - Germany",
    buyerId: "me",
    buyerName: "You",
    sellerId: "seller-3",
    sellerName: "Dr. Khalid Mehmood",
    amount: 680,
    currency: "USD",
    status: TransactionStatus.escrowed,
    createdAt: "2025-12-18",
  },
  {
    id: "txn-003",
    adId: "ad-1",
    adTitle: "Saudi Arabia Work Visa",
    buyerId: "buyer-x",
    buyerName: "Omar Farooq",
    sellerId: "me",
    sellerName: "You",
    amount: 450,
    currency: "USD",
    status: TransactionStatus.initiated,
    createdAt: "2025-12-22",
  },
];

export const MOCK_DISPUTES: MockDispute[] = [
  {
    id: "dispute-1",
    transactionId: "txn-999",
    reason:
      "Seller did not process visa within promised timeframe. Missed flight booking due to delay.",
    evidence:
      "Screenshots of communication, original timeline promise, booking cancellation receipt",
    status: DisputeStatus.underReview,
    filedAt: "2025-12-15",
    resolutionNotes: "Admin reviewing evidence. Both parties contacted.",
  },
];

export const MOCK_REVIEWS: MockReview[] = [
  {
    id: "review-1",
    reviewerName: "Hassan M.",
    reviewerAvatar: "HM",
    adId: "ad-1",
    rating: 5,
    comment:
      "Ahmed was incredibly professional. My Saudi visa was processed in exactly 18 days as promised. All documentation guidance was clear and accurate. Highly recommend!",
    createdAt: "2025-11-20",
  },
  {
    id: "review-2",
    reviewerName: "Fatima K.",
    reviewerAvatar: "FK",
    adId: "ad-1",
    rating: 5,
    comment:
      "Used this service twice now. Both times flawless. Ahmed responds within minutes and keeps you updated throughout the process.",
    createdAt: "2025-10-08",
  },
  {
    id: "review-3",
    reviewerName: "Raza A.",
    reviewerAvatar: "RA",
    adId: "ad-1",
    rating: 4,
    comment:
      "Good service overall. Took a few extra days than expected but visa came through. Communication was good.",
    createdAt: "2025-09-15",
  },
];

export const MOCK_NOTIFICATIONS: MockNotification[] = [
  {
    id: "notif-1",
    title: "Message from Ahmed Al-Rashidi",
    message: "Yes, I can help with that. Please send your current documents.",
    type: NotificationType.message,
    read: false,
    timestamp: "2 min ago",
  },
  {
    id: "notif-2",
    title: "KYC Verification Approved",
    message:
      "Your identity verification (Level 1 - Document) has been approved. You can now unlock seller contacts.",
    type: NotificationType.kycUpdate,
    read: false,
    timestamp: "1 hour ago",
  },
  {
    id: "notif-3",
    title: "Escrow Deposit Confirmed",
    message:
      "Your $680 escrow deposit for Schengen Student Visa service has been confirmed.",
    type: NotificationType.transaction,
    read: true,
    timestamp: "Yesterday, 3:45 PM",
  },
  {
    id: "notif-4",
    title: "New Message from Priya Sharma",
    message: "Please make the payment to start processing your visa.",
    type: NotificationType.message,
    read: true,
    timestamp: "Yesterday, 11:20 AM",
  },
  {
    id: "notif-5",
    title: "Dispute Status Update",
    message:
      "Your dispute #dispute-1 is now under review. Admin will contact you within 48 hours.",
    type: NotificationType.dispute,
    read: true,
    timestamp: "Dec 16, 2025",
  },
  {
    id: "notif-6",
    title: "Welcome to Crossing!",
    message:
      "Your account is set up. Complete your KYC verification to unlock all platform features.",
    type: NotificationType.systemNotification,
    read: true,
    timestamp: "Dec 1, 2025",
  },
];

export const WALLET_TRANSACTIONS = [
  {
    id: "w-1",
    date: "Dec 22, 2025",
    description: "Escrow deposit - Schengen Student Visa",
    amount: -680,
    currency: "USD",
    status: "completed",
  },
  {
    id: "w-2",
    date: "Dec 10, 2025",
    description: "UAE Tourist Visa payment",
    amount: -120,
    currency: "USD",
    status: "completed",
  },
  {
    id: "w-3",
    date: "Dec 08, 2025",
    description: "Wallet top-up via card",
    amount: 1000,
    currency: "USD",
    status: "completed",
  },
  {
    id: "w-4",
    date: "Nov 20, 2025",
    description: "Received payment for Saudi Visa service",
    amount: 450,
    currency: "USD",
    status: "completed",
  },
  {
    id: "w-5",
    date: "Nov 15, 2025",
    description: "Platform fee",
    amount: -22.5,
    currency: "USD",
    status: "completed",
  },
];

export const KYC_MOCK_USERS = [
  {
    principal: "xyz-001",
    name: "Ali Hassan",
    docType: "Passport",
    submittedDate: "Dec 22, 2025",
    status: KYCStatus.pending,
  },
  {
    principal: "xyz-002",
    name: "Fatima Malik",
    docType: "CNIC",
    submittedDate: "Dec 21, 2025",
    status: KYCStatus.pending,
  },
  {
    principal: "xyz-003",
    name: "John Smith",
    docType: "National ID",
    submittedDate: "Dec 20, 2025",
    status: KYCStatus.pending,
  },
];

export const ADMIN_USERS = [
  {
    id: "u-1",
    name: "Ahmed Al-Rashidi",
    role: UserRole.seller,
    verification: VerificationLevel.fullyVerified,
    trustScore: 94,
    joined: "Jan 2022",
  },
  {
    id: "u-2",
    name: "Priya Sharma",
    role: UserRole.seller,
    verification: VerificationLevel.documentVerified,
    trustScore: 87,
    joined: "Mar 2023",
  },
  {
    id: "u-3",
    name: "Omar Farooq",
    role: UserRole.buyer,
    verification: VerificationLevel.basic,
    trustScore: 65,
    joined: "Dec 2025",
  },
  {
    id: "u-4",
    name: "Maria Santos",
    role: UserRole.seller,
    verification: VerificationLevel.documentVerified,
    trustScore: 83,
    joined: "Feb 2023",
  },
];

export const ADMIN_ADS = [
  {
    id: "ad-1",
    title: "Saudi Arabia Work Visa",
    seller: "Ahmed Al-Rashidi",
    country: "Saudi Arabia",
    status: AdStatus.active,
    created: "Dec 10, 2025",
  },
  {
    id: "ad-2",
    title: "UAE Tourist Visa",
    seller: "Priya Sharma",
    country: "UAE",
    status: AdStatus.active,
    created: "Dec 15, 2025",
  },
  {
    id: "ad-5",
    title: "Canada Express Entry",
    seller: "Maria Santos",
    country: "Canada",
    status: AdStatus.draft,
    created: "Dec 2, 2025",
  },
];

export const ADMIN_DISPUTES = [
  {
    id: "d-1",
    transactionId: "txn-999",
    reason: "Non-delivery of service within promised timeframe",
    status: DisputeStatus.underReview,
    filed: "Dec 15, 2025",
  },
  {
    id: "d-2",
    transactionId: "txn-888",
    reason: "Documents provided were incorrect/incomplete",
    status: DisputeStatus.open,
    filed: "Dec 20, 2025",
  },
];

export const VISA_TYPES = [
  "Work Visa",
  "Tourist Visa",
  "Student Visa",
  "Business Visa",
  "Skilled Worker Visa",
  "Permanent Residency",
  "Working Holiday Visa",
  "Family Reunion Visa",
  "Investor Visa",
  "Transit Visa",
];

export const COUNTRIES = [
  "Saudi Arabia",
  "United Arab Emirates",
  "United Kingdom",
  "Germany",
  "Canada",
  "Australia",
  "New Zealand",
  "United States",
  "France",
  "Netherlands",
  "Turkey",
  "Qatar",
  "Kuwait",
  "Bahrain",
  "Oman",
  "Jordan",
  "Malaysia",
  "South Korea",
  "Japan",
  "Singapore",
];
