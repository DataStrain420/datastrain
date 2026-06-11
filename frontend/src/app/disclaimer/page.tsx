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

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen">
      <Navbar rightSlot={<PublicNavActions />} showSearch />

      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-2 text-3xl font-extrabold text-white">Disclaimer</h1>
        <p className="mb-10 text-sm" style={{ color: C.textMuted }}>Last updated: April 2026</p>

        <div className="rounded-2xl p-8" style={{ backgroundColor: C.bgCard }}>
          {/* MHRA Notice */}
          <div
            className="mb-8 rounded-xl p-5"
            style={{ backgroundColor: C.bgDeep, borderLeft: `4px solid ${C.secondary}` }}
          >
            <h2 className="mb-2 text-base font-bold text-white">MHRA Disclaimer</h2>
            <p className="text-sm leading-relaxed" style={{ color: C.textMuted }}>
              DataStrain is not a regulated medical device and has not been approved or endorsed by the Medicines and Healthcare products Regulatory Agency (MHRA). The platform is not intended to diagnose, treat, cure, or prevent any disease or medical condition.
            </p>
          </div>

          <Section title="1. Not Medical Advice">
            <p>DataStrain is a patient review and community platform. <strong className="text-white">Nothing on this platform constitutes medical advice.</strong> The reviews, ratings, condition efficacy scores, and all other information represent individual patient experiences and opinions only.</p>
            <p>Patient experiences vary significantly. A strain that works well for one patient may not work for another due to differences in physiology, tolerance, dosage, consumption method, and other factors.</p>
            <p>Always consult your prescribing specialist doctor before: starting a new strain or product; changing your dosage or consumption method; stopping any prescribed medication; or making any decisions about your treatment based on information found on DataStrain.</p>
          </Section>

          <Section title="2. Cannabis-Based Products for Medicinal Use (CBPMs)">
            <p>Medical cannabis has been legal in the UK since November 2018, when cannabis-based products for medicinal use (CBPMs) were moved to Schedule 2 of the Misuse of Drugs Regulations 2001. CBPMs can only be legally prescribed by specialist doctors registered on the General Medical Council (GMC) Specialist Register.</p>
            <p>DataStrain is exclusively for patients who hold a valid UK prescription for CBPMs. The platform does not promote, facilitate, or condone the use of cannabis outside of a legitimate medical prescription. Recreational use of cannabis remains illegal in the United Kingdom.</p>
          </Section>

          <Section title="3. Review Accuracy">
            <p>While we moderate all reviews for authenticity and compliance with our guidelines, DataStrain does not verify the clinical accuracy of individual reviews. Ratings are subjective and based on personal experience.</p>
            <p>THC and CBD percentages displayed on strain and batch pages are sourced from laboratory certificates of analysis (COAs) where available. However, we cannot guarantee the accuracy of third-party lab results, and actual product composition may vary.</p>
            <p>Terpene profiles, condition ratings, and effect descriptions are aggregated from patient-reported data and should not be treated as clinical evidence.</p>
          </Section>

          <Section title="4. Pharmacy & Stock Information">
            <p>Any pharmacy or stock information displayed on DataStrain is provided for informational purposes only. DataStrain is not a pharmacy, does not dispense medication, and does not facilitate the purchase or sale of cannabis products.</p>
            <p>Stock availability is based on periodic polling of pharmacy systems and may not reflect real-time availability. Always contact your pharmacy directly to confirm stock before placing an order.</p>
            <p>DataStrain does not endorse any particular pharmacy and receives no compensation from pharmacies for displaying their information.</p>
          </Section>

          <Section title="5. User-Generated Content">
            <p>The majority of content on DataStrain is user-generated. While we moderate content for compliance with our community guidelines, we are not responsible for the accuracy, completeness, or reliability of user-submitted reviews, ratings, photos, or other content.</p>
            <p>Photos uploaded by users may not accurately represent the current state of a product, batch, or strain. Product quality can vary between batches, suppliers, and pharmacies.</p>
          </Section>

          <Section title="6. Rankings & Recommendations">
            <p>Strain rankings, grower ratings, and any personalised recommendations are generated algorithmically based on aggregated review data and user behaviour patterns. These rankings do not constitute endorsements or medical recommendations.</p>
            <p>The fact that a strain is &quot;top-rated&quot; or &quot;recommended&quot; by the platform&apos;s algorithm does not mean it is clinically superior or appropriate for your specific medical condition.</p>
          </Section>

          <Section title="7. Adverse Reactions">
            <p>If you experience any adverse reaction to a cannabis-based product, contact your prescribing clinician immediately. For serious adverse reactions, call 999 or attend your nearest A&amp;E department.</p>
            <p>You can also report adverse reactions directly to the MHRA via the Yellow Card scheme at yellowcard.mhra.gov.uk. Reporting helps improve the safety of medicines for everyone.</p>
          </Section>

          <Section title="8. Driving & Operating Machinery">
            <p>Cannabis-based products can impair your ability to drive and operate machinery. It is illegal to drive while impaired by any drug, including prescribed cannabis. Always follow your clinician&apos;s advice regarding driving and medication.</p>
          </Section>

          <Section title="9. Interactions">
            <p>Cannabis-based products may interact with other medications you are taking. Always inform your prescribing clinician of all medications, supplements, and cannabis products you are using.</p>
          </Section>

          <Section title="10. Limitation of Liability">
            <p>DataStrain, its founders, employees, and contributors accept no liability for any harm, loss, or damage arising from the use of information on this platform. This includes, but is not limited to, decisions about medication made based on reviews, ratings, or recommendations found on DataStrain.</p>
            <p>By using this platform, you acknowledge that you do so at your own risk and that DataStrain is a supplementary information resource, not a substitute for professional medical advice.</p>
          </Section>

          <Section title="11. Contact">
            <p>If you have concerns about any content on DataStrain or believe any information is inaccurate or harmful, please contact us immediately at hello@datastrain.co.uk.</p>
          </Section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
