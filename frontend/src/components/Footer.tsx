"use client";

import Link from "next/link";
import Image from "next/image";
import { brand } from "@/lib/brand";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "Strains", href: "/strains" },
  { label: "Growers", href: "/growers" },
  { label: "Conditions", href: "/conditions" },
];

const resources = [
  { label: "About Us", href: "/about" },
  { label: "Prescription Guide", href: "/prescription-guide" },
  { label: "FAQs", href: "/faqs" },
  { label: "Contact", href: "/contact" },
];

const legal = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Use", href: "/terms" },
  { label: "Disclaimer", href: "/disclaimer" },
];

export default function Footer() {
  return (
    <footer
      className="border-t"
      style={{ backgroundColor: brand.bgCard, borderColor: `${brand.textMuted}15` }}
    >
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="mb-4 flex items-center gap-2.5">
              <Image
                src="/brand/logomark.svg"
                alt="DataStrain"
                width={24}
                height={26}
                className="h-6 w-auto"
              />
              <span className="text-base font-extrabold tracking-tight">
                <span style={{ color: brand.secondary }}>Data</span>
                <span style={{ color: brand.accent }}>Strain</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: brand.textMuted }}>
              The trusted voice of quality in the UK medical cannabis market. Real patients, real reviews, real data.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition hover:text-white"
                    style={{ color: brand.textMuted }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">Resources</h4>
            <ul className="space-y-2">
              {resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition hover:text-white"
                    style={{ color: brand.textMuted }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">Legal</h4>
            <ul className="space-y-2">
              {legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition hover:text-white"
                    style={{ color: brand.textMuted }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-10 border-t pt-6"
          style={{ borderColor: `${brand.textMuted}15` }}
        >
          <p className="text-center text-xs leading-relaxed" style={{ color: brand.textMuted }}>
            &copy; {new Date().getFullYear()} DataStrain. All rights reserved. DataStrain is for UK medical cannabis patients only.
          </p>
          <p className="mt-2 text-center text-xs leading-relaxed" style={{ color: `${brand.textMuted}88` }}>
            MHRA Disclaimer: This platform does not provide medical advice. Always consult your prescribing clinician before making changes to your medication.
          </p>
        </div>
      </div>
    </footer>
  );
}
