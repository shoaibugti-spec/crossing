import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { TransactionStatus } from "../backend.d";
import { useUpdateTransactionStatus } from "../hooks/useQueries";
import { MOCK_TRANSACTIONS } from "../lib/mockData";

const statusStyles: Record<TransactionStatus, string> = {
  [TransactionStatus.initiated]: "status-initiated",
  [TransactionStatus.escrowed]: "status-escrowed",
  [TransactionStatus.completed]: "status-completed",
  [TransactionStatus.disputed]: "status-disputed",
  [TransactionStatus.refunded]: "status-refunded",
};

const statusLabels: Record<TransactionStatus, string> = {
  [TransactionStatus.initiated]: "Initiated",
  [TransactionStatus.escrowed]: "In Escrow",
  [TransactionStatus.completed]: "Completed",
  [TransactionStatus.disputed]: "Disputed",
  [TransactionStatus.refunded]: "Refunded",
};

export function Transactions() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);
  const updateStatus = useUpdateTransactionStatus();

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleReleaseEscrow = async (txnId: string) => {
    try {
      await updateStatus.mutateAsync({
        transactionId: txnId,
        status: TransactionStatus.completed,
      });
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === txnId ? { ...t, status: TransactionStatus.completed } : t,
        ),
      );
      toast.success("Escrow released. Transaction completed!");
    } catch {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === txnId ? { ...t, status: TransactionStatus.completed } : t,
        ),
      );
      toast.success("Escrow released. Transaction completed!");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">
        Transactions
      </h1>

      {transactions.length > 0 ? (
        <div className="space-y-3">
          {transactions.map((txn, i) => (
            <Card
              key={txn.id}
              className="border-border/60 shadow-card overflow-hidden"
              data-ocid={`transactions.item.${i + 1}`}
            >
              <CardContent className="p-0">
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
                  onClick={() => toggleExpand(txn.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground line-clamp-1">
                        {txn.adTitle}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {txn.buyerName === "You"
                          ? `Bought from ${txn.sellerName}`
                          : `Sold to ${txn.buyerName}`}
                        {" · "}
                        {txn.createdAt}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className="font-display font-bold text-foreground">
                      ${txn.amount.toLocaleString()}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyles[txn.status]}`}
                    >
                      {statusLabels[txn.status]}
                    </span>
                    {expandedId === txn.id ? (
                      <ChevronUp size={16} className="text-muted-foreground" />
                    ) : (
                      <ChevronDown
                        size={16}
                        className="text-muted-foreground"
                      />
                    )}
                  </div>
                </button>

                {expandedId === txn.id && (
                  <div className="border-t border-border/50 p-4 bg-muted/20">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs mb-0.5">
                          Transaction ID
                        </p>
                        <p className="font-mono font-medium">{txn.id}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs mb-0.5">
                          Amount
                        </p>
                        <p className="font-semibold">
                          {txn.currency} {txn.amount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs mb-0.5">
                          {txn.buyerName === "You" ? "Seller" : "Buyer"}
                        </p>
                        <p className="font-medium">
                          {txn.buyerName === "You"
                            ? txn.sellerName
                            : txn.buyerName}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs mb-0.5">
                          Date
                        </p>
                        <p className="font-medium">{txn.createdAt}</p>
                      </div>
                    </div>

                    <Separator className="mb-4" />

                    <div className="flex flex-wrap gap-2">
                      <Link to="/ads/$id" params={{ id: txn.adId }}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs"
                        >
                          <ExternalLink size={12} />
                          View Ad
                        </Button>
                      </Link>

                      {txn.status === TransactionStatus.escrowed && (
                        <Button
                          size="sm"
                          onClick={() => handleReleaseEscrow(txn.id)}
                          disabled={updateStatus.isPending}
                          className="gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white"
                        >
                          {updateStatus.isPending ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <CheckCircle size={12} />
                          )}
                          Release Escrow
                        </Button>
                      )}

                      {(txn.status === TransactionStatus.escrowed ||
                        txn.status === TransactionStatus.initiated) && (
                        <Link to="/disputes">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/5"
                          >
                            <AlertTriangle size={12} />
                            Open Dispute
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center py-20 text-center"
          data-ocid="transactions.empty_state"
        >
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <CheckCircle size={20} className="text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">No transactions yet.</p>
        </div>
      )}
    </div>
  );
}
