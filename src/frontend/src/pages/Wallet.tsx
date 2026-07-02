import { ArrowLeft, Lock, CheckCircle, AlertTriangle, Shield, ArrowDownLeft, ArrowUpRight, X, Copy, Loader2, Camera } from "lucide-react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const DEPOSIT_ADDRESS = "TNjaCQjQ5Yzm5tiVF8s121rUv5BH7y6hAC";

interface WalletTx {
  id: string;
  type: string;
  amount: number;
  status: string;
  notes: string | null;
  receipt_url: string | null;
  created_at: string;
}

export function Wallet() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState("seeker");
  const [walletBalance, setWalletBalance] = useState(0);
  const [securityDeposit, setSecurityDeposit] = useState(0);
  const [activeAdsCount, setActiveAdsCount] = useState(0);
  const [activeDisputesCount, setActiveDisputesCount] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [transactions, setTransactions] = useState<WalletTx[]>([]);
  const [referenceCode, setReferenceCode] = useState("");

  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showCloseAccount, setShowCloseAccount] = useState(false);
  const [amount, setAmount] = useState("");
  const [depositStep, setDepositStep] = useState(0);
  const [txHash, setTxHash] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [closeStep, setCloseStep] = useState(0);
  const [confirmText, setConfirmText] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void loadWallet();
  }, []);

  async function loadWallet() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setLoading(false);
      void navigate({ to: "/login" });
      return;
    }
    const uid = userData.user.id;
    setUserId(uid);

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, wallet_balance, security_deposit")
      .eq("id", uid)
      .single();

    setRole(profile?.role ?? "seeker");
    setWalletBalance(Number(profile?.wallet_balance ?? 0));
    setSecurityDeposit(Number(profile?.security_deposit ?? 0));

    const { count: adsCount } = await supabase
      .from("ads").select("id", { count: "exact", head: true })
      .eq("provider_id", uid).eq("status", "active");
    setActiveAdsCount(adsCount ?? 0);

    const { count: disputesCount } = await supabase
      .from("disputes").select("id, transactions!inner(buyer_id, seller_id)", { count: "exact", head: true })
      .or(`buyer_id.eq.${uid},seller_id.eq.${uid}`, { foreignTable: "transactions" })
      .in("status", ["open", "under_review"]);
    setActiveDisputesCount(disputesCount ?? 0);

    const { count: pendingCount } = await supabase
      .from("transactions").select("id", { count: "exact", head: true })
      .or(`buyer_id.eq.${uid},seller_id.eq.${uid}`)
      .in("status", ["escrow_active", "in_progress"]);
    setPendingOrdersCount(pendingCount ?? 0);

    const { data: txs } = await supabase
      .from("wallet_transactions")
      .select("id, type, amount, status, notes, receipt_url, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(30);
    setTransactions(txs ?? []);

    setReferenceCode(`CRX-${uid.slice(0, 8).toUpperCase()}`);
    setLoading(false);
  }

  const canWithdraw = activeDisputesCount === 0 && pendingOrdersCount === 0;
  const canCloseAccount = activeAdsCount === 0 && activeDisputesCount === 0 && pendingOrdersCount === 0;

  const copyAddress = () => {
    navigator.clipboard.writeText(DEPOSIT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  function handleReceiptSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
  }

  async function submitDepositRequest() {
    if (!userId || !amount) return;
    if (!receiptFile) {
      alert("Please upload a screenshot of your payment receipt before submitting.");
      return;
    }
    setSubmitting(true);

    let receiptUrl: string | null = null;
    try {
      const ext = receiptFile.name.split(".").pop() || "jpg";
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("deposit-receipts").upload(path, receiptFile, {
        contentType: receiptFile.type || "image/jpeg",
      });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("deposit-receipts").getPublicUrl(path);
      receiptUrl = urlData.publicUrl;
    } catch (err: any) {
      alert("Failed to upload receipt: " + (err.message ?? "unknown error"));
      setSubmitting(false);
      return;
    }

    await supabase.from("wallet_transactions").insert({
      user_id: userId,
      type: "deposit",
      amount: Number(amount),
      reference_code: referenceCode,
      status: "pending",
      receipt_url: receiptUrl,
      notes: txHash ? `Manual USDT deposit — TX: ${txHash}` : "Manual USDT deposit — pending admin confirmation",
    });

    setSubmitting(false);
    setDepositStep(2);
  }

  async function submitWithdrawalRequest(address: string) {
    if (!userId || !amount) return;
    setSubmitting(true);
    await supabase.from("wallet_transactions").insert({
      user_id: userId,
      type: "withdrawal",
      amount: -Number(amount),
      status: "pending",
      notes: `Withdrawal request to ${address}`,
    });
    setSubmitting(false);
    setShowWithdraw(false);
    setAmount("");
    alert("Withdrawal request submitted! Our team will process it within 24 hours.");
  }

  async function closeAccount() {
    if (!userId) return;
    setSubmitting(true);
    await supabase.from("profiles").update({ role: "seeker" }).eq("id", userId);
    await supabase.from("wallet_transactions").insert({
      user_id: userId,
      type: "refund",
      amount: securityDeposit,
      status: "pending",
      notes: "Security deposit release — 72 hour hold after account closure",
    });
    setSubmitting(false);
    setCloseStep(2);
  }

  function resetDepositModal() {
    setShowDeposit(false);
    setDepositStep(0);
    setAmount("");
    setTxHash("");
    setReceiptFile(null);
    setReceiptPreview(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-gray-300" size={28} />
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-8">

      {/* HEADER */}
      <div className="bg-white px-4 py-3 flex items-center gap-2 border-b border-gray-100">
        <button onClick={() => void navigate({ to: "/" })} className="p-1.5 rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <span className="font-bold text-gray-800 text-sm">Wallet</span>
        {role === "provider" && (
          <span className="ml-auto text-[10px] font-bold text-[#9c7a1f] bg-[#FBF3E1] border border-[#D4AF37]/30 px-2 py-0.5 rounded-full">
            Provider Account
          </span>
        )}
      </div>

      {/* MAIN BALANCE CARD */}
      <div className="mx-4 mt-4">
        <div className="bg-gradient-to-br from-[#00302e] to-[#004B49] rounded-3xl p-5 shadow-lg">
          <div className="text-white/60 text-xs mb-1">Available Balance</div>
          <div className="text-4xl font-black text-white mb-1">
            ${walletBalance.toFixed(2)} <span className="text-lg font-semibold text-white/60">USDT</span>
          </div>
          {role === "provider" && (
            <div className="flex items-center gap-1.5 mt-1">
              <Lock size={11} className="text-white/40" />
              <span className="text-white/40 text-xs">Security Deposit Locked: ${securityDeposit.toFixed(2)} USDT</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button onClick={() => setShowDeposit(true)} className="bg-white/15 rounded-2xl py-2.5 flex flex-col items-center gap-1">
              <ArrowDownLeft size={18} className="text-white" />
              <span className="text-white text-xs font-semibold">Deposit</span>
            </button>
            <button onClick={() => setShowWithdraw(true)} className="bg-white/15 rounded-2xl py-2.5 flex flex-col items-center gap-1">
              <ArrowUpRight size={18} className="text-white" />
              <span className="text-white text-xs font-semibold">Withdraw</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECURITY DEPOSIT — Provider only */}
      {role === "provider" && (
        <div className="mx-4 mt-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#D4AF37]/25">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#FBF3E1] rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield size={20} className="text-[#9c7a1f]" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-gray-800 text-sm">Security Deposit</div>
                <div className="text-xs text-[#9c7a1f] font-semibold mt-0.5">
                  {securityDeposit > 0 ? `🔒 Locked — $${securityDeposit.toFixed(2)} USDT` : `⚠ No deposit yet`}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-3">
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">Deposit Release Status</div>
              {[
                { label: "Active Listings", ok: activeAdsCount === 0, bad: `${activeAdsCount} active` },
                { label: "Active Disputes", ok: activeDisputesCount === 0, bad: `${activeDisputesCount} dispute` },
                { label: "Pending Orders", ok: pendingOrdersCount === 0, bad: `${pendingOrdersCount} pending` },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                  <span className="text-xs text-gray-500">{item.label}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.ok ? "bg-green-50 text-green-500" : "bg-red-50 text-red-400"}`}>
                    {item.ok ? "✓ Clear" : item.bad}
                  </span>
                </div>
              ))}
            </div>
            {canCloseAccount ? (
              <button onClick={() => setShowCloseAccount(true)} className="w-full bg-red-500 text-white font-bold py-3 rounded-xl text-sm">
                Close Account & Withdraw Deposit
              </button>
            ) : (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                <div className="text-xs font-bold text-red-500 mb-1">Cannot Release Deposit</div>
                <div className="text-[11px] text-red-400">
                  {activeDisputesCount > 0 ? "Resolve all disputes first. " : ""}
                  {pendingOrdersCount > 0 ? "Complete all pending orders first. " : ""}
                  {activeAdsCount > 0 ? "Remove all active listings first." : ""}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TRANSACTIONS */}
      <div className="mx-4 mt-4">
        <div className="text-sm font-bold text-gray-800 mb-3">Transaction History</div>
        {transactions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="text-2xl mb-2">💳</div>
            <div className="text-sm font-bold text-gray-400">No transactions yet</div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {transactions.map((tx, i) => {
              const Icon = tx.type === "earning" ? CheckCircle : tx.type === "fee" ? X : tx.type === "deposit" ? ArrowDownLeft : tx.type === "withdrawal" ? ArrowUpRight : Lock;
              return (
                <div key={tx.id} className={`flex items-center gap-3 px-4 py-3.5 ${i < transactions.length - 1 ? "border-b border-gray-50" : ""}`}>
                  {tx.receipt_url ? (
                    <a href={tx.receipt_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                      <img src={tx.receipt_url} alt="Receipt" className="w-9 h-9 rounded-xl object-cover border border-gray-100" />
                    </a>
                  ) : (
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      tx.type === "earning" ? "bg-green-50" : tx.type === "fee" ? "bg-red-50" : tx.status === "pending" ? "bg-[#FBF3E1]" : "bg-[#E8F0EF]"
                    }`}>
                      <Icon size={16} className={
                        tx.type === "earning" ? "text-green-500" : tx.type === "fee" ? "text-red-400" : tx.status === "pending" ? "text-[#9c7a1f]" : "text-[#004B49]"
                      } />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-800 truncate capitalize">{tx.notes || tx.type}</div>
                    <div className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`font-bold text-sm ${tx.amount > 0 ? "text-green-500" : "text-red-400"}`}>
                      {tx.amount > 0 ? `+$${tx.amount.toFixed(2)}` : `-$${Math.abs(tx.amount).toFixed(2)}`}
                    </div>
                    <div className={`text-[10px] font-semibold capitalize ${tx.status === "pending" ? "text-[#9c7a1f]" : tx.status === "completed" ? "text-green-400" : "text-red-400"}`}>
                      {tx.status}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── DEPOSIT MODAL ── */}
      {showDeposit && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => !submitting && resetDepositModal()} />
          <div className="relative w-full max-w-lg mx-auto bg-white rounded-t-3xl p-6 pb-10 max-h-[90vh] overflow-y-auto">

            {depositStep === 0 && (
              <>
                <div className="text-center mb-5">
                  <div className="font-black text-gray-800 text-lg">Add Funds</div>
                  <div className="text-sm text-gray-500 mt-1">Deposit USDT to your Crossing wallet</div>
                </div>
                <div className="mb-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Amount (USDT)</label>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
                    <span className="text-gray-400 font-bold">$</span>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
                      className="flex-1 bg-transparent text-xl font-black text-gray-800 outline-none" />
                    <span className="text-gray-400 text-sm font-semibold">USDT</span>
                  </div>
                </div>
                <div className="flex gap-2 mb-4">
                  {["100", "250", "500", "1000", "2000"].map((a) => (
                    <button key={a} onClick={() => setAmount(a)}
                      className="flex-1 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold text-gray-600 hover:border-[#004B49] hover:text-[#004B49]">
                      ${a}
                    </button>
                  ))}
                </div>
                <button onClick={() => setDepositStep(1)} disabled={!amount || Number(amount) <= 0}
                  className="w-full bg-[#004B49] text-white font-bold py-4 rounded-2xl text-sm disabled:opacity-40">
                  Continue
                </button>
              </>
            )}

            {depositStep === 1 && (
              <>
                <div className="text-center mb-5">
                  <div className="font-black text-gray-800 text-lg">Send USDT</div>
                  <div className="text-sm text-gray-500 mt-1">Send exactly <span className="font-bold text-gray-800">${amount} USDT</span> to the address below (TRC-20 network)</div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 mb-3">
                  <div className="bg-white rounded-xl p-3 border border-gray-100 mb-2">
                    <div className="text-[10px] text-gray-400 mb-1">Crossing USDT Deposit Address (TRC-20)</div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-mono text-gray-700 break-all flex-1">{DEPOSIT_ADDRESS}</div>
                      <button onClick={copyAddress} className="flex-shrink-0 bg-[#E8F0EF] text-[#004B49] p-1.5 rounded-lg">
                        <Copy size={13} />
                      </button>
                    </div>
                    {copied && <div className="text-[10px] text-green-500 font-bold mt-1">✓ Copied to clipboard</div>}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Payment Receipt Screenshot *</label>
                  {receiptPreview ? (
                    <div className="relative">
                      <img src={receiptPreview} alt="Receipt preview" className="w-full max-h-56 object-contain rounded-xl border border-gray-100 bg-gray-50" />
                      <button onClick={() => { setReceiptFile(null); setReceiptPreview(null); }}
                        className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <label className="border-2 border-dashed border-gray-200 rounded-xl py-5 flex flex-col items-center gap-1.5 cursor-pointer hover:border-[#004B49]/40 transition-all">
                        <Camera size={22} className="text-gray-300" />
                        <span className="text-[11px] font-semibold text-gray-400">📷 Camera</span>
                        <input type="file" accept="image/*" capture="environment" onChange={handleReceiptSelect} className="hidden" />
                      </label>
                      <label className="border-2 border-dashed border-gray-200 rounded-xl py-5 flex flex-col items-center gap-1.5 cursor-pointer hover:border-[#004B49]/40 transition-all">
                        <span className="text-xl">🖼️</span>
                        <span className="text-[11px] font-semibold text-gray-400">Gallery / File</span>
                        <input type="file" accept="image/*" onChange={handleReceiptSelect} className="hidden" />
                      </label>
                    </div>
                  )}
                  <div className="text-[10px] text-gray-400 mt-1">Required — camera se photo lein ya gallery se screenshot chunein.</div>
                </div>

                <div className="mb-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Transaction Hash / TXID (optional)</label>
                  <input value={txHash} onChange={(e) => setTxHash(e.target.value)} placeholder="Paste your blockchain transaction ID"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-xs font-mono text-gray-700 outline-none focus:border-[#004B49]" />
                </div>

                <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
                  <div className="text-xs text-red-600 font-semibold">⚠️ Send only USDT on the TRC-20 network to this address.</div>
                </div>
                <button onClick={() => void submitDepositRequest()} disabled={submitting || !receiptFile}
                  className="w-full bg-[#004B49] text-white font-bold py-4 rounded-2xl text-sm disabled:opacity-60">
                  {submitting ? "Submitting..." : "Submit Deposit Request"}
                </button>
                <button onClick={() => setDepositStep(0)} disabled={submitting} className="w-full mt-2 text-gray-400 text-sm py-2">Back</button>
              </>
            )}

            {depositStep === 2 && (
              <>
                <div className="text-center mb-5">
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle size={26} className="text-green-500" />
                  </div>
                  <div className="font-black text-gray-800 text-lg">Request Submitted!</div>
                  <div className="text-sm text-gray-500 mt-1">Your balance will update once our team confirms the transaction</div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 mb-4 flex flex-col gap-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Amount</span><span className="font-bold">${amount} USDT</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Status</span><span className="font-bold text-[#9c7a1f]">Pending Confirmation</span></div>
                </div>
                <button onClick={() => { resetDepositModal(); void loadWallet(); }}
                  className="w-full bg-[#004B49] text-white font-bold py-4 rounded-2xl text-sm">
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── WITHDRAW MODAL ── */}
      {showWithdraw && (
        <WithdrawModal
          balance={walletBalance}
          canWithdraw={canWithdraw}
          activeDisputesCount={activeDisputesCount}
          pendingOrdersCount={pendingOrdersCount}
          submitting={submitting}
          onClose={() => setShowWithdraw(false)}
          onSubmit={submitWithdrawalRequest}
        />
      )}

      {/* ── CLOSE ACCOUNT MODAL ── */}
      {showCloseAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">

            {closeStep === 0 && (
              <>
                <div className="text-center mb-4">
                  <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle size={26} className="text-red-500" />
                  </div>
                  <div className="font-black text-gray-800 text-lg mb-1">Close Provider Account?</div>
                  <div className="text-sm text-gray-500 leading-relaxed">This will permanently close your provider account and release your ${securityDeposit.toFixed(2)} USDT security deposit.</div>
                </div>
                <button onClick={() => setCloseStep(1)} className="w-full bg-red-500 text-white font-bold py-4 rounded-2xl text-sm mb-2">I Understand — Continue</button>
                <button onClick={() => setShowCloseAccount(false)} className="w-full bg-gray-50 text-gray-500 font-semibold py-3 rounded-2xl text-sm">Cancel</button>
              </>
            )}

            {closeStep === 1 && (
              <>
                <div className="text-center mb-4">
                  <div className="font-black text-gray-800 text-lg mb-1">Final Confirmation</div>
                  <div className="text-sm text-gray-500">Type <span className="font-black text-red-500">CLOSE MY ACCOUNT</span> to confirm</div>
                </div>
                <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="Type: CLOSE MY ACCOUNT"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-red-400 font-mono mb-4" />
                <button
                  onClick={() => { if (confirmText !== "CLOSE MY ACCOUNT") { alert("Please type exactly: CLOSE MY ACCOUNT"); return; } void closeAccount(); }}
                  disabled={confirmText !== "CLOSE MY ACCOUNT" || submitting}
                  className="w-full bg-red-500 text-white font-bold py-4 rounded-2xl text-sm mb-2 disabled:opacity-40">
                  {submitting ? "Processing..." : "Permanently Close Account"}
                </button>
                <button onClick={() => setShowCloseAccount(false)} className="w-full bg-gray-50 text-gray-500 font-semibold py-3 rounded-2xl text-sm">Cancel</button>
              </>
            )}

            {closeStep === 2 && (
              <>
                <div className="text-center mb-4">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle size={26} className="text-green-500" />
                  </div>
                  <div className="font-black text-gray-800 text-lg mb-1">Account Closed</div>
                  <div className="text-sm text-gray-500">Your security deposit will be available for withdrawal after a 72-hour security hold.</div>
                </div>
                <button onClick={() => { setShowCloseAccount(false); setCloseStep(0); void navigate({ to: "/" }); }}
                  className="w-full bg-[#004B49] text-white font-bold py-4 rounded-2xl text-sm">
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

function WithdrawModal({
  balance, canWithdraw, activeDisputesCount, pendingOrdersCount, submitting, onClose, onSubmit,
}: {
  balance: number; canWithdraw: boolean; activeDisputesCount: number; pendingOrdersCount: number;
  submitting: boolean; onClose: () => void; onSubmit: (address: string) => void;
}) {
  const [amt, setAmt] = useState("");
  const [address, setAddress] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-auto bg-white rounded-t-3xl p-6 pb-10">
        <div className="text-center mb-4">
          <div className="font-black text-gray-800 text-lg">Withdraw Funds</div>
          <div className="text-sm text-gray-500 mt-1">Available: ${balance.toFixed(2)} USDT</div>
        </div>

        {!canWithdraw ? (
          <>
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-black text-red-600 mb-1">Cannot Withdraw Right Now</div>
                  <div className="text-xs text-red-500 flex flex-col gap-1">
                    {activeDisputesCount > 0 && <div>• {activeDisputesCount} active dispute(s) must be resolved first</div>}
                    {pendingOrdersCount > 0 && <div>• {pendingOrdersCount} pending order(s) must be completed first</div>}
                  </div>
                </div>
              </div>
            </div>
            <Link to="/disputes">
              <button className="w-full bg-[#004B49] text-white font-bold py-3.5 rounded-2xl text-sm mb-2">View & Resolve Disputes</button>
            </Link>
            <button onClick={onClose} className="w-full bg-gray-50 text-gray-500 font-semibold py-3 rounded-2xl text-sm">Close</button>
          </>
        ) : (
          <>
            <div className="mb-4">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Amount (USDT)</label>
              <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
                <span className="text-gray-400 font-bold">$</span>
                <input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="0.00" max={balance}
                  className="flex-1 bg-transparent text-xl font-black text-gray-800 outline-none" />
                <button onClick={() => setAmt(String(balance))} className="text-[10px] font-bold text-[#004B49] bg-[#E8F0EF] px-2 py-1 rounded-lg">MAX</button>
              </div>
            </div>
            <div className="mb-4">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Your USDT Wallet Address (TRC-20)</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter your wallet address"
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-mono text-gray-700 outline-none focus:border-[#004B49]" />
              <div className="text-[10px] text-gray-400 mt-1">Funds will be sent manually to this address after admin review.</div>
            </div>
            <button
              onClick={() => { if (!amt || !address) { alert("Enter amount and wallet address"); return; } onSubmit(address); }}
              disabled={submitting}
              className="w-full bg-[#004B49] text-white font-bold py-4 rounded-2xl text-sm disabled:opacity-60">
              {submitting ? "Submitting..." : "Submit Withdrawal"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
