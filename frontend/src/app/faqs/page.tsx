"use client";

import { useState } from "react";
import Navbar, { PublicNavActions } from "@/components/Navbar";
import Footer from "@/components/Footer";
import { brand } from "@/lib/brand";

const C = brand;

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  // Getting Started
  {
    category: "Getting Started",
    question: "What is DataStrain?",
    answer: "DataStrain is the UK's first dedicated review platform for medical cannabis patients. We provide a trusted space where patients can share structured, verified reviews of strains and batches, helping others find the right medication for their conditions.",
  },
  {
    category: "Getting Started",
    question: "Who can use DataStrain?",
    answer: "DataStrain is exclusively for UK medical cannabis patients who hold a valid prescription. During registration, you'll need to confirm that you have an active UK medical cannabis prescription. This ensures our community remains focused on genuine patient experiences.",
  },
  {
    category: "Getting Started",
    question: "Is DataStrain free to use?",
    answer: "Yes, DataStrain is completely free for patients. You can browse strains, read reviews, and discover new options without even creating an account. Registration is only required to submit reviews, build your library, and participate in the community.",
  },
  {
    category: "Getting Started",
    question: "How do I create an account?",
    answer: "Click 'Login/Register' in the top navigation bar. You'll need to provide a username, email address, and password. You'll also need to confirm that you hold a valid UK medical cannabis prescription.",
  },

  // Reviews
  {
    category: "Reviews",
    question: "How do I submit a review?",
    answer: "Once logged in, click 'Write Review' in the navigation bar. You'll select the grower and batch you're reviewing, upload three photos (product, close-up, and packaging), rate five categories (look, aroma, moisture, flavour, and effect) out of 5, and write your experience. You can optionally add condition ratings, effects, and flavours in step two.",
  },
  {
    category: "Reviews",
    question: "Why do I need to upload photos?",
    answer: "Photos are mandatory to ensure review authenticity. They help other patients see the actual product quality and allow our moderation team to verify that reviews are genuine. We require three photos: the product itself, a close-up of the buds, and the packaging.",
  },
  {
    category: "Reviews",
    question: "Are reviews moderated?",
    answer: "Yes, every review enters a pending state and must be approved before it goes live. Our moderation team checks that reviews are genuine, photos don't contain identifiable information (like prescription labels or names), and content meets our community guidelines.",
  },
  {
    category: "Reviews",
    question: "Can I edit my review after submitting?",
    answer: "You can edit a review while it's still pending approval. Once a review has been approved, it is locked to maintain the integrity of our review data.",
  },
  {
    category: "Reviews",
    question: "What are the five rating categories?",
    answer: "Each strain is rated across five categories on a 1-5 scale: Look (visual appearance and bud quality), Aroma (smell profile), Moisture (cure and moisture level), Flavour (taste when consumed), and Effect (overall therapeutic effect).",
  },

  // Strains & Batches
  {
    category: "Strains & Batches",
    question: "What's the difference between a strain and a batch?",
    answer: "A strain is the cannabis variety (e.g., Gelato, Ghost Train Haze). A batch is a specific production run of that strain by a particular grower, with its own batch number, lab-tested THC/CBD percentages, and terpene profile. Quality can vary significantly between batches, which is why we track reviews at the batch level.",
  },
  {
    category: "Strains & Batches",
    question: "Can I submit a new strain?",
    answer: "Yes, patients can submit strains they've been prescribed that aren't yet in our database. Submitted strains require admin approval before reviews can be attached to them.",
  },
  {
    category: "Strains & Batches",
    question: "What are the trading cards?",
    answer: "Our 'Top Trumps' style strain cards are a fun, visual way to compare strains at a glance. Each card shows the strain name, grower, THC/CBD percentages, type, top condition it helps with, primary effect, and flavour profile. You can flip cards to see detailed rating breakdowns and terpene profiles.",
  },
  {
    category: "Strains & Batches",
    question: "How is the strain ranking calculated?",
    answer: "Strain rankings are based on the average review ratings across all approved reviews for that strain's batches. The more reviews a strain has, the more reliable its ranking becomes.",
  },

  // Community
  {
    category: "Community",
    question: "What are kudos points?",
    answer: "Kudos points are earned through community participation: submitting reviews (+10 pts), receiving helpful votes (+5 pts), gaining followers (+15 pts), and being the first to review a batch (+20 pts). Your total kudos determines your community rank.",
  },
  {
    category: "Community",
    question: "What are the community ranks?",
    answer: "There are six ranks: Seedling (0-49 pts), Sprout (50-149 pts), Grower (150-399 pts), Cultivator (400-999 pts), Master Cultivator (1,000-2,499 pts), and Legend (2,500+ pts). Ranks can only go up, never down.",
  },
  {
    category: "Community",
    question: "What are emblems?",
    answer: "Emblems are achievement badges you unlock by reaching certain milestones. For example, 'First Timer' for your first review, 'Strain Scout' for reviewing 5+ strains, 'Trusted Taster' for 10+ approved reviews, 'Photo Pro' for uploading photos on 10+ reviews, and more. They appear on your public profile.",
  },
  {
    category: "Community",
    question: "Can I follow other users?",
    answer: "Yes, you can follow reviewers whose opinions you trust. Their reviews will be highlighted in your personalised feed, and following someone earns them kudos points.",
  },

  // Privacy & Security
  {
    category: "Privacy & Security",
    question: "Is my medical data safe?",
    answer: "Yes, we take data security extremely seriously. DataStrain stores special category health data under UK GDPR, which means we apply the highest level of protection. Sensitive health data like conditions is encrypted at the application level, and we never display individual condition data publicly — only anonymised aggregated statistics.",
  },
  {
    category: "Privacy & Security",
    question: "What can other users see on my profile?",
    answer: "You have full control over your public profile with granular privacy toggles. You can individually choose to show or hide your bio, reviews, conditions, effects, library (tried/wishlist/favourites), follower count, and kudos/rank. Conditions default to private.",
  },
  {
    category: "Privacy & Security",
    question: "Can I delete my account?",
    answer: "Yes, you can request full account deletion at any time under UK GDPR Article 17 (right to erasure). All your personal data, reviews, photos, and library entries will be permanently deleted within 30 days of your request.",
  },
  {
    category: "Privacy & Security",
    question: "Do you share my data with anyone?",
    answer: "We never sell or share your personal data with third parties. Anonymised, aggregated statistics (like '87% of patients with insomnia rated this strain 7+/10') may be displayed on the platform, but these can never be traced back to individual users.",
  },

  // Library
  {
    category: "Library",
    question: "What is the Library feature?",
    answer: "Your Library is your personal cannabis journal. It has three sections: Tried (strains you've used), Wishlist (strains you want to try), and Favourites/Fire (your top picks). You can add strains to these lists directly from the strain cards using the Wishlist, Tried, and Fire buttons.",
  },
  {
    category: "Library",
    question: "Can I pin a favourite strain to my profile?",
    answer: "Yes, you can pin one strain as your 'Favourite Strain' which will be prominently displayed on your public profile as a trading card.",
  },

  // General
  {
    category: "General",
    question: "Does DataStrain provide medical advice?",
    answer: "No. DataStrain is a patient review platform, not a medical service. The reviews, ratings, and information on this platform represent individual patient experiences and should not be interpreted as clinical evidence of efficacy. Always consult your prescribing clinician before making changes to your medication.",
  },
  {
    category: "General",
    question: "How do I report inappropriate content?",
    answer: "Every review has a 'Report' button at the bottom. Click it to flag content that violates our community guidelines. Our moderation team will review the report and take appropriate action.",
  },
  {
    category: "General",
    question: "I've found a bug or have a suggestion. How do I get in touch?",
    answer: "We'd love to hear from you! Please reach out via the Contact page or email us directly. We're a small team building this for the community, and patient feedback is invaluable.",
  },
];

