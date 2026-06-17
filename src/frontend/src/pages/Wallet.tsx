import { ArrowLeft, Lock, CheckCircle, Clock, AlertTriangle, Shield, ArrowDownLeft, ArrowUpRight, X, Copy } from "lucide-react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";

const USER_ROLE = "provider"; // seeker | provider
const SECURITY_DEPOSIT = 2000;
const ACTIVE_ADS = 3;
const ACTIVE_DISPUTES = 1;
const PENDING_ORDERS = 2;
const AVAILABLE_BALANCE = 1247;

// Mock — real app میں backend سے unique generate ہوگا
const DEPOSIT_ADDRESS = "TQn9Y2khEsLMG6Wg3KqkPFRYz5UY8gh3xZ";
const REFERENCE_CODE = "CRX-8841";

const TRANSACTIONS = [
  { id: 1, type: "deposit", title: "Security Deposit — Provider Account", amount: 2000, date: "June 1, 2026", status: "locked", icon: Lock },
  { id: 2, type: "earning", title: "Payment Released — Canada PR", amount: +463, date: "June 5, 2026", status: "completed", icon: CheckCircle },
  { id: 3, type: "earning", title: "Payment Released — UK Student Visa", amount: +263, date: "May 25, 2026", status: "completed", icon: CheckCircle },
  { id: 4, type: "deposit", title: "USDT Deposit", amount: +500, date: "May 20, 2026", status: "completed", icon: ArrowDownLeft },
  { id: 5, type: "fee", title: "Crossing Fee — Canada PR", amount: -36, date: "June 5, 2026", status: "completed", icon: X },
  { id: 6, type: "fee", title: "Crossing Fee — UK Visa", amount: -36, date: "May 25, 2026", status: "completed", icon: X },
];

