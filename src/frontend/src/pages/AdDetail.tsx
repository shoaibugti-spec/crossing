import { ArrowLeft, Shield, Clock, CheckCircle, Loader2, Lock, Star, MessageCircle, FileText, Globe, TrendingUp, Award } from "lucide-react";
import { useNavigate, useParams, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const BUYER_FEE = 3;

export function AdDetail() {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { id?: string };
  const adId = params.id;

  const [loading, setLoading] = useState(true);
  const [ad, setAd] = useState<any | null>(null);
  const [provider, setProvider] = useState<any | null>(null);
  const [service, setService] = useState<any | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [kycStatus, setKycStatus] = useState("none");
  const [reviews, setReviews] = useState<any[]>([]);

  const [showOrder, setShowOrder] = useState(false);
  const [orderStep, setOrderStep] = useState(0);
  const [placing, setPlacing] = useState(false);

  useEffect(() => { void loadAd(); }, [adId]);

  async function loadAd() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setLoading(false); void navigate({ to: "/login" }); return; }
    setUserId(userData.user.id);

    const { data: profile } = await supabase.from("profiles").select("wallet_balance, kyc_status").eq("id", userData.user.id).single();
    setWalletBalance(Number(profile?.wallet_balance ?? 0));
    setKycStatus(profile?.kyc_status ?? "none");

    if (!adId) { setLoading(false); return; }

    const { data: adData } = await supabase
      .from("ads")
      .select("id, provider_id, provider_service_id, title, description, country, visa_type, price, currency, processing_time, requirements, provider_fee, buyer_fee, status, is_public, created_at")
      .eq("id", adId)
      .single();
    setAd(adData);

    if (adData?.provider_service_id) {
      const { data: svc } = await supabase
        .from("provider_services")
        .select("id, capacity, active_count")
        .eq("id", adData.provider_service_id)
        .single();
      setService(svc);
    }

    if (adData?.provider_id) {
      const { data: prov } = await supabase
        .from("profiles")
        .select("id, display_name, full_name, profile_bio, total_visas_delivered, total_valuation, positive_feedback_count, negative_feedback_count, created_at")
        .eq("id", adData.provider_id)
        .single();
      setProvider(prov);

      const { data: revs } = await supabase
        .from("reviews")
        .select("id, rating, tags, comment, created_at")
        .eq("provider_id", adData.provider_id)
        .order("created_at", { ascending: false })
        .limit(10);
      setReviews(revs ?? []);
    }

    setLoading(false);
  }

  const buyerFee = ad?.buyer_fee ?? BUYER_FEE;
  const providerFee = ad?.provider_fee ?? 6;
  const buyerPays = Number(ad?.price ?? 0) + providerFee + buyerFee;

  const capacity = service?.capacity ?? 1;
  const activeCount = service?.active_count ?? 0;
  const isFull = activeCount >= capacity;

  async function placeOrder() {
    if (!userId || !ad) return;
    if (walletBalance < buyerPays) {
      alert(`You need $${buyerPays.toFixed(2)} USDT in your wallet. Please top up first.`);
      void navigate({ to: "/wallet" });
      return;
    }
    if (isFull) {
      alert("This provider is at full capacity right now. Please try again later.");
      return;
    }
    setPlacing(true);

    const { data: tx, error: txErr } = await supabase.from("transactions").insert({
      buyer_id: userId,
      seller_id: ad.provider_id,
      ad_id: ad.id,
      amount: Number(ad.price),
      buyer_fee: buyerFee,
      total_paid: buyerPays,
      status: "escrow_active",
    }).select("id").single();

    if (txErr || !tx) {
      alert("Failed to place order: " + (txErr?.message ?? "unknown"));
      setPlacing(false);
      return;
    }

    const newBal = walletBalance - buyerPays;
    await supabase.from("profiles").update({ wallet_balance: newBal }).eq("id", userId);
    await supabase.from("wallet_transactions").insert({
      user_id: userId, type: "escrow", amount: -buyerPays, status: "completed",
      notes: `Escrow payment — "${ad.title}"`,
    });

    // Capacity: active_count barhayen. Agar full ho jaye to ad hide karein.
    if (ad.provider_service_id) {
      const newCount = activeCount + 1;
      await supabase.from("provider_services").update({ active_count: newCount }).eq("id", ad.provider_service_id);
      if (newCount >= capacity) {
        await supabase.from("ads").update({ is_public: false }).eq("id", ad.id);
      }
    }

    await supabase.from("notifications").insert([
      { user_id: userId, type: "success", title: "✅ Order Placed!", body: `Your payment is held in escrow. You can now chat with the provider.`, link: "/orders", is_read: false },
      { user_id: ad.provider_id, type: "success", title: "🎉 New Order!", body: `A buyer ordered "${ad.title}". Start the conversation now.`, link: "/orders", is_read: false },
    ]);

    setPlacing(false);
    setOrderStep(2);
  }

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-gray-300" size={28} /></div>;
  }

  if (!ad) {
    return (
      <div className="flex flex-col pb-8">
        <div className="bg-white px-4 py-3 flex items-center gap-2 border-b border-gray-100">
          <button onClick={() => void navigate({ to: "/ads", search: { q: "", country: "", type: "" } })} className="p-1.5 rounded-full hover:bg-gray-100">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <span className="font-bold text-gray-800 text-sm">Listing</span>
        </div>
        <div className="text-center py-16 text-gray-400 text-sm">Listing not found or no longer available.</div>
      </div>
    );
  }

  const totalFeedback = (provider?.positive_feedback_count ?? 0) + (provider?.negative_feedback_count ?? 0);
  const positiveRate = totalFeedback > 0 ? Math.round(((provider?.positive_feedback_count ?? 0) / totalFeedback) * 100) : 0;
  const joinDate = provider?.created_at ? new Date(provider.created_at) : null;
  const daysSinceJoin = joinDate ? Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  const kycDone = kycStatus === "approved";

  return (
    <div className="flex flex-col pb-24">
      <div className="bg-white px-4 py-3 flex items-center gap-2 border-b border-gray-100">
        <button onClick={() => void navigate({ to: "/ads", search: { q: "", country: "", type: "" } })} className="p-1.5 rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <span className="font-bold text-gray-800 text-sm">Visa Listing</span>
      </div>

      <div className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-[#E8F0EF] text-[#004B49] text-[11px] font-semibold px-2.5 py-1 rounded-full">{ad.visa_type}</span>
          <span className="bg-gray-50 text-gray-500 text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
            <Globe size={10} /> {ad.country}
          </span>
        </div>
        <div className="font-black text-gray-800 text-lg mb-1">{ad.title}</div>
        {ad.processing_time && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
            <Clock size={13} /> Processing: {ad.processing_time}
          </div>
        )}
        <div className="bg-[#004B49] rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-white/60 text-[11px]">Total Price (incl. fees)</div>
            <div className="text-white font-black text-2xl">${buyerPays.toFixed(2)} <span className="text-sm font-semibold text-white/60">{ad.currency}</span></div>
          </div>
          <Shield size={28} className="text-[#D4AF37]" />
        </div>
      </div>

      {provider && (
        <div className="mx-4 mt-3 bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#004B49] to-[#00746f] flex items-center justify-center text-white font-black text-lg">
              {(provider.display_name ?? provider.full_name ?? "P")[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <Link to="/profile/$id" params={{ id: provider.id }}>
                <div className="font-black text-gray-800 text-sm flex items-center gap-1.5">
                  {provider.display_name ?? "Verified Provider"}
                  <CheckCircle size={14} className="text-[#004B49]" />
                </div>
              </Link>
              <div className="text-[11px] text-gray-400">
                Member for {daysSinceJoin} day{daysSinceJoin !== 1 ? "s" : ""}
                {joinDate && ` · Joined ${joinDate.toLocaleDateString()}`}
              </div>
            </div>
          </div>

          {provider.profile_bio && (
            <div className="text-xs text-gray-600 bg-gray-50 rounded-xl p-3 mb-3">{provider.profile_bio}</div>
          )}

          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-[#E8F0EF] rounded-xl p-2.5 text-center">
              <TrendingUp size={15} className="text-[#004B49] mx-auto mb-1" />
              <div className="font-black text-[#004B49] text-sm">{provider.total_visas_delivered ?? 0}</div>
              <div className="text-[9px] text-gray-500">Visas Delivered</div>
            </div>
            <div className="bg-[#FBF3E1] rounded-xl p-2.5 text-center">
              <Award size={15} className="text-[#9c7a1f] mx-auto mb-1" />
              <div className="font-black text-[#9c7a1f] text-sm">${Number(provider.total_valuation ?? 0).toLocaleString()}</div>
              <div className="text-[9px] text-gray-500">Total Value</div>
            </div>
            <div className="bg-green-50 rounded-xl p-2.5 text-center">
              <Star size={15} className="text-green-500 mx-auto mb-1" />
              <div className="font-black text-green-600 text-sm">{positiveRate}%</div>
              <div className="text-[9px] text-gray-500">Positive</div>
            </div>
          </div>

          {totalFeedback > 0 && (
            <div className="flex items-center gap-2 text-[11px] mb-1">
              <span className="text-green-600 font-bold">👍 {provider.positive_feedback_count ?? 0}</span>
              <span className="text-red-400 font-bold">👎 {provider.negative_feedback_count ?? 0}</span>
              <span className="text-gray-400">· {totalFeedback} review{totalFeedback !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      )}

      {ad.description && (
        <div className="mx-4 mt-3 bg-white rounded-2xl p-4 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-2">About This Service</div>
          <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{ad.description}</div>
        </div>
      )}

      {ad.requirements && ad.requirements.length > 0 && (
        <div className="mx-4 mt-3 bg-white rounded-2xl p-4 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5">
            <FileText size={15} className="text-[#004B49]" /> Documents You'll Need
          </div>
          {ad.requirements.map((r: string, i: number) => (
            <div key={i} className="flex items-center gap-2 py-1.5">
              <span className="w-5 h-5 rounded-full bg-[#E8F0EF] text-[#004B49] text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
              <span className="text-sm text-gray-600">{r}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mx-4 mt-3 bg-white rounded-2xl p-4 shadow-sm">
        <div className="text-sm font-bold text-gray-800 mb-3">Price Breakdown</div>
        <div className="flex justify-between text-xs mb-2">
          <span className="text-gray-500">Visa service price</span>
          <span className="font-bold text-gray-800">${Number(ad.price).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs mb-2">
          <span className="text-gray-500">Platform buyer fee</span>
          <span className="font-bold text-gray-800">${buyerFee.toFixed(2)}</span>
        </div>
        <div className="border-t border-gray-100 pt-2 flex justify-between text-sm">
          <span className="font-bold text-gray-700">Total you pay</span>
          <span className="font-black text-[#004B49]">${buyerPays.toFixed(2)}</span>
        </div>
        <div className="bg-[#E8F0EF] rounded-xl p-2.5 mt-3 flex gap-2">
          <Shield size={13} className="text-[#004B49] flex-shrink-0 mt-0.5" />
          <span className="text-[11px] text-[#004B49]">Your money is held safely in escrow until you confirm the visa is delivered.</span>
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 px-4 py-3 bg-white border-t border-gray-100 max-w-lg mx-auto">
        {ad.status !== "active" ? (
          <div className="text-center text-xs text-gray-400 py-2">This listing is not available for orders.</div>
        ) : isFull ? (
          <div className="text-center text-xs text-[#9c7a1f] font-semibold py-2">Provider is at full capacity right now.</div>
        ) : userId === ad.provider_id ? (
          <div className="text-center text-xs text-gray-400 py-2">This is your own listing.</div>
        ) : (
          <button onClick={() => { setShowOrder(true); setOrderStep(kycDone ? 1 : 0); }}
            className="w-full bg-[#004B49] text-white font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2">
            <Lock size={16} /> Order Now — ${buyerPays.toFixed(2)}
          </button>
        )}
      </div>

      {showOrder && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => !placing && setShowOrder(false)} />
          <div className="relative w-full max-w-lg mx-auto bg-white rounded-t-3xl p-6 pb-10">

            {orderStep === 0 && (
              <>
                <div className="text-center mb-4">
                  <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Lock size={26} className="text-red-400" />
                  </div>
                  <div className="font-black text-gray-800 text-lg mb-1">Verification Required</div>
                  <div className="text-sm text-gray-500">Complete your KYC verification before placing an order.</div>
                </div>
                <Link to="/kyc">
                  <button className="w-full bg-[#004B49] text-white font-bold py-4 rounded-2xl text-sm mb-2">Complete KYC →</button>
                </Link>
                <button onClick={() => setShowOrder(false)} className="w-full bg-gray-50 text-gray-500 font-semibold py-3 rounded-2xl text-sm">Cancel</button>
              </>
            )}

            {orderStep === 1 && (
              <>
                <div className="text-center mb-4">
                  <div className="font-black text-gray-800 text-lg">Confirm Your Order</div>
                  <div className="text-sm text-gray-500 mt-1">{ad.title}</div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">Service price</span>
                    <span className="font-bold text-gray-800">${Number(ad.price).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">Buyer fee</span>
                    <span className="font-bold text-gray-800">${buyerFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between">
                    <span className="font-bold text-gray-700">Total</span>
                    <span className="font-black text-[#004B49]">${buyerPays.toFixed(2)}</span>
                  </div>
                </div>

                <div className={`rounded-xl p-3 mb-4 flex items-center justify-between ${walletBalance >= buyerPays ? "bg-green-50" : "bg-red-50"}`}>
                  <span className={`text-xs font-semibold ${walletBalance >= buyerPays ? "text-green-600" : "text-red-500"}`}>
                    Wallet balance: ${walletBalance.toFixed(2)}
                  </span>
                  {walletBalance < buyerPays && (
                    <Link to="/wallet"><span className="text-xs font-bold text-[#004B49] underline">Top up</span></Link>
                  )}
                </div>

                <div className="bg-[#E8F0EF] rounded-xl p-3 mb-4 flex gap-2">
                  <Shield size={14} className="text-[#004B49] flex-shrink-0 mt-0.5" />
                  <span className="text-[11px] text-[#004B49]">Your ${buyerPays.toFixed(2)} will be held in escrow. It's only released to the provider after you confirm visa delivery.</span>
                </div>

                <button onClick={() => void placeOrder()} disabled={placing || walletBalance < buyerPays}
                  className="w-full bg-[#004B49] text-white font-bold py-4 rounded-2xl text-sm disabled:opacity-50">
                  {placing ? "Placing Order..." : `Pay $${buyerPays.toFixed(2)} & Connect`}
                </button>
                <button onClick={() => setShowOrder(false)} disabled={placing} className="w-full mt-2 text-gray-400 text-sm py-2">Cancel</button>
              </>
            )}

            {orderStep === 2 && (
              <>
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle size={30} className="text-green-500" />
                  </div>
                  <div className="font-black text-gray-800 text-lg mb-1">Order Placed! 🎉</div>
                  <div className="text-sm text-gray-500">You're now connected with the provider. Head to your orders to start chatting and share documents.</div>
                </div>
                <button onClick={() => void navigate({ to: "/orders" })}
                  className="w-full bg-[#004B49] text-white font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2 mb-2">
                  <MessageCircle size={16} /> Go to Orders & Chat
                </button>
                <button onClick={() => { setShowOrder(false); void loadAd(); }} className="w-full bg-gray-50 text-gray-500 font-semibold py-3 rounded-2xl text-sm">Done</button>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
