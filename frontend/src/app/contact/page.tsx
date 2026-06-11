"use client";

import { useState } from "react";
import Navbar, { PublicNavActions } from "@/components/Navbar";
import Footer from "@/components/Footer";
import { brand } from "@/lib/brand";

const C = brand;

const topics = [
  "General enquiry",
  "Bug report",
  "Feature suggestion",
  "Account issue",
  "Review moderation query",
  "Data deletion request",
  "Press & media",
  "Partnership enquiry",
  "Other",
];

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: wire to Resend API or backend endpoint
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen">
      <Navbar rightSlot={<PublicNavActions />} showSearch />

      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-white">Contact Us</h1>
          <p className="mt-3 text-base" style={{ color: C.textMuted }}>
            Got a question, suggestion, or issue? We&apos;d love to hear from you.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left — Contact form */}
          <div
            className="rounded-2xl p-6"
            style={{ backgroundColor: C.bgCard }}
          >
            {submitted ? (
              <div className="flex flex-col items-center py-12 text-center">
                <span className="mb-4 text-4xl">{"\u{2705}"}</span>
                <h2 className="text-xl font-bold text-white">Message Sent</h2>
                <p className="mt-2 text-sm" style={{ color: C.textMuted }}>
                  Thanks for reaching out. We&apos;ll get back to you as soon as possible.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setName(""); setEmail(""); setTopic(""); setMessage(""); }}
                  className="mt-6 rounded-lg px-6 py-2 text-sm font-semibold transition hover:opacity-90"
                  style={{ backgroundColor: C.primary, color: C.bgDeep }}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: C.textMuted }}>
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg px-4 py-2.5 text-sm text-white outline-none transition focus:ring-1"
                    style={{ backgroundColor: C.bgDeep, border: `1px solid ${C.textMuted}33`, focusRing: C.primary } as React.CSSProperties}
                    placeholder="John Smith"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: C.textMuted }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg px-4 py-2.5 text-sm text-white outline-none transition"
                    style={{ backgroundColor: C.bgDeep, border: `1px solid ${C.textMuted}33` }}
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: C.textMuted }}>
                    Topic
                  </label>
                  <select
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full rounded-lg px-4 py-2.5 text-sm text-white outline-none transition"
                    style={{ backgroundColor: C.bgDeep, border: `1px solid ${C.textMuted}33` }}
                  >
                    <option value="" disabled>Select a topic...</option>
                    {topics.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: C.textMuted }}>
                    Message
                  </label>
                  <textarea
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    className="w-full rounded-lg px-4 py-2.5 text-sm text-white outline-none transition"
                    style={{ backgroundColor: C.bgDeep, border: `1px solid ${C.textMuted}33` }}
                    placeholder="Tell us what's on your mind..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg py-3 text-sm font-bold transition hover:opacity-90"
                  style={{ backgroundColor: C.primary, color: C.bgDeep }}
                >
                  Send Message
                </button>
              </form>
            )}
          </div>

          {/* Right — Contact info */}
          <div className="space-y-6">
            {/* Get in touch */}
            <div
              className="rounded-2xl p-6"
              style={{ backgroundColor: C.bgCard }}
            >
              <h2 className="mb-4 text-lg font-bold text-white">Get in Touch</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-lg">{"\u{1F4E7}"}</span>
                  <div>
                    <p className="text-sm font-medium text-white">Email</p>
                    <p className="text-sm" style={{ color: C.primary }}>hello@datastrain.co.uk</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-lg">{"\u{1F310}"}</span>
                  <div>
                    <p className="text-sm font-medium text-white">Website</p>
                    <p className="text-sm" style={{ color: C.primary }}>datastrain.co.uk</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-lg">{"\u{1F4CD}"}</span>
                  <div>
                    <p className="text-sm font-medium text-white">Location</p>
                    <p className="text-sm" style={{ color: C.textMuted }}>United Kingdom</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Response times */}
            <div
              className="rounded-2xl p-6"
              style={{ backgroundColor: C.bgCard }}
            >
              <h2 className="mb-4 text-lg font-bold text-white">Response Times</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: C.textMuted }}>General enquiries</span>
                  <span className="text-sm font-medium text-white">Within 48 hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: C.textMuted }}>Bug reports</span>
                  <span className="text-sm font-medium text-white">Within 24 hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: C.textMuted }}>Account issues</span>
                  <span className="text-sm font-medium text-white">Within 24 hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: C.textMuted }}>Data deletion requests</span>
                  <span className="text-sm font-medium text-white">Within 30 days</span>
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div
              className="rounded-2xl p-6"
              style={{ backgroundColor: C.bgCard }}
            >
              <h2 className="mb-4 text-lg font-bold text-white">Before You Write</h2>
              <p className="mb-3 text-sm" style={{ color: C.textMuted }}>
                You might find your answer in these resources:
              </p>
              <div className="space-y-2">
                {[
                  { label: "Frequently Asked Questions", href: "/faqs", icon: "\u{2753}" },
                  { label: "About DataStrain", href: "/about", icon: "\u{2139}\u{FE0F}" },
                  { label: "Privacy Policy", href: "/privacy", icon: "\u{1F512}" },
                  { label: "Terms of Use", href: "/terms", icon: "\u{1F4DC}" },
                ].map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-white/5 hover:text-white"
                    style={{ color: C.textMuted }}
                  >
                    <span>{link.icon}</span> {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