const categories = [...new Set(faqs.map((f) => f.category))];

function FAQItem({ faq }: { faq: FAQ }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-xl"
      style={{ backgroundColor: C.bgCard }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="pr-4 text-sm font-semibold text-white">{faq.question}</span>
        <span
          className="shrink-0 text-lg transition-transform"
          style={{
            color: C.primary,
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
          }}
        >
          +
        </span>
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm leading-relaxed" style={{ color: C.textMuted }}>
            {faq.answer}
          </p>
        </div>
      )}
    </div>
  );
}

export default function FAQsPage() {
  return (
    <div className="min-h-screen">
      <Navbar rightSlot={<PublicNavActions />} showSearch />

      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-white">Frequently Asked Questions</h1>
          <p className="mt-3 text-base" style={{ color: C.textMuted }}>
            Everything you need to know about DataStrain.
          </p>
        </div>

        {categories.map((cat) => (
          <section key={cat} className="mb-8">
            <h2 className="mb-4 text-lg font-bold" style={{ color: C.primary }}>
              {cat}
            </h2>
            <div className="space-y-2">
              {faqs
                .filter((f) => f.category === cat)
                .map((faq) => (
                  <FAQItem key={faq.question} faq={faq} />
                ))}
            </div>
          </section>
        ))}
      </main>

      <Footer />
    </div>
  );
}
