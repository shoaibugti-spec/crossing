import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type Time = bigint;
export interface Listing {
    id: string;
    status: AdStatus;
    title: string;
    views: bigint;
    seller: Principal;
    processingTime: string;
    currency: string;
    category: string;
    originCountry: string;
    price: bigint;
    destinationCountry: string;
    requirements: Array<string>;
    images: Array<ExternalBlob>;
}
export interface User {
    bio: string;
    principal: Principal;
    country: string;
    balance: bigint;
    role: UserRole;
    trustScore: bigint;
    languages: Array<string>;
    verification: VerificationLevel;
}
export interface KYCSubmission {
    status: KYCStatus;
    documentBlob?: ExternalBlob;
    documentType: string;
    reviewerNotes: string;
    user: Principal;
    description: string;
}
export interface Dispute {
    status: DisputeStatus;
    resolutionNotes: string;
    evidence: string;
    transactionId: string;
    reason: string;
}
export interface Notification {
    title: string;
    notifType: NotificationType;
    read: boolean;
    user: Principal;
    message: string;
}
export interface Message {
    text: string;
    sender: Principal;
    timestamp: Time;
}
export interface UserProfile {
    bio: string;
    country: string;
    balance: bigint;
    role: UserRole;
    trustScore: bigint;
    languages: Array<string>;
    verification: VerificationLevel;
}
export enum AdStatus {
    active = "active",
    expired = "expired",
    suspended = "suspended",
    draft = "draft"
}
export enum DisputeStatus {
    closed = "closed",
    underReview = "underReview",
    open = "open",
    resolvedBuyer = "resolvedBuyer",
    resolvedSeller = "resolvedSeller"
}
export enum KYCStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum NotificationType {
    kycUpdate = "kycUpdate",
    transaction = "transaction",
    message = "message",
    dispute = "dispute",
    systemNotification = "systemNotification"
}
export enum TransactionStatus {
    disputed = "disputed",
    initiated = "initiated",
    completed = "completed",
    refunded = "refunded",
    escrowed = "escrowed"
}
export enum UserRole {
    admin = "admin",
    moderator = "moderator",
    seller = "seller",
    buyer = "buyer"
}
export enum UserRole__1 {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum VerificationLevel {
    documentVerified = "documentVerified",
    basic = "basic",
    fullyVerified = "fullyVerified"
}
export interface backendInterface {
    addMessage(conversationId: string, text: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole__1): Promise<void>;
    createConversation(conversationId: string, sellerId: Principal, adId: string): Promise<void>;
    createDispute(transactionId: string, reason: string, evidence: string): Promise<void>;
    createListing(title: string, category: string, price: bigint): Promise<string>;
    createReview(transactionId: string, adId: string, rating: bigint, comment: string): Promise<void>;
    createUser(country: string, bio: string, role: UserRole): Promise<void>;
    getAllListings(): Promise<Array<Listing>>;
    getAllListingsBySeller(sellerId: Principal): Promise<Array<Listing>>;
    getAllOpenDisputes(): Promise<Array<Dispute>>;
    getAllSuspendedListings(): Promise<Array<Listing>>;
    getAllUsers(): Promise<Array<User>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole__1>;
    getListing(listingId: string): Promise<Listing>;
    getMessages(conversationId: string): Promise<Array<Message>>;
    getPendingKYCSubmissions(): Promise<Array<KYCSubmission>>;
    getUserNotifications(): Promise<Array<Notification>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    incrementListingViews(listingId: string): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    markNotificationAsRead(index: bigint): Promise<void>;
    recordTransaction(sellerId: Principal, adId: string, amount: bigint): Promise<string>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitKYC(documentType: string, description: string): Promise<void>;
    suspendListing(listingId: string): Promise<void>;
    updateDisputeStatus(transactionId: string, status: DisputeStatus, resolutionNotes: string): Promise<void>;
    updateKYCStatus(user: Principal, status: KYCStatus, reviewerNotes: string): Promise<void>;
    updateListing(listingId: string, title: string, category: string, price: bigint, status: AdStatus): Promise<void>;
    updateTransactionStatus(transactionId: string, status: TransactionStatus): Promise<void>;
}
