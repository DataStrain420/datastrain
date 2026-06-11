"use client";

import Navbar, { PublicNavActions } from "@/components/Navbar";
import Footer from "@/components/Footer";
import { brand } from "@/lib/brand";

const C = brand;

const steps = [
  {
    num: 1,
    title: "Check Your Eligibility",
    description:
      "You may be eligible if you have a chronic condition that hasn\u2019t responded adequately to at least two conventional treatments prescribed by your NHS GP. Common qualifying conditions include chronic pain, anxiety, PTSD, insomnia, epilepsy, MS, and fibromyalgia.",
    icon: "\u2705",
  },
  {
    num: 2,
    title: "Gather Your Medical Records",
    description:
      "Request a Summary Care Record (SCR) from your NHS GP. This document shows your diagnosis history and previous treatments. Most clinics require this to verify eligibility. You can request it for free \u2014 ask your GP surgery for a printed or digital copy.",
    icon: "\uD83D\uDCCB",
  },
  {
    num: 3,
    title: "Choose a Specialist Clinic",
    description:
      "Select a CQC-registered private cannabis clinic. Clinics operate remotely via video consultations, so location isn\u2019t a barrier. Research clinics carefully \u2014 compare consultation fees, product range, and patient reviews before booking.",
    icon: "\uD83C\uDFE5",
  },
  {
    num: 4,
    title: "Attend Your Consultation",
    description:
      "Your appointment will typically be a 20\u201340 minute video call with a specialist doctor. They\u2019ll review your medical history, discuss your symptoms, and assess whether medical cannabis is appropriate. Be honest and open about your condition and what you\u2019ve tried before.",
    icon: "\uD83D\uDCF9",
  },
  {
    num: 5,
    title: "Receive Your Prescription",
    description:
      "If approved, the doctor will issue a prescription tailored to your condition. This may include dried flower, oils, or other cannabis-based products. Your prescription is sent directly to a licensed pharmacy partner who will dispense and deliver your medication.",
    icon: "\uD83D\uDCDC",
  },
  {
    num: 6,
    title: "Order & Receive Your Medication",
    description:
      "Your prescribed medication is dispensed by a licensed pharmacy and delivered to your door, usually within 3\u20135 working days. Repeat prescriptions are managed through follow-up appointments with your clinic, typically every 1\u20133 months.",
    icon: "\uD83D\uDCE6",
  },
];

const costs = [
  { label: "Initial consultation", range: "\u00A350 \u2013 \u00A3150" },
  { label: "Follow-up appointments", range: "\u00A330 \u2013 \u00A380" },
  { label: "Medication (per month)", range: "\u00A3150 \u2013 \u00A3400+" },
  { label: "Project Twenty21 (subsidised)", range: "\u00A3150/month (capped)" },
];

const tips = [
  "Write down your symptoms, how they affect daily life, and what treatments you\u2019ve already tried.",
  "Have your Summary Care Record ready to share with the clinic before your appointment.",
  "Be prepared to discuss your goals \u2014 what relief are you hoping to achieve?",
  "Ask about different product types (flower, oil, vapes) and which might suit your needs.",
  "Check if the clinic participates in Project Twenty21 for subsidised access.",
];

