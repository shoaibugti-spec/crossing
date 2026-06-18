import { ArrowLeft, Search, ChevronDown, ChevronUp, MessageCircle, Shield, Mail } from "lucide-react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";

const FAQS = [
  {
    category: "Payments & Escrow",
    icon: "🔒",
    questions: [
      {
        q: "How does Escrow work?",
        a: "When you deposit funds, they are locked in Crossing Escrow — not sent to the provider. Funds are only released after you confirm receipt of your visa documents. If anything goes wrong, you can file a dispute and get a full refund.",
      },
      {
        q: "What currency do you use?",
        a: "Crossing uses USDT (Tether) on TRC-20 network for all payments. This ensures fast, borderless transactions with low fees. No bank account needed.",
      },
      {
        q: "When are funds released to the provider?",
        a: "Funds are released only after you confirm that your visa has been successfully received. You must click 'Confirm Visa Received' in the Transactions page. Never confirm before receiving your documents.",
      },
      {
        q: "What if I want a refund?",
        a: "If your visa is rejected or the provider fails to deliver, you can file a dispute. Admin will review evidence from both sides and issue a refund if fraud or failure is confirmed.",
      },
    ],
  },
  {
    category: "Verification & KYC",
    icon: "✅",
    questions: [
      {
        q: "Why do I need to verify my identity?",
        a: "KYC verification builds trust between buyers and sellers. Verified users get higher trust scores, can access Escrow payments, and are less likely to be scammed.",
      },
      {
        q: "How long does KYC take?",
        a: "Level 1 (Email) and Level 2 (Phone) are instant. Level 3 (Identity) takes 24-48 hours for admin review. Level 4 (Business) takes 3-5 business days.",
      },
      {
        q: "What documents are accepted for Level 3?",
        a: "Passport, National ID card, or Driving License. The document must be valid, clearly readable, and match your registered name.",
      },
    ],
  },
  {
    category: "Visa Providers",
    icon: "🏢",
    questions: [
      {
        q: "How are providers verified?",
        a: "Providers must complete Level 4 KYC including business registration, trade license, and office address verification. All documents are reviewed by our admin team before approval.",
      },
      {
        q: "What if a provider disappears after payment?",
        a: "Your funds are safe in Escrow — the provider never receives your money until you confirm delivery. If they stop responding, file a dispute immediately and admin will intervene.",
      },
      {
        q: "Can I negotiate the price?",
        a: "Yes! Use the in-app chat to message the provider directly and negotiate pricing before making a deposit.",
      },
    ],
  },
  {
    category: "Disputes",
    icon: "⚖️",
    questions: [
      {
        q: "How do I file a dispute?",
        a: "Go to Disputes page → File New Dispute → Select the transaction → Choose reason → Add details and evidence → Submit. Admin will review within 24 hours.",
      },
      {
        q: "How long does a dispute take?",
        a: "Most disputes are resolved within 3-7 business days. Complex cases may take up to 14 days. During this time, Escrow funds remain locked.",
      },
      {
        q: "What evidence should I provide?",
        a: "Screenshots of chat conversations, documents submitted, any promises made by the provider, and timeline of events. More evidence = faster resolution.",
      },
    ],
  },
];

export function Help() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [openQ, setOpenQ] = useState<string | null>(null);

  const filtered = FAQS.map((cat) => ({
    ...cat,
    questions: cat.questions.filter(
      (q) =>
        !search ||
        q.q.toLowerCase().includes(search.toLowerCase()) ||
        q.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.questions.length > 0);

  return (
    <div className="flex flex-col pb-8">

      {/* HEADER */}
      <div className="bg-white px-4 py-3 flex items-center gap-2 border-b border-gray-100">
        <button
          onClick={() => void navigate({ to: "/" })}
          className="p-1.5 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <span className="font-bold text-gray-800 text-sm">Help & Safety Center</span>
      </div>

      {/* HERO */}
      <div className="bg-gradient-to-br from-[#00302e] to-[#004B49] px-6 py-6 text-center">
        <div className="text-2xl mb-2">🎧</div>
        <div className="text-white font-black text-lg mb-1">How can we help?</div>
        <div className="text-white/60 text-xs mb-4">Find answers to common questions</div>
        <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-3">
          <Search size={16} className="text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search help articles..."
            className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* QUICK LINKS */}
      <div className="mx-4 mt-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: "🔒", label: "Escrow", link: "/wallet" },
            { icon: "⚖️", label: "Disputes", link: "/disputes" },
            { icon: "✅", label: "KYC", link: "/kyc" },
          ].map(({ icon, label, link }) => (
            <Link key={label} to={link as "/"}>
              <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
                <div className="text-xl mb-1">{icon}</div>
                <div className="text-xs font-bold text-gray-700">{label}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* FAQS */}
      <div className="mx-4 mt-4 flex flex-col gap-4">
        {filtered.map((cat) => (
          <div key={cat.category}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">{cat.icon}</span>
              <span className="text-sm font-black text-gray-800">{cat.category}</span>
            </div>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {cat.questions.map((item, i) => (
                <div key={item.q}>
                  <button
                    onClick={() => setOpenQ(openQ === item.q ? null : item.q)}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                  >
                    <span className="text-sm font-semibold text-gray-700 flex-1 pr-2">{item.q}</span>
                    {openQ === item.q
                      ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
                      : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
                  </button>
                  {openQ === item.q && (
                    <div className="px-4 pb-4 text-xs text-gray-500 leading-relaxed border-t border-gray-50 pt-3">
                      {item.a}
                    </div>
                  )}
                  {i < cat.questions.length - 1 && (
                    <div className="h-px bg-gray-50 mx-4" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">🔍</div>
            <div className="text-sm font-bold text-gray-400">No results found</div>
            <div className="text-xs text-gray-300 mt-1">Try different keywords</div>
          </div>
        )}
      </div>

      {/* CONTACT */}
      <div className="mx-4 mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="text-sm font-black text-gray-800 mb-3">Still need help?</div>
          <div className="flex flex-col gap-2">
            <Link to="/messages">
              <button className="w-full flex items-center gap-3 bg-[#004B49]/5 border border-[#004B49]/20 rounded-xl px-4 py-3">
                <MessageCircle size={18} className="text-[#004B49]" />
                <div className="text-left">
                  <div className="text-sm font-bold text-gray-800">Live Chat Support</div>
                  <div className="text-xs text-gray-500">Available 24/7 · Usually replies in minutes</div>
                </div>
              </button>
            </Link>
            <button
              onClick={() => alert("Email: support@crossing.app")}
              className="w-full flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3"
            >
              <Mail size={18} className="text-gray-500" />
              <div className="text-left">
                <div className="text-sm font-bold text-gray-800">Email Support</div>
                <div className="text-xs text-gray-500">support@crossing.app · 24h response</div>
              </div>
            </button>
            <button
              onClick={() => void navigate({ to: "/disputes" })}
              className="w-full flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3"
            >
              <Shield size={18} className="text-gray-500" />
              <div className="text-left">
                <div className="text-sm font-bold text-gray-800">File a Dispute</div>
                <div className="text-xs text-gray-500">For payment and fraud issues</div>
              </div>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
