import { ArrowLeft, Plus, ArrowDownLeft, ArrowUpRight, Lock, CheckCircle, Clock } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export function Wallet() {
  const navigate = useNavigate();
  const [showDeposit, setShowDeposit] = useState(false);
  const [amount, setAmount] = useState("");
  const [depositStep, setDepositStep] = useState(0);

  const transactions = [
    { id: 1, type: "escrow_lock", title: "Escrow Locked — Canada PR", amount: -499, date: "June 10, 2026", status: "locked", icon: Lock },
    { id: 2, type: "deposit", title: "USDT Deposit", amount: +700, date: "June 8, 2026", status: "completed", icon: ArrowDownLeft },
    { id: 3, type: "release", title: "Escrow Released — UK Visa", amount: +299, date: "June 1, 2026", status: "completed", icon: CheckCircle },
    { id: 4, type: "deposit", title: "USDT Deposit", amount: +500, date: "May 25, 2026", status: "completed", icon: ArrowDownLeft },
    { id: 5, type: "escrow_lock", title: "Escrow Locked — UAE Work Visa", amount: -199, date: "May 20, 2026", status: "released", icon: Lock },
  ];

  const balance = 502;
  const escrowHeld = 499;

  return (
    <div className="flex flex-col pb-8">

      {/* BACK */}
      <div className="bg-white px-4 py-3 flex items-center gap-2 border-b border-gray-100">
        <button onClick={() => void navigate({ to: "/" })} className="p-1.5 rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <span className="font-bold text-gray-800 text-sm">Wallet</span>
      </div>

      {/* BALANCE CARD */}
      <div className="mx-4 mt-4">
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#1a56f0] rounded-3xl p-5 shadow-lg">
          <div className="text-white/60 text-xs mb-1">Available Balance</div>
          <div className="text-4xl font-black text-white mb-1">
            ${balance} <span className="text-lg font-semibold text-white/60">USDT</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <Lock size={12} className="text-white/50" />
            <span className="text-white/50 text-xs">Escrow Held: ${escrowHeld} USDT</span>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            <button
              onClick={() => setShowDeposit(true)}
              className="bg-white/15 rounded-2xl py-2.5 flex flex-col items-center gap-1"
            >
              <ArrowDownLeft size={18} className="text-white" />
              <span className="text-white text-xs font-semibold">Deposit</span>
            </button>
            <button
              onClick={() => alert("Withdrawal available after KYC Level 3")}
              className="bg-white/15 rounded-2xl py-2.5 flex flex-col items-center gap-1"
            >
              <ArrowUpRight size={18} className="text-white" />
              <span className="text-white text-xs font-semibold">Withdraw</span>
            </button>
            <button
              onClick={() => void navigate({ to: "/transactions" })}
              className="bg-white/15 rounded-2xl py-2.5 flex flex-col items-center gap-1"
            >
              <Clock size={18} className="text-white" />
              <span className="text-white text-xs font-semibold">History</span>
            </button>
          </div>
        </div>
      </div>

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
              <div className="text-xs text-gray-400 mt-0.5">Locked June 10 · Step 2 of 5</div>
            </div>
            <div className="text-right">
              <div className="font-black text-gray-800">$499</div>
              <div className="text-[10px] text-amber-500 font-semibold">In Progress</div>
            </div>
          </div>
          <div className="mt-3 bg-white rounded-xl p-2">
            <div className="flex gap-1">
              {[1,2,3,4,5].map((s) => (
                <div key={s} className={`flex-1 h-1.5 rounded-full ${s <= 2 ? "bg-[#1a56f0]" : "bg-gray-200"}`} />
              ))}
            </div>
            <div className="text-[10px] text-gray-500 mt-1.5">Step 2 of 5 — Documents submitted</div>
          </div>
        </div>
      </div>

      {/* TRANSACTIONS */}
      <div className="mx-4 mt-4">
        <div className="text-sm font-bold text-gray-800 mb-3">Recent Transactions</div>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {transactions.map((tx, i) => (
            <div key={tx.id} className={`flex items-center gap-3 px-4 py-3.5 ${i < transactions.length - 1 ? "border-b border-gray-50" : ""}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                tx.type === "deposit" ? "bg-green-50" :
                tx.type === "release" ? "bg-blue-50" : "bg-amber-50"
              }`}>
                <tx.icon size={16} className={
                  tx.type === "deposit" ? "text-green-500" :
                  tx.type === "release" ? "text-[#1a56f0]" : "text-amber-500"
                } />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-800 truncate">{tx.title}</div>
                <div className="text-xs text-gray-400">{tx.date}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className={`font-bold text-sm ${tx.amount > 0 ? "text-green-500" : "text-gray-800"}`}>
                  {tx.amount > 0 ? "+" : ""}{tx.amount} USDT
                </div>
                <div className={`text-[10px] font-semibold ${
                  tx.status === "completed" ? "text-green-500" :
                  tx.status === "locked" ? "text-amber-500" : "text-blue-500"
                }`}>
                  {tx.status === "completed" ? "Completed" :
                   tx.status === "locked" ? "In Escrow" : "Released"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DEPOSIT MODAL */}
      {showDeposit && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowDeposit(false); setDepositStep(0); }} />
          <div className="relative w-full max-w-lg mx-auto bg-white rounded-t-3xl p-6 pb-10">

            {depositStep === 0 && (
              <>
                <div className="text-center mb-6">
                  <div className="font-black text-gray-800 text-lg">Add Funds</div>
                  <div className="text-sm text-gray-500 mt-1">Deposit USDT to your Crossing wallet</div>
                </div>
                <div className="mb-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Amount (USDT)</label>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
                    <span className="text-gray-400 font-bold">$</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="flex-1 bg-transparent text-xl font-black text-gray-800 outline-none"
                    />
                    <span className="text-gray-400 text-sm font-semibold">USDT</span>
                  </div>
                </div>
                <div className="flex gap-2 mb-4">
                  {["100", "250", "500", "1000"].map((a) => (
                    <button key={a} onClick={() => setAmount(a)}
                      className="flex-1 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold text-gray-600 hover:border-[#1a56f0] hover:text-[#1a56f0]">
                      ${a}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setDepositStep(1)}
                  disabled={!amount || Number(amount) <= 0}
                  className="w-full bg-[#1a56f0] text-white font-bold py-4 rounded-2xl text-sm disabled:opacity-40"
                >
                  Continue
                </button>
              </>
            )}

            {depositStep === 1 && (
              <>
                <div className="text-center mb-5">
                  <div className="font-black text-gray-800 text-lg">Send USDT (TRC-20)</div>
                  <div className="text-sm text-gray-500 mt-1">Send exactly ${amount} USDT to this address</div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                  <div className="w-32 h-32 bg-gray-200 rounded-xl mx-auto mb-3 flex items-center justify-center">
                    <span className="text-xs text-gray-400">QR Code</span>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-gray-100">
                    <div className="text-[10px] text-gray-400 mb-1">Wallet Address (TRC-20)</div>
                    <div className="text-xs font-mono text-gray-700 break-all">TXxxx...crossingescrow...xxx</div>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4">
                  <div className="text-xs text-amber-700 font-semibold">⚠️ Send only USDT TRC-20 to this address. Other tokens will be lost.</div>
                </div>
                <button
                  onClick={() => setDepositStep(2)}
                  className="w-full bg-[#1a56f0] text-white font-bold py-4 rounded-2xl text-sm"
                >
                  I've Sent the Payment
                </button>
              </>
            )}

            {depositStep === 2 && (
              <>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle size={24} className="text-green-500" />
                  </div>
                  <div className="font-black text-gray-800 text-lg">Payment Submitted!</div>
                  <div className="text-sm text-gray-500 mt-1">We will confirm your deposit within 10-30 minutes</div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 mb-4 flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Amount</span>
                    <span className="font-bold text-gray-800">${amount} USDT</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Network</span>
                    <span className="font-bold text-gray-800">TRC-20</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Status</span>
                    <span className="font-bold text-amber-500">Pending Confirmation</span>
                  </div>
                </div>
                <button
                  onClick={() => { setShowDeposit(false); setDepositStep(0); setAmount(""); }}
                  className="w-full bg-[#1a56f0] text-white font-bold py-4 rounded-2xl text-sm"
                >
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
