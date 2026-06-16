import { ArrowLeft, ChevronRight, Plus, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

const COUNTRIES = ["Saudi Arabia","UAE","United Kingdom","Germany","Canada","Australia","New Zealand","USA","Turkey","Malaysia"];
const VISA_TYPES = ["Work Visa","Study Visa","Tourist Visa","Business Visa","Family Visa","Sponsorship","PR / Immigration","Transit Visa"];
const CURRENCIES = ["USDT","USD","EUR","GBP","AED","PKR"];

export function PostAd() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [req, setReq] = useState("");
  const [form, setForm] = useState({
    title: "", country: "", visaType: "", price: "",
    currency: "USDT", processingTime: "", description: "",
    requirements: [] as string[],
    steps: ["", "", "", "", ""],
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const addReq = () => {
    if (!req.trim()) return;
    setForm((f) => ({ ...f, requirements: [...f.requirements, req.trim()] }));
    setReq("");
  };

  const removeReq = (i: number) =>
    setForm((f) => ({ ...f, requirements: f.requirements.filter((_, idx) => idx !== i) }));

  const setStepText = (i: number, val: string) => {
    const steps = [...form.steps];
    steps[i] = val;
    setForm((f) => ({ ...f, steps }));
  };

  const handleSubmit = () => {
    void navigate({ to: "/my-ads" });
  };

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  return (
    <div className="flex flex-col pb-8">

      {/* BACK + PROGRESS */}
      <div className="bg-white px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => step > 1 ? setStep(step - 1) : void navigate({ to: "/" })}
            className="p-1.5 rounded-full hover:bg-gray-100">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <span className="font-bold text-gray-800 text-sm flex-1">Post a Visa Listing</span>
          <span className="text-xs text-gray-400">{step}/{totalSteps}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1a56f0] rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          {["Basic Info","Details","Docs","Process","Review"].map((l, i) => (
            <span key={l} className={`text-[10px] font-semibold ${i + 1 === step ? "text-[#1a56f0]" : "text-gray-300"}`}>{l}</span>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4">

        {/* STEP 1 — BASIC INFO */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="text-sm font-bold text-gray-800 mb-4">Basic Information</div>

              <div className="mb-3">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Listing Title</label>
                <input
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. Canada PR Express Entry — Full Service"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#1a56f0]"
                />
              </div>

              <div className="mb-3">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Destination Country</label>
                <select
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#1a56f0]"
                >
                  <option value="">Select country...</option>
                  {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div className="mb-3">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Visa Type</label>
                <div className="flex flex-wrap gap-2">
                  {VISA_TYPES.map((v) => (
                    <button key={v} onClick={() => set("visaType", v)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        form.visaType === v
                          ? "bg-[#1a56f0] text-white border-[#1a56f0]"
                          : "bg-gray-50 text-gray-600 border-gray-100"
                      }`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Price</label>
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-3">
                    <span className="text-gray-400 text-sm font-bold">$</span>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => set("price", e.target.value)}
                      placeholder="499"
                      className="flex-1 bg-transparent text-sm text-gray-800 outline-none font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Currency</label>
                  <select
                    value={form.currency}
                    onChange={(e) => set("currency", e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-3 text-sm text-gray-800 outline-none"
                  >
                    {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — DETAILS */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="text-sm font-bold text-gray-800 mb-4">Service Details</div>

              <div className="mb-3">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Processing Time</label>
                <input
                  value={form.processingTime}
                  onChange={(e) => set("processingTime", e.target.value)}
                  placeholder="e.g. 4-6 weeks"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#1a56f0]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Describe your service in detail. What do you offer? What is your success rate? How many years experience?"
                  rows={5}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#1a56f0] resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 — REQUIREMENTS */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="text-sm font-bold text-gray-800 mb-1">Required Documents</div>
              <div className="text-xs text-gray-500 mb-4">List all documents the buyer must provide</div>

              <div className="flex gap-2 mb-3">
                <input
                  value={req}
                  onChange={(e) => setReq(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addReq()}
                  placeholder="e.g. Valid Passport"
                  className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#1a56f0]"
                />
                <button onClick={addReq}
                  className="w-11 h-11 bg-[#1a56f0] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Plus size={18} className="text-white" />
                </button>
              </div>

              {form.requirements.length === 0 && (
                <div className="text-center py-6 text-gray-300 text-xs">
                  No requirements added yet. Type above and press Enter.
                </div>
              )}

              <div className="flex flex-col gap-2">
                {form.requirements.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#1a56f0]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-[#1a56f0]">{i + 1}</span>
                    </div>
                    <span className="flex-1 text-sm text-gray-700">{r}</span>
                    <button onClick={() => removeReq(i)}>
                      <X size={14} className="text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 bg-blue-50 rounded-xl p-3">
                <div className="text-xs text-blue-700 font-semibold mb-1">Common Requirements</div>
                <div className="flex flex-wrap gap-1.5">
                  {["Valid Passport","Bank Statements","Employment Letter","Photographs","Travel Insurance","Educational Certificates"].map((s) => (
                    <button key={s} onClick={() => setForm((f) => ({ ...f, requirements: [...f.requirements, s] }))}
                      className="text-[11px] bg-white border border-blue-100 text-blue-600 px-2 py-1 rounded-full font-medium">
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4 — PROCESS STEPS */}
        {step === 4 && (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="text-sm font-bold text-gray-800 mb-1">Step-by-Step Process</div>
              <div className="text-xs text-gray-500 mb-4">Explain exactly what will happen at each stage</div>

              <div className="flex flex-col gap-3">
                {form.steps.map((s, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-full bg-[#1a56f0] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-2.5">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <input
                        value={s}
                        onChange={(e) => setStepText(i, e.target.value)}
                        placeholder={[
                          "Documents collection from buyer",
                          "Document verification & preparation",
                          "Embassy application submission",
                          "Interview scheduling (if required)",
                          "Visa delivery & case closure",
                        ][i]}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#1a56f0]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5 — REVIEW */}
        {step === 5 && (
          <div className="flex flex-col gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="text-sm font-bold text-gray-800 mb-3">Review Your Listing</div>

              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="font-bold text-gray-800">{form.title || "Untitled Listing"}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{form.country} · {form.visaType}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-[#1a56f0] text-lg">${form.price}</div>
                  <div className="text-[10px] text-gray-400">{form.currency}</div>
                </div>
              </div>

              <div className="flex gap-2 mb-3">
                <span className="bg-blue-50 text-blue-600 text-xs px-2.5 py-1 rounded-full font-semibold">⏱ {form.processingTime || "TBD"}</span>
              </div>

              {form.description && (
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">{form.description}</p>
              )}

              {form.requirements.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-bold text-gray-600 mb-2">📄 Required Docs ({form.requirements.length})</div>
                  {form.requirements.map((r, i) => (
                    <div key={i} className="text-xs text-gray-500 flex items-center gap-1.5 mb-1">
                      <span className="w-1 h-1 rounded-full bg-[#1a56f0] flex-shrink-0" />
                      {r}
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-gray-100 pt-3">
                <div className="text-xs font-bold text-gray-600 mb-2">📋 Process Steps</div>
                {form.steps.filter(Boolean).map((s, i) => (
                  <div key={i} className="flex gap-2 mb-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#1a56f0] text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">{i+1}</span>
                    <span className="text-xs text-gray-500">{s}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
              <div className="text-sm font-bold text-green-700 mb-1">✓ Ready to Publish</div>
              <div className="text-xs text-green-600">Your listing will be reviewed by admin within 24 hours before going live.</div>
            </div>
          </div>
        )}

        {/* NEXT / SUBMIT */}
        <button
          onClick={() => step < totalSteps ? setStep(step + 1) : handleSubmit()}
          className="w-full mt-4 bg-[#1a56f0] text-white font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2"
        >
          {step < totalSteps ? (
            <><span>Continue</span><ChevronRight size={16} /></>
          ) : (
            <span>Submit Listing 🚀</span>
          )}
        </button>

      </div>
    </div>
  );
}
