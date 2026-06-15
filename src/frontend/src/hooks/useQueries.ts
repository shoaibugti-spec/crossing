import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AdStatus,
  DisputeStatus,
  KYCStatus,
  TransactionStatus,
  UserRole,
  VerificationLevel,
} from "../backend.d";
import type { UserProfile } from "../backend.d";
import { useActor } from "./useActor";

// ── Profile Queries ──

export function useCallerProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllUsers() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
    },
  });
}

export function useCreateUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      country,
      bio,
      role,
    }: {
      country: string;
      bio: string;
      role: UserRole;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createUser(country, bio, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
    },
  });
}

// ── Listing Queries ──

export function useAllListings() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allListings"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllListings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useListing(listingId: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["listing", listingId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getListing(listingId);
    },
    enabled: !!actor && !isFetching && !!listingId,
  });
}

export function useMyListings() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["myListings"],
    queryFn: async () => {
      if (!actor) return [];
      // We'll get all listings and filter by seller
      return actor.getAllListings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateListing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      category,
      price,
    }: {
      title: string;
      category: string;
      price: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createListing(title, category, price);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allListings"] });
      queryClient.invalidateQueries({ queryKey: ["myListings"] });
    },
  });
}

export function useUpdateListing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      listingId,
      title,
      category,
      price,
      status,
    }: {
      listingId: string;
      title: string;
      category: string;
      price: bigint;
      status: AdStatus;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateListing(listingId, title, category, price, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allListings"] });
      queryClient.invalidateQueries({ queryKey: ["myListings"] });
    },
  });
}

export function useSuspendListing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (listingId: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.suspendListing(listingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allListings"] });
    },
  });
}

// ── Message / Conversation Queries ──

export function useMessages(conversationId: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMessages(conversationId);
    },
    enabled: !!actor && !isFetching && !!conversationId,
    refetchInterval: 5000, // poll for new messages
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      conversationId,
      text,
    }: {
      conversationId: string;
      text: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addMessage(conversationId, text);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.conversationId],
      });
    },
  });
}

export function useCreateConversation() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      conversationId,
      sellerId,
      adId,
    }: {
      conversationId: string;
      sellerId: string;
      adId: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      const { Principal } = await import("@icp-sdk/core/principal");
      return actor.createConversation(
        conversationId,
        Principal.fromText(sellerId),
        adId,
      );
    },
  });
}

// ── KYC Queries ──

export function usePendingKYC() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["pendingKYC"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPendingKYCSubmissions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubmitKYC() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      documentType,
      description,
    }: {
      documentType: string;
      description: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.submitKYC(documentType, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingKYC"] });
      queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
    },
  });
}

export function useUpdateKYCStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userPrincipal,
      status,
      notes,
    }: {
      userPrincipal: string;
      status: KYCStatus;
      notes: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      const { Principal } = await import("@icp-sdk/core/principal");
      return actor.updateKYCStatus(
        Principal.fromText(userPrincipal),
        status,
        notes,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingKYC"] });
    },
  });
}

// ── Transaction Queries ──

export function useRecordTransaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sellerId,
      adId,
      amount,
    }: {
      sellerId: string;
      adId: string;
      amount: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      const { Principal } = await import("@icp-sdk/core/principal");
      return actor.recordTransaction(
        Principal.fromText(sellerId),
        adId,
        amount,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useUpdateTransactionStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      transactionId,
      status,
    }: {
      transactionId: string;
      status: TransactionStatus;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateTransactionStatus(transactionId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

// ── Dispute Queries ──

export function useAllOpenDisputes() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["openDisputes"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllOpenDisputes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateDispute() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      transactionId,
      reason,
      evidence,
    }: {
      transactionId: string;
      reason: string;
      evidence: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createDispute(transactionId, reason, evidence);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["openDisputes"] });
    },
  });
}

export function useUpdateDisputeStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      transactionId,
      status,
      notes,
    }: {
      transactionId: string;
      status: DisputeStatus;
      notes: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateDisputeStatus(transactionId, status, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["openDisputes"] });
    },
  });
}

// ── Notifications ──

export function useNotifications() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUserNotifications();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useMarkNotificationRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (index: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.markNotificationAsRead(index);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

// ── Reviews ──

export function useCreateReview() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      transactionId,
      adId,
      rating,
      comment,
    }: {
      transactionId: string;
      adId: string;
      rating: bigint;
      comment: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createReview(transactionId, adId, rating, comment);
    },
  });
}

// Helper type exports
export type { UserProfile, AdStatus, VerificationLevel, UserRole };
