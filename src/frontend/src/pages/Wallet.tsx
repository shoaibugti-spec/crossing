import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Plus,
  TrendingUp,
  Wallet as WalletIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { WALLET_TRANSACTIONS } from "../lib/mockData";

export function Wallet() {
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const balance = 627.5;

  const handleDeposit = () => {
    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    toast.success(`$${Number(amount).toFixed(2)} deposit initiated`);
    setDepositOpen(false);
    setAmount("");
  };

  const handleWithdraw = () => {
    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (Number(amount) > balance) {
      toast.error("Insufficient balance");
      return;
    }
    toast.success(`$${Number(amount).toFixed(2)} withdrawal initiated`);
    setWithdrawOpen(false);
    setAmount("");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">
        Wallet
      </h1>

      {/* Balance Card */}
      <Card className="border-border/60 shadow-card mb-6 gradient-hero text-white overflow-hidden relative">
        <div className="absolute right-0 top-0 w-48 h-48 rounded-full bg-white/5 -mr-12 -mt-12" />
        <CardContent className="p-8 relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <WalletIcon size={16} className="text-white/70" />
                <span className="text-white/70 text-sm">Available Balance</span>
              </div>
              <p className="font-display text-5xl font-bold text-white mb-1">
                ${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
              <span className="text-white/60 text-sm">USD</span>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-green-400 text-sm font-medium">
                <TrendingUp size={14} />
                +$450 this month
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
              <DialogTrigger asChild>
                <Button
                  className="gap-2 bg-white text-navy hover:bg-white/90 flex-1"
                  data-ocid="wallet.deposit_button"
                >
                  <Plus size={15} />
                  Deposit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Deposit Funds</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="deposit-amount">Amount (USD)</Label>
                    <Input
                      id="deposit-amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      data-ocid="wallet.deposit_input"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[100, 250, 500, 1000].map((v) => (
                      <button
                        type="button"
                        key={v}
                        onClick={() => setAmount(String(v))}
                        className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-primary/5 hover:border-primary/50 transition-colors"
                      >
                        ${v}
                      </button>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                    Payment methods: Card, Bank Transfer, Crypto
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDepositOpen(false)}
                    data-ocid="wallet.deposit_cancel_button"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeposit}
                    data-ocid="wallet.deposit_confirm_button"
                  >
                    Deposit ${amount || "0"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 border-white/30 text-white hover:bg-white/10 flex-1"
                  data-ocid="wallet.withdraw_button"
                >
                  <ArrowDownCircle size={15} />
                  Withdraw
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Withdraw Funds</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="withdraw-amount">Amount (USD)</Label>
                    <Input
                      id="withdraw-amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      data-ocid="wallet.withdraw_input"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Available: ${balance.toFixed(2)}
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setWithdrawOpen(false)}
                    data-ocid="wallet.withdraw_cancel_button"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleWithdraw}
                    data-ocid="wallet.withdraw_confirm_button"
                  >
                    Withdraw ${amount || "0"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Total Deposited",
            value: "$1,000",
            icon: ArrowUpCircle,
            color: "text-green-600",
          },
          {
            label: "Total Withdrawn",
            value: "$0",
            icon: ArrowDownCircle,
            color: "text-red-500",
          },
          {
            label: "In Escrow",
            value: "$680",
            icon: WalletIcon,
            color: "text-amber-600",
          },
          {
            label: "Total Earned",
            value: "$450",
            icon: TrendingUp,
            color: "text-blue-600",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-border/60">
            <CardContent className="p-4">
              <Icon size={16} className={`${color} mb-2`} />
              <p className="font-display font-bold text-lg text-foreground">
                {value}
              </p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Transaction History */}
      <Card className="border-border/60 shadow-card">
        <CardContent className="p-6">
          <h2 className="font-display font-semibold text-foreground mb-4">
            Transaction History
          </h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {WALLET_TRANSACTIONS.map((txn, i) => (
                <TableRow
                  key={txn.id}
                  data-ocid={`wallet.transaction.item.${i + 1}`}
                >
                  <TableCell className="text-sm font-medium">
                    {txn.description}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {txn.date}
                  </TableCell>
                  <TableCell
                    className={`text-sm font-semibold text-right ${txn.amount > 0 ? "text-green-600" : "text-red-500"}`}
                  >
                    {txn.amount > 0 ? "+" : ""}
                    {txn.currency} {Math.abs(txn.amount).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs badge-success">
                      {txn.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
