"use client";

import Navbar, { PublicNavActions } from "@/components/Navbar";
import Footer from "@/components/Footer";
import { brand } from "@/lib/brand";

const C = brand;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-bold text-white">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed" style={{ color: C.textMuted }}>
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen">
      <Navbar rightSlot={<PublicNavActions />} showSearch />

      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-extrabold text-white">Privacy Policy</h1>
        <p className="mb-10 text-sm" style={{ color: C.textMuted }}>Last updated: April 2026</p>

        <div className="rounded-2xl p-8" style={{ backgroundColor: C.bgCard }}>
          <Section title="1. Who We Are">
            <p>DataStrain (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates the datastrain.co.uk website and associated services. We are the data controller for the personal data we collect and process through our platform.</p>
            <p>Contact: hello@datastrain.co.uk</p>
          </Section>

          <Section title="2. What Data We Collect">
            <p>We collect the following categories of personal data:</p>
            <p><strong className="text-white">Account data:</strong> Username, email address, password (stored as a bcrypt hash, never in plain text), avatar URL, bio, and slogan.</p>
            <p><strong className="text-white">Special category health data (Article 9, UK GDPR):</strong> Medical conditions you choose to associate with reviews, condition efficacy ratings, consumption methods, and effects experienced. This data is classified as special category data concerning health.</p>
            <p><strong className="text-white">Review data:</strong> Ratings (look, aroma, moisture, flavour, effect), written narratives, photos of medication, effects, and flavour notes.</p>
            <p><strong className="text-white">Library data:</strong> Strains marked as tried, wishlisted, or favourited.</p>
            <p><strong className="text-white">Usage data:</strong> Helpful votes cast, users followed, community engagement activity.</p>
            <p><strong className="text-white">Technical data:</strong> IP address (retained for 30 days), browser type, and access timestamps for security purposes.</p>
          </Section>

          <Section title="3. Lawful Basis for Processing">
            <p>We process your personal data under the following lawful bases:</p>
            <p><strong className="text-white">Consent (Article 6(1)(a) and Article 9(2)(a)):</strong> For processing special category health data (medical conditions, efficacy ratings). This consent is explicit, specific, and freely given during registration and review submission. You may withdraw consent at any time.</p>
            <p><strong className="text-white">Contract (Article 6(1)(b)):</strong> For providing our platform services — account management, review submission, and community features.</p>
            <p><strong className="text-white">Legitimate interests (Article 6(1)(f)):</strong> For platform security, fraud prevention, and generating anonymised aggregate statistics.</p>
          </Section>

          <Section title="4. How We Use Your Data">
            <p>We use your data to: operate and improve the platform; display your reviews and profile (subject to your privacy settings); generate anonymised aggregate statistics (e.g., &quot;78% of patients with anxiety found this strain helpful&quot;); calculate community rankings, kudos points, and emblems; send essential account notifications; and protect platform security.</p>
            <p>We <strong className="text-white">never</strong> use your data for advertising, sell it to third parties, or share individual health data publicly. Only anonymised, aggregated statistics are displayed.</p>
          </Section>

          <Section title="5. Special Category Data Protection">
            <p>Medical condition data, efficacy ratings, and health-related review content are classified as special category data under UK GDPR Article 9. We apply additional protections:</p>
            <p>Condition data is encrypted at the application level before storage. Individual condition ratings are never displayed publicly — only anonymised aggregates. You control visibility of health-related data through granular privacy toggles on your profile. Conditions default to <strong className="text-white">private</strong> on registration.</p>
          </Section>

          <Section title="6. Your Privacy Controls">
            <p>You have granular control over what appears on your public profile. You can individually toggle visibility for: bio, reviews, conditions reviewed for, effect preferences, library (tried/wishlist/favourites), follower count, and kudos/rank.</p>
            <p>These settings can be changed at any time from your Dashboard.</p>
          </Section>

          <Section title="7. Data Sharing">
            <p>We do not sell, rent, or trade your personal data. We may share data with: hosting providers (Google Cloud Platform, europe-west2 region) for infrastructure; Supabase for database hosting; Firebase for admin authentication; and law enforcement if required by law.</p>
            <p>All third-party processors are bound by data processing agreements and process data only on our instructions.</p>
          </Section>

          <Section title="8. Data Retention">
            <p><strong className="text-white">Account data:</strong> Retained while your account is active, plus 30 days after deletion request.</p>
            <p><strong className="text-white">Review data:</strong> Retained while your account is active. On deletion, reviews are either fully deleted or anonymised (user link removed) depending on your preference.</p>
            <p><strong className="text-white">IP addresses:</strong> Truncated or deleted after 30 days.</p>
            <p><strong className="text-white">Activity logs:</strong> Retained for 12 months, then anonymised.</p>
            <p><strong className="text-white">Consent records:</strong> Retained for 6 years after consent is withdrawn (to demonstrate compliance).</p>
            <p><strong className="text-white">Inactive accounts:</strong> Auto-purged after 24 months of inactivity (with 30-day prior warning).</p>
          </Section>

          <Section title="9. Your Rights">
            <p>Under UK GDPR, you have the right to:</p>
            <p><strong className="text-white">Access</strong> — request a copy of all personal data we hold about you.</p>
            <p><strong className="text-white">Rectification</strong> — correct inaccurate personal data.</p>
            <p><strong className="text-white">Erasure</strong> — request deletion of your account and all associated data (within 30 days).</p>
            <p><strong className="text-white">Restriction</strong> — restrict processing of your data in certain circumstances.</p>
            <p><strong className="text-white">Portability</strong> — receive your data in a structured, machine-readable format.</p>
            <p><strong className="text-white">Withdraw consent</strong> — withdraw consent for health data processing at any time without affecting prior processing.</p>
            <p><strong className="text-white">Complaint</strong> — lodge a complaint with the Information Commissioner&apos;s Office (ICO) at ico.org.uk.</p>
            <p>To exercise any of these rights, contact us at hello@datastrain.co.uk.</p>
          </Section>

          <Section title="10. Data Security">
            <p>We implement appropriate technical and organisational measures including: TLS 1.2+ encryption for all data in transit; AES-256 encryption at rest for database storage; application-level encryption for sensitive health data; bcrypt password hashing; rate limiting on authentication endpoints; and regular security reviews.</p>
          </Section>

          <Section title="11. Cookies">
            <p>We use essential cookies and localStorage for authentication (JWT tokens) and session management. We do not use advertising or tracking cookies. No third-party analytics cookies are used.</p>
          </Section>

          <Section title="12. Children">
            <p>DataStrain is not intended for use by anyone under 18 years of age. We do not knowingly collect data from children.</p>
          </Section>

          <Section title="13. Changes to This Policy">
            <p>We may update this policy from time to time. Material changes will be communicated via email and a prominent notice on the platform. Continued use after changes constitutes acceptance of the updated policy.</p>
          </Section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
