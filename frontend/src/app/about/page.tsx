"use client";

import Navbar, { PublicNavActions } from "@/components/Navbar";
import Footer from "@/components/Footer";
import { brand } from "@/lib/brand";

const C = brand;

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Navbar rightSlot={<PublicNavActions />} showSearch />

      <main className="mx-auto max-w-4xl px-4 py-12">
        {/* Hero */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold text-white">About DataStrain</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed" style={{ color: C.textMuted }}>
            The trusted voice of quality in the UK medical cannabis market.
          </p>
        </div>

        {/* Mission */}
        <section
          className="mb-8 rounded-2xl p-8"
          style={{ backgroundColor: C.bgCard }}
        >
          <h2 className="mb-4 text-xl font-bold text-white">Our Mission</h2>
          <p className="text-sm leading-relaxed" style={{ color: C.textMuted }}>
            DataStrain exists because UK medical cannabis patients deserve better. Right now, patient experiences are scattered across Reddit threads, Facebook groups, and Discord servers — unverified, unsearchable, and impossible to trust. We&apos;re changing that.
          </p>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: C.textMuted }}>
            We&apos;re building the UK&apos;s first dedicated, structured review platform for medical cannabis. Every review is tied to a real patient, a real batch, and real lab-tested data. No guesswork, no anonymous forums — just honest, moderated feedback that helps you find the right strain for your condition.
          </p>
        </section>

        {/* How It Works */}
        <section
          className="mb-8 rounded-2xl p-8"
          style={{ backgroundColor: C.bgCard }}
        >
          <h2 className="mb-6 text-xl font-bold text-white">How It Works</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: `${C.primary}22`, color: C.primary }}>1</span>
                <h3 className="font-semibold text-white">Discover</h3>
              </div>
              <p className="text-sm" style={{ color: C.textMuted }}>
                Browse strains, growers, and batches. Filter by type, condition, effect, or terpene profile to find exactly what you&apos;re looking for.
              </p>
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: `${C.primary}22`, color: C.primary }}>2</span>
                <h3 className="font-semibold text-white">Review</h3>
              </div>
              <p className="text-sm" style={{ color: C.textMuted }}>
                Submit detailed reviews with photos, ratings across five categories (look, aroma, moisture, flavour, effect), and condition-specific efficacy scores.
              </p>
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: `${C.primary}22`, color: C.primary }}>3</span>
                <h3 className="font-semibold text-white">Community</h3>
              </div>
              <p className="text-sm" style={{ color: C.textMuted }}>
                Follow reviewers you trust, earn kudos points and emblems, climb the community ranks from Seedling to Legend, and build your reputation as a trusted voice.
              </p>
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: `${C.primary}22`, color: C.primary }}>4</span>
                <h3 className="font-semibold text-white">Library</h3>
              </div>
              <p className="text-sm" style={{ color: C.textMuted }}>
                Track what you&apos;ve tried, build a wishlist of strains you want to try, and mark your favourites. Your personal cannabis journal, all in one place.
              </p>
            </div>
          </div>
        </section>

        {/* What Makes Us Different */}
        <section
          className="mb-8 rounded-2xl p-8"
          style={{ backgroundColor: C.bgCard }}
        >
          <h2 className="mb-6 text-xl font-bold text-white">What Makes Us Different</h2>
          <div className="space-y-4">
            {[
              { icon: "\u{1F50D}", title: "Batch-Level Accuracy", desc: "Reviews are tied to specific batches with lab-tested THC/CBD percentages and terpene profiles — not just strain names. Because quality varies between batches." },
              { icon: "\u{1F4F8}", title: "Photo Verified", desc: "Every review requires photos of the product. Our moderation team ensures reviews are genuine and no prescription-identifiable information is visible." },
              { icon: "\u{1F3AF}", title: "Condition-Specific Ratings", desc: "Rate how well a strain helps with specific conditions like anxiety, insomnia, or chronic pain. Find what actually works for your needs." },
              { icon: "\u{1F91D}", title: "Community Driven", desc: "Earn kudos, unlock emblems, and build your reputation. The most helpful reviewers rise to the top through our trust-weighted ranking system." },
              { icon: "\u{1F512}", title: "Privacy First", desc: "Your health data is sensitive. We encrypt condition data at the application level, and you control exactly what appears on your public profile with granular privacy toggles." },
              { icon: "\u{1FA7A}", title: "Patient-Only Platform", desc: "DataStrain is exclusively for UK medical cannabis patients with valid prescriptions. This isn&apos;t a lifestyle site — it&apos;s a medical tool built by patients, for patients." },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <span className="mt-0.5 text-xl">{item.icon}</span>
                <div>
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <p className="mt-1 text-sm" style={{ color: C.textMuted }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Community Ranks */}
        <section
          className="mb-8 rounded-2xl p-8"
          style={{ backgroundColor: C.bgCard }}
        >
          <h2 className="mb-6 text-xl font-bold text-white">Community Ranks</h2>
          <p className="mb-4 text-sm" style={{ color: C.textMuted }}>
            Earn kudos points by writing reviews, receiving helpful votes, gaining followers, and being the first to review a batch. Your rank can only go up, never down.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "Seedling", range: "0 - 49 pts", icon: "\u{1F331}", color: C.textMuted },
              { name: "Sprout", range: "50 - 149 pts", icon: "\u{1F33F}", color: "#6ecf8a" },
              { name: "Grower", range: "150 - 399 pts", icon: "\u{1F33E}", color: C.primary },
              { name: "Cultivator", range: "400 - 999 pts", icon: "\u{2B50}", color: C.secondary },
              { name: "Master Cultivator", range: "1,000 - 2,499 pts", icon: "\u{1F451}", color: "#f9cf58" },
              { name: "Legend", range: "2,500+ pts", icon: "\u{1F48E}", color: C.tertiary },
            ].map((rank) => (
              <div
                key={rank.name}
                className="flex items-center gap-3 rounded-xl p-3"
                style={{ backgroundColor: `${rank.color}12` }}
              >
                <span className="text-2xl">{rank.icon}</span>
                <div>
                  <p className="text-sm font-bold" style={{ color: rank.color }}>{rank.name}</p>
                  <p className="text-xs" style={{ color: C.textMuted }}>{rank.range}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Important Notice */}
        <section
          className="rounded-2xl p-8"
          style={{ backgroundColor: C.bgCard, borderLeft: `4px solid ${C.secondary}` }}
        >
          <h2 className="mb-3 text-lg font-bold text-white">Important Notice</h2>
          <p className="text-sm leading-relaxed" style={{ color: C.textMuted }}>
            DataStrain is for UK medical cannabis patients only. All users must confirm they hold a valid UK medical cannabis prescription upon registration. This platform does not provide medical advice — always consult your prescribing clinician before making changes to your medication.
          </p>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: C.textMuted }}>
            MHRA Disclaimer: DataStrain is not a regulated medical device. The reviews and ratings on this platform represent individual patient experiences and should not be interpreted as clinical evidence of efficacy.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