export default function PrescriptionGuidePage() {
  return (
    <div className="min-h-screen">
      <Navbar rightSlot={<PublicNavActions />} showSearch />

      <main className="mx-auto max-w-4xl px-4 py-12">
        {/* Hero */}
        <div className="mb-12 text-center">
          <span className="mb-4 inline-block text-5xl">{"\uD83C\uDDEC\uD83C\uDDE7"}</span>
          <h1 className="text-4xl font-extrabold text-white">
            How to Get a UK Medical Cannabis Prescription
          </h1>
          <p
            className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed"
            style={{ color: C.textMuted }}
          >
            A straightforward guide to accessing legal medical cannabis in the
            United Kingdom through a private specialist clinic.
          </p>
        </div>

        {/* Who can get a prescription */}
        <section
          className="mb-8 rounded-2xl p-8"
          style={{ backgroundColor: C.bgCard }}
        >
          <h2 className="mb-4 text-xl font-bold text-white">
            Who Can Get a Prescription?
          </h2>
          <p
            className="mb-4 text-sm leading-relaxed"
            style={{ color: C.textMuted }}
          >
            Since November 2018, specialist doctors in the UK can legally
            prescribe cannabis-based products for medicinal use. To be eligible,
            you generally need to meet the following criteria:
          </p>
          <ul className="space-y-3">
            {[
              "You have a diagnosed chronic condition (pain, anxiety, insomnia, epilepsy, MS, PTSD, etc.)",
              "You\u2019ve tried at least two conventional treatments that haven\u2019t worked or caused unacceptable side effects",
              "Your condition significantly impacts your quality of life",
              "You are a UK resident aged 18 or over (some clinics accept younger patients with parental consent)",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: `${C.primary}22`,
                    color: C.primary,
                  }}
                >
                  {"\u2713"}
                </span>
                <span className="text-sm" style={{ color: C.textMuted }}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Step by step */}
        <section className="mb-8">
          <h2 className="mb-6 text-center text-xl font-bold text-white">
            Step-by-Step Process
          </h2>
          <div className="space-y-4">
            {steps.map((step) => (
              <div
                key={step.num}
                className="flex gap-5 rounded-2xl p-6"
                style={{ backgroundColor: C.bgCard }}
              >
                <div className="flex shrink-0 flex-col items-center">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-black"
                    style={{
                      backgroundColor: `${C.primary}22`,
                      color: C.primary,
                      border: `2px solid ${C.primary}44`,
                    }}
                  >
                    {step.num}
                  </span>
                  {step.num < steps.length && (
                    <div
                      className="mt-2 h-full w-px"
                      style={{ backgroundColor: `${C.primary}22` }}
                    />
                  )}
                </div>
                <div>
                  <h3 className="mb-1 text-base font-bold text-white">
                    <span className="mr-2">{step.icon}</span>
                    {step.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: C.textMuted }}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Consultation tips */}
        <section
          className="mb-8 rounded-2xl p-8"
          style={{ backgroundColor: C.bgCard }}
        >
          <h2 className="mb-4 text-xl font-bold text-white">
            {"\uD83D\uDCA1"} Preparing for Your Consultation
          </h2>
          <ul className="space-y-3">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{
                    backgroundColor: `${C.secondary}22`,
                    color: C.secondary,
                  }}
                >
                  {i + 1}
                </span>
                <span className="text-sm" style={{ color: C.textMuted }}>
                  {tip}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Costs */}
        <section
          className="mb-8 rounded-2xl p-8"
          style={{ backgroundColor: C.bgCard }}
        >
          <h2 className="mb-4 text-xl font-bold text-white">
            {"\uD83D\uDCB7"} Typical Costs
          </h2>
          <p
            className="mb-4 text-sm leading-relaxed"
            style={{ color: C.textMuted }}
          >
            Medical cannabis is currently only available privately in the UK.
            Costs vary between clinics, but here are typical ranges:
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {costs.map((c) => (
              <div
                key={c.label}
                className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ backgroundColor: C.bgDeep }}
              >
                <span className="text-sm font-medium text-white">
                  {c.label}
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: C.primary }}
                >
                  {c.range}
                </span>
              </div>
            ))}
          </div>
          <p
            className="mt-4 text-xs leading-relaxed"
            style={{ color: `${C.textMuted}88` }}
          >
            Some clinics participate in Project Twenty21, a national registry
            that offers subsidised access at a capped monthly cost. Ask your
            chosen clinic if they participate.
          </p>
        </section>

        {/* Disclaimer */}
        <section
          className="mb-8 rounded-2xl p-6"
          style={{
            backgroundColor: `${C.tertiary}08`,
            border: `1px solid ${C.tertiary}22`,
          }}
        >
          <h2 className="mb-2 text-base font-bold text-white">
            {"\u26A0\uFE0F"} Important Disclaimer
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: C.textMuted }}>
            This page is for informational purposes only and does not constitute
            medical or legal advice. Always consult a qualified healthcare
            professional before making decisions about your treatment. DataStrain
            is not a clinic and does not prescribe or supply medication. The
            information provided here is based on publicly available guidance and
            may change as regulations evolve.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