export function Wallet() {
  const navigate = useNavigate();
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showCloseAccount, setShowCloseAccount] = useState(false);
  const [amount, setAmount] = useState("");
  const [depositStep, setDepositStep] = useState(0);
  const [closeStep, setCloseStep] = useState(0);
  const [confirmText, setConfirmText] = useState("");
  const [copied, setCopied] = useState(false);

  const canWithdraw = ACTIVE_DISPUTES === 0 && PENDING_ORDERS === 0;
  const canCloseAccount = ACTIVE_ADS === 0 && ACTIVE_DISPUTES === 0 && PENDING_ORDERS === 0;

  const copyAddress = () => {
    navigator.clipboard.writeText(DEPOSIT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col pb-8">

      {/* HEADER */}
      <div className="bg-white px-4 py-3 flex items-center gap-2 border-b border-gray-100">
        <button onClick={() => void navigate({ to: "/" })} className="p-1.5 rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <span className="font-bold text-gray-800 text-sm">Wallet</span>
        {USER_ROLE === "provider" && (
          <span className="ml-auto text-[10px] font-bold text-amber-500 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
            Provider Account
          </span>
        )}
      </div>

      {/* MAIN BALANCE CARD */}
      <div className="mx-4 mt-4">
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#1a56f0] rounded-3xl p-5 shadow-lg">
          <div className="text-white/60 text-xs mb-1">Available Balance</div>
          <div className="text-4xl font-black text-white mb-1">
            ${AVAILABLE_BALANCE} <span className="text-lg font-semibold text-white/60">USDT</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <Lock size={11} className="text-white/40" />
            <span className="text-white/40 text-xs">Security Deposit Locked: ${SECURITY_DEPOSIT} USDT</span>
          </div>
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
      {USER_ROLE === "provider" && (
        <div className="mx-4 mt-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield size={20} className="text-amber-500" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-gray-800 text-sm">Security Deposit</div>
                <div className="text-xs text-amber-500 font-semibold mt-0.5">🔒 Locked — $2,000 USDT</div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 text-xs text-gray-500 mb-3">
              <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />Protects buyers if you fail to deliver</div>
              <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />Dispute refunds deducted from this deposit</div>
              <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />Released only when account is fully closed</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-3">
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">Deposit Release Status</div>
              {[
                { label: "Active Listings", ok: ACTIVE_ADS === 0, bad: `${ACTIVE_ADS} active` },
                { label: "Active Disputes", ok: ACTIVE_DISPUTES === 0, bad: `${ACTIVE_DISPUTES} dispute` },
                { label: "Pending Orders", ok: PENDING_ORDERS === 0, bad: `${PENDING_ORDERS} pending` },
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
                  {ACTIVE_DISPUTES > 0 ? "Resolve all disputes first. " : ""}
                  {PENDING_ORDERS > 0 ? "Complete all pending orders first. " : ""}
                  {ACTIVE_ADS > 0 ? "Remove all active listings first." : ""}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ESCROW STATUS */}
      <div className="mx-4 mt-3">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock size={14} className="text-[#1a56f0]" />
            <span className="text-sm font-bold text-[#1a56f0]">Active Escrow</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-600">Canada PR — ImmigrationPro</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Locked June 10 · Step 2 of 5</div>
            </div>
            <div className="text-right">
              <div className="font-black text-gray-800">$499</div>
              <div className="text-[10px] text-amber-500 font-semibold">In Escrow</div>
            </div>
          </div>
          <div className="mt-2 h-1.5 bg-white rounded-full overflow-hidden">
            <div className="h-full bg-[#1a56f0] rounded-full" style={{ width: "40%" }} />
          </div>
          <div className="text-[10px] text-gray-400 mt-1">Step 2 of 5 complete</div>
        </div>
      </div>

      {/* FEE TRANSPARENCY CARD */}
      <div className="mx-4 mt-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-2">💰 How Crossing Fees Work</div>
          <div className="text-xs text-gray-500 leading-relaxed mb-2">
            On every confirmed visa case, Crossing charges a flat <span className="font-bold text-gray-800">$36 USDT</span> fee from the Buyer and a separate <span className="font-bold text-gray-800">$36 USDT</span> fee from the Seller — total $72 per deal. No deposit or withdrawal fees right now.
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Example: $400 listing</span>
              <span></span>
            </div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Buyer pays</span>
              <span className="font-bold text-gray-700">$400 + $36 = $436</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Seller receives</span>
              <span className="font-bold text-gray-700">$400 − $36 = $364</span>
            </div>
          </div>
        </div>
      </div>

      {/* TRANSACTIONS */}
      <div className="mx-4 mt-4">
        <div className="text-sm font-bold text-gray-800 mb-3">Transaction History</div>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {TRANSACTIONS.map((tx, i) => (
            <div key={tx.id} className={`flex items-center gap-3 px-4 py-3.5 ${i < TRANSACTIONS.length - 1 ? "border-b border-gray-50" : ""}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                tx.type === "earning" ? "bg-green-50" : tx.type === "fee" ? "bg-red-50" : tx.status === "locked" ? "bg-amber-50" : "bg-blue-50"
              }`}>
                <tx.icon size={16} className={
                  tx.type === "earning" ? "text-green-500" : tx.type === "fee" ? "text-red-400" : tx.status === "locked" ? "text-amber-500" : "text-[#1a56f0]"
                } />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-800 truncate">{tx.title}</div>
                <div className="text-xs text-gray-400">{tx.date}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className={`font-bold text-sm ${tx.status === "locked" ? "text-amber-500" : tx.amount > 0 ? "text-green-500" : "text-red-400"}`}>
                  {tx.status === "locked" ? "🔒 Locked" : tx.amount > 0 ? `+$${tx.amount}` : `-$${Math.abs(tx.amount)}`}
                </div>
                <div className={`text-[10px] font-semibold ${tx.status === "locked" ? "text-amber-400" : tx.status === "completed" ? "text-green-400" : "text-gray-400"}`}>
                  {tx.status === "locked" ? "Security Deposit" : tx.status === "completed" ? "Completed" : "Pending"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── DEPOSIT MODAL ── */}
      {showDeposit && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowDeposit(false); setDepositStep(0); setAmount(""); }} />
          <div className="relative w-full max-w-lg mx-auto bg-white rounded-t-3xl p-6 pb-10">

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
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="flex-1 bg-transparent text-xl font-black text-gray-800 outline-none" />
                    <span className="text-gray-400 text-sm font-semibold">USDT</span>
                  </div>
                </div>
                <div className="flex gap-2 mb-4">
                  {["100","250","500","1000","2000"].map(a => (
                    <button key={a} onClick={() => setAmount(a)}
                      className="flex-1 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold text-gray-600 hover:border-[#1a56f0] hover:text-[#1a56f0]">
                      ${a}
                    </button>
                  ))}
                </div>
                <button onClick={() => setDepositStep(1)} disabled={!amount || Number(amount) <= 0}
                  className="w-full bg-[#1a56f0] text-white font-bold py-4 rounded-2xl text-sm disabled:opacity-40">
                  Continue
                </button>
              </>
            )}

            {depositStep === 1 && (
              <>
                <div className="text-center mb-5">
                  <div className="font-black text-gray-800 text-lg">Send USDT</div>
                  <div className="text-sm text-gray-500 mt-1">Send exactly <span className="font-bold text-gray-800">${amount} USDT</span> to your deposit address below</div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 mb-3">
                  <div className="w-32 h-32 bg-gray-200 rounded-xl mx-auto mb-3 flex items-center justify-center">
                    <span className="text-xs text-gray-400">QR Code</span>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-100 mb-2">
                    <div className="text-[10px] text-gray-400 mb-1">Your USDT Deposit Address</div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-mono text-gray-700 break-all flex-1">{DEPOSIT_ADDRESS}</div>
                      <button onClick={copyAddress} className="flex-shrink-0 bg-blue-50 text-[#1a56f0] p-1.5 rounded-lg">
                        <Copy size={13} />
                      </button>
                    </div>
                    {copied && <div className="text-[10px] text-green-500 font-bold mt-1">✓ Copied to clipboard</div>}
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                    <div className="text-[10px] text-amber-600 mb-1 font-bold">⚠️ Important — Add this reference in your transaction memo:</div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-mono font-black text-amber-700 flex-1">{REFERENCE_CODE}</div>
                      <button onClick={() => navigator.clipboard.writeText(REFERENCE_CODE)} className="flex-shrink-0 bg-amber-100 text-amber-700 p-1.5 rounded-lg">
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
                  <div className="text-xs text-red-600 font-semibold">⚠️ Send only USDT (any network) to this address. Always include your reference code so we can credit your account correctly.</div>
                </div>

                <button onClick={() => setDepositStep(2)} className="w-full bg-[#1a56f0] text-white font-bold py-4 rounded-2xl text-sm">
                  I've Sent the Payment
                </button>
                <button onClick={() => setDepositStep(0)} className="w-full mt-2 text-gray-400 text-sm py-2">
                  Back
                </button>
              </>
            )}

            {depositStep === 2 && (
              <>
                <div className="text-center mb-5">
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle size={26} className="text-green-500" />
                  </div>
                  <div className="font-black text-gray-800 text-lg">Payment Submitted!</div>
                  <div className="text-sm text-gray-500 mt-1">Your balance will update within 10–30 minutes once confirmed</div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 mb-4 flex flex-col gap-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Amount</span><span className="font-bold">${amount} USDT</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Reference</span><span className="font-bold font-mono">{REFERENCE_CODE}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Status</span><span className="font-bold text-amber-500">Pending Confirmation</span></div>
                </div>
                <button onClick={() => { setShowDeposit(false); setDepositStep(0); setAmount(""); }}
                  className="w-full bg-[#1a56f0] text-white font-bold py-4 rounded-2xl text-sm">
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── WITHDRAW MODAL ── */}
      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowWithdraw(false)} />
          <div className="relative w-full max-w-lg mx-auto bg-white rounded-t-3xl p-6 pb-10">
            <div className="text-center mb-4">
              <div className="font-black text-gray-800 text-lg">Withdraw Funds</div>
              <div className="text-sm text-gray-500 mt-1">Available: ${AVAILABLE_BALANCE} USDT</div>
            </div>

            {!canWithdraw ? (
              <>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-black text-red-600 mb-1">Cannot Withdraw Right Now</div>
                      <div className="text-xs text-red-500 flex flex-col gap-1">
                        {ACTIVE_DISPUTES > 0 && <div>• {ACTIVE_DISPUTES} active dispute(s) must be resolved first</div>}
                        {PENDING_ORDERS > 0 && <div>• {PENDING_ORDERS} pending order(s) must be completed first</div>}
                      </div>
                    </div>
                  </div>
                </div>
                <Link to="/disputes">
                  <button className="w-full bg-[#1a56f0] text-white font-bold py-3.5 rounded-2xl text-sm mb-2">View & Resolve Disputes</button>
                </Link>
                <button onClick={() => setShowWithdraw(false)} className="w-full bg-gray-50 text-gray-500 font-semibold py-3 rounded-2xl text-sm">Close</button>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Amount (USDT)</label>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
                    <span className="text-gray-400 font-bold">$</span>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" max={AVAILABLE_BALANCE}
                      className="flex-1 bg-transparent text-xl font-black text-gray-800 outline-none" />
                    <button onClick={() => setAmount(String(AVAILABLE_BALANCE))} className="text-[10px] font-bold text-[#1a56f0] bg-blue-50 px-2 py-1 rounded-lg">MAX</button>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Your USDT Wallet Address</label>
                  <input placeholder="Enter your wallet address"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-mono text-gray-700 outline-none focus:border-[#1a56f0]" />
                </div>
                <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-4">
                  <div className="text-[11px] text-green-700 font-semibold">✓ Account in good standing — withdrawal available. No fees right now.</div>
                </div>
                <button onClick={() => { alert("Withdrawal request submitted! Processed within 24 hours."); setShowWithdraw(false); setAmount(""); }}
                  className="w-full bg-[#1a56f0] text-white font-bold py-4 rounded-2xl text-sm">
                  Submit Withdrawal
                </button>
              </>
            )}
          </div>
        </div>
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
                  <div className="text-sm text-gray-500 leading-relaxed">This will permanently close your provider account and release your $2,000 USDT security deposit.</div>
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
                <input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="Type: CLOSE MY ACCOUNT"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-red-400 font-mono mb-4" />
                <button
                  onClick={() => { if (confirmText !== "CLOSE MY ACCOUNT") { alert("Please type exactly: CLOSE MY ACCOUNT"); return; } setCloseStep(2); }}
                  disabled={confirmText !== "CLOSE MY ACCOUNT"}
                  className="w-full bg-red-500 text-white font-bold py-4 rounded-2xl text-sm mb-2 disabled:opacity-40">
                  Permanently Close Account
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
                  <div className="text-sm text-gray-500">$2,000 USDT will be available for withdrawal after 72-hour security hold.</div>
                </div>
                <button onClick={() => { setShowCloseAccount(false); setCloseStep(0); void navigate({ to: "/" }); }}
                  className="w-full bg-[#1a56f0] text-white font-bold py-4 rounded-2xl text-sm">
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
