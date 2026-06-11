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

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <Navbar rightSlot={<PublicNavActions />} showSearch />

      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-extrabold text-white">Terms of Use</h1>
        <p className="mb-10 text-sm" style={{ color: C.textMuted }}>Last updated: April 2026</p>

        <div className="rounded-2xl p-8" style={{ backgroundColor: C.bgCard }}>
          <Section title="1. Acceptance of Terms">
            <p>By accessing or using DataStrain (&quot;the Platform&quot;), you agree to be bound by these Terms of Use. If you do not agree, you must not use the Platform.</p>
          </Section>

          <Section title="2. Eligibility">
            <p>To use DataStrain, you must: be at least 18 years old; be a resident of the United Kingdom; and hold a valid UK medical cannabis prescription issued by a registered specialist doctor.</p>
            <p>By registering an account, you confirm that you meet all of these requirements. We reserve the right to verify your eligibility and suspend or terminate accounts that do not meet these criteria.</p>
          </Section>

          <Section title="3. Account Responsibilities">
            <p>You are responsible for maintaining the confidentiality of your login credentials. You must not share your account with others or create multiple accounts. You must provide accurate information during registration and keep it up to date.</p>
            <p>You are responsible for all activity that occurs under your account. Notify us immediately at hello@datastrain.co.uk if you suspect unauthorised access.</p>
          </Section>

          <Section title="4. Content & Reviews">
            <p><strong className="text-white">Your content:</strong> By submitting reviews, photos, and other content, you grant DataStrain a non-exclusive, worldwide, royalty-free licence to display, distribute, and use that content on the Platform for the purpose of operating the service.</p>
            <p><strong className="text-white">Content standards:</strong> All reviews must be based on your own genuine experience with the product. You must not submit fake reviews, reviews for products you have not personally used, or reviews on behalf of others.</p>
            <p><strong className="text-white">Photos:</strong> You must ensure that uploaded photos do not contain personally identifiable information such as prescription labels, patient names, addresses, or pharmacy details. Our moderation team screens for this, but ultimate responsibility lies with you.</p>
            <p><strong className="text-white">Prohibited content:</strong> You must not post content that is defamatory, abusive, threatening, discriminatory, or illegal. You must not promote the recreational use of cannabis or encourage use outside of a valid medical prescription. You must not share or solicit sources for obtaining cannabis outside of legitimate medical channels.</p>
          </Section>

          <Section title="5. Moderation">
            <p>All reviews are subject to moderation before publication. We reserve the right to reject, edit, or remove any content that violates these Terms, our community guidelines, or applicable law. Moderation decisions are final.</p>
            <p>Repeated violations may result in temporary suspension or permanent termination of your account.</p>
          </Section>

          <Section title="6. Community Conduct">
            <p>You agree to engage respectfully with other community members. You must not: harass, bully, or intimidate other users; impersonate other users or organisations; manipulate the voting or ranking system (e.g., creating fake accounts to boost reviews); or use the Platform to advertise or promote commercial products or services.</p>
          </Section>

          <Section title="7. Intellectual Property">
            <p>The DataStrain name, logo, trading card design, and all original content created by DataStrain are our intellectual property. You may not reproduce, distribute, or create derivative works without our written permission.</p>
            <p>You retain ownership of the content you submit (reviews, photos, narratives) but grant us the licence described in Section 4.</p>
          </Section>

          <Section title="8. Limitation of Liability">
            <p>DataStrain is provided &quot;as is&quot; without warranties of any kind, express or implied. We do not guarantee the accuracy, completeness, or reliability of any review, rating, or information on the Platform.</p>
            <p>To the maximum extent permitted by law, DataStrain shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform.</p>
            <p>Nothing in these Terms excludes or limits our liability for death or personal injury caused by our negligence, fraud, or any other liability that cannot be excluded by law.</p>
          </Section>

          <Section title="9. Medical Disclaimer">
            <p>DataStrain is <strong className="text-white">not</strong> a medical service and does not provide medical advice. The reviews, ratings, and information on this Platform represent individual patient experiences and should not be interpreted as clinical evidence of efficacy or safety.</p>
            <p>Always consult your prescribing clinician before making any changes to your medication. Never start, stop, or change a prescribed treatment based solely on information found on DataStrain.</p>
          </Section>

          <Section title="10. Pharmacy & Stock Information">
            <p>Any pharmacy stock information displayed on DataStrain is provided for informational purposes only. Stock levels may not be real-time and are subject to change. DataStrain is not a pharmacy, does not sell cannabis products, and does not facilitate purchases.</p>
          </Section>

          <Section title="11. Third-Party Links">
            <p>The Platform may contain links to third-party websites (e.g., pharmacy websites, grower websites). We are not responsible for the content, privacy practices, or availability of these external sites.</p>
          </Section>

          <Section title="12. Termination">
            <p>You may delete your account at any time by contacting us or through your account settings. We may suspend or terminate your account for violation of these Terms, with or without notice.</p>
            <p>Upon termination, your right to use the Platform ceases immediately. Data deletion will be handled in accordance with our Privacy Policy.</p>
          </Section>

          <Section title="13. Governing Law">
            <p>These Terms are governed by and construed in accordance with the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
          </Section>

          <Section title="14. Changes to These Terms">
            <p>We may update these Terms from time to time. Material changes will be communicated via email and a notice on the Platform at least 14 days before they take effect. Continued use after changes constitutes acceptance.</p>
          </Section>

          <Section title="15. Contact">
            <p>If you have questions about these Terms, contact us at hello@datastrain.co.uk.</p>
          </Section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
