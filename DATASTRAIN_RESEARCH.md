# DataStrain — Security & Review Ranking Research

**Date:** 2 April 2026

---

## Part 1: Data Security for UK Medical Cannabis Patient Data

### 1.1 UK GDPR — Special Category Data

DataStrain stores **special category data** under UK GDPR Article 9. This includes:
- Medical conditions (anxiety, insomnia, chronic pain, etc.)
- Prescription medication details (strains prescribed)
- Consumption frequency and methods
- Health-related opinions and experiences

**This is the highest classification of personal data under UK GDPR.** Processing it requires both:
1. A **lawful basis** under Article 6 (legitimate interests or consent)
2. A **special condition** under Article 9 (explicit consent is the most practical for DataStrain)

**What this means practically:**
- Users must give **explicit, informed, specific consent** to process their health data — not just a generic "I agree to terms" checkbox
- Consent must be **granular** — separate consent for storing conditions vs sharing them publicly
- Users must be able to **withdraw consent** at any time and have their data deleted
- You need a **Data Protection Impact Assessment (DPIA)** before launch — this is mandatory for processing health data at scale

### 1.2 Technical Security Requirements

#### Encryption

| Layer | Requirement | Implementation |
|-------|-------------|----------------|
| **In transit** | TLS 1.2+ mandatory | Google Cloud Load Balancer handles this; enforce HSTS headers |
| **At rest (database)** | AES-256 encryption | Supabase PostgreSQL has encryption at rest by default on their Pro plan |
| **At rest (files)** | AES-256 encryption | Google Cloud Storage encrypts at rest by default |
| **Application-level** | Encrypt PII fields before storing | Encrypt condition names, email addresses, written narratives using application-level encryption with a separate key |
| **Key management** | Separate key management | Use Google Secret Manager; rotate keys quarterly |
| **Passwords** | bcrypt with cost factor 12+ | Already using bcrypt via passlib — verify cost factor is 12+ |

#### Application-Level Encryption (Critical)

The most important security improvement: **encrypt sensitive health data at the application level** before it reaches the database. This means even if the database is compromised, the attacker gets encrypted blobs, not readable medical data.

Fields to encrypt: `condition_name`, `written_narrative`, `effects`, `flavours`, `consumption_method`

Fields that can remain unencrypted (needed for queries): `ratings` (numeric, non-identifying), `strain_id`, `batch_id`, `status`

Implementation approach: Use Python's `cryptography` library with Fernet symmetric encryption. Store the encryption key in Google Secret Manager, not in code or `.env` files.

### 1.3 Architecture — Data Separation

**Pseudonymisation:** Separate PII from review content.

Current architecture stores everything in one `reviews` table with a direct `user_id` foreign key. Better approach:

```
users table          → contains PII (email, username, bio)
review_profiles table → contains a pseudonymous reviewer_id (UUID)
reviews table        → linked to reviewer_id, NOT user_id
mapping table        → user_id ↔ reviewer_id (encrypted, separate database/schema)
```

This way, if the reviews database is breached, there's no direct path to the user's identity. The mapping table should be in a separate schema with restricted access.

**Data Minimisation:**
- Don't store what you don't need — do you really need to store consumption frequency? If not, don't collect it
- Aggregate condition data where possible — store anonymised aggregate stats separately from individual review data
- Auto-delete unused accounts after 24 months of inactivity (with 30-day warning)

### 1.4 Authentication & Access Control

| Measure | Current State | Recommendation |
|---------|---------------|----------------|
| **Patient auth** | Email + password JWT | Add MFA (TOTP via authenticator app) — optional at launch, mandatory for accessing health data |
| **Admin auth** | Firebase Google OAuth | Good — add IP allowlisting for admin endpoints |
| **Session management** | JWT in localStorage | Move to httpOnly secure cookies; localStorage is vulnerable to XSS |
| **Token expiry** | Not configured | Set JWT expiry to 15 minutes with a refresh token (7-day expiry) |
| **Rate limiting** | None | Add rate limiting on login (5 attempts per minute), registration, and API endpoints |
| **Admin access** | Single admin role | Add role-based access: `admin`, `moderator`, `support` with different permissions |
| **API security** | CORS only | Add API key requirement for public endpoints; add request signing for admin endpoints |

### 1.5 Breach Notification (UK GDPR)

If a breach occurs involving health data:
- **72 hours** to notify the ICO (Information Commissioner's Office)
- **Without undue delay** to notify affected users if the breach is likely to result in high risk
- Must document all breaches in a breach register (even minor ones)
- Must have a documented incident response plan before launch

### 1.6 Data Retention & Right to Erasure

- Users can request full deletion at any time (Article 17)
- You must delete **all** their data within 30 days, including: reviews, photos, condition ratings, library entries, kudos events, activity logs
- Reviews can be anonymised instead of deleted (remove user link, keep aggregated rating data) — but only if consent allows this
- Retain audit logs for 12 months (legal obligation), then delete
- Auto-purge inactive accounts after 24 months

### 1.7 Recommended Certifications

| Certification | Priority | Why |
|---------------|----------|-----|
| **Cyber Essentials** | Must-have before launch | UK government-backed baseline security certification; demonstrates minimum security standards; required for some NHS/health sector partnerships |
| **Cyber Essentials Plus** | Within 6 months of launch | Includes hands-on technical verification; much stronger signal |
| **ISO 27001** | 12-18 months post-launch | Full information security management system; expensive but essential if seeking NHS or pharmacy partnerships |
| **DSPT (Data Security and Protection Toolkit)** | If integrating with NHS systems | Required for any organisation processing NHS data |

### 1.8 Implementation Priority (Before Launch)

1. **DPIA** — Complete a Data Protection Impact Assessment (template available from ICO)
2. **Consent mechanism** — Granular consent for health data with clear privacy notices
3. **Move JWT to httpOnly cookies** — Prevent XSS token theft
4. **Rate limiting** — On auth endpoints and API
5. **Application-level encryption** — For condition names, narratives, effects
6. **Breach response plan** — Document the process before you need it
7. **Cyber Essentials** — Apply for certification
8. **Privacy policy** — Compliant with UK GDPR, specifically mentioning special category data processing

---

## Part 2: Review Ranking & Propensity Scoring

### 2.1 How Major Platforms Rank Reviews

| Platform | Default Sort | Algorithm |
|----------|-------------|-----------|
| **Amazon** | "Top Reviews" | Wilson score + recency + verified purchase + ML quality model |
| **Reddit** | "Best" | Wilson score lower-bound confidence interval |
| **TripAdvisor** | "Popularity Index" | Recency + quantity + quality Bayesian average |
| **Steam** | "Most Helpful" | Modified Wilson score + recency blend (game updates make old reviews irrelevant) |
| **Yelp** | Proprietary | Review quality + reviewer reputation + recency + Bayesian prior |

**Key insight:** Reddit's approach is the gold standard for ranking with binary votes (helpful/not helpful). It was designed by Evan Miller in 2009 and solves the core problem: a review with 1 helpful vote and 0 unhelpful should NOT rank above a review with 99 helpful and 1 unhelpful.

### 2.2 Recommended Default Algorithm — Time-Decayed Wilson Score

For DataStrain, use a **time-decayed Wilson score** because:
- Cannabis batches are time-sensitive (quality varies between batches)
- Older reviews on different batches may be less relevant
- You only have upvotes ("helpful"), not downvotes

```
base_score = (0.6 × wilson_lower) + (0.3 × time_decay) + (0.1 × completeness_bonus)
```

Where:
- `wilson_lower` = lower bound of Wilson confidence interval on helpful votes
- `time_decay` = exponential decay with 90-day half-life
- `completeness_bonus` = +0.05 for narrative >100 chars, +0.05 for verified photos, +0.05 for condition ratings

### 2.3 Social Graph Propensity Scoring

Your proposed system (boost reviews from people you've liked, with multi-hop propagation) maps to **Personalised Trust Propagation** — well-studied in academic literature.

#### Research-Backed Weights

| Hop | Your Proposal | Research Suggests | Recommendation |
|-----|---------------|-------------------|----------------|
| Direct (1st degree) | 100% | 100% (anchor) | **100%** |
| Friend-of-friend (2nd) | 50% | 40-60% (Golbeck et al.) | **40%** |
| 3rd degree | 25% | 10-15% (Twitter found diminishing returns) | **10%** |

**Why lower than 25% for 3rd degree?** Twitter's open-sourced algorithm (2023) found that beyond 2 hops, the signal-to-noise ratio drops dramatically. The computational cost of 3rd-degree connections grows exponentially while the quality of the signal barely improves. Start with 10%, and if you find it's adding value through A/B testing, increase it.

#### Decay Over Time

Social graph weights should also decay:
- **Relationship decay:** If you liked someone's review 2 years ago but haven't engaged since, that signal weakens. Use a 6-month half-life on vote weights.
- **Review freshness decay:** Already covered in the base score.

#### Cold Start Problem (New Users)

For new users with no helpful votes:
1. **Default to global quality ranking** (Wilson + time decay, no personalisation)
2. **Condition-based bootstrapping** — If a user has listed their conditions, immediately boost reviews mentioning those conditions
3. **Community status boost** — Give a small baseline boost to reviews from established reviewers (higher kudos)
4. **Implicit signals** — Track which reviews a user reads fully (dwell time) before they cast explicit votes

The cold start solves itself after 3-5 helpful votes.

### 2.4 Hybrid Approach — Social Graph + Content Matching

This is where DataStrain can differentiate. Combine social signals with medical relevance:

**Final scoring formula:**
```
final_score = base_score × (1.0 + social_boost + condition_boost)
```

Where:
- `social_boost` = direct_affinity + indirect_affinity (capped at 1.0)
- `condition_boost` = condition_relevance × 0.5 (capped at 0.5)

The **multiplicative model** is important: a terrible review with 0 helpful votes doesn't get boosted to the top just because the reviewer is a social connection. Base quality must be non-trivial for personalisation to elevate it.

### 2.5 Implementation — Phased Approach

#### Phase 1 (Launch): Materialised Views + Simple Scoring
- Add `review_base_scores` materialised view in PostgreSQL
- Change default ordering from `created_at desc` to base score
- Add `sort` parameter to reviews endpoint: `best` (default), `newest`, `most_helpful`
- Refresh materialised view every 15 minutes via background task
- **No personalisation yet** — just quality-based ranking

#### Phase 2 (After helpful votes are flowing): First-Degree Personalisation
- Add `user_review_affinity` materialised view (who you've voted for)
- Personalised ordering for logged-in users
- Condition-based bootstrapping for new users
- Refresh hourly

#### Phase 3 (10K+ users): Multi-Hop + Caching
- Add second-degree affinity materialised view
- Add Redis caching layer (30-minute TTL per user per batch)
- A/B test personalised vs non-personalised to validate engagement

#### Sort Options for Users
Expose sort mode in the UI — let users choose:
- **"Most Relevant"** — personalised hybrid (default for logged-in users)
- **"Most Helpful"** — Wilson score only (default for anonymous users)
- **"Newest"** — created_at desc

This builds trust in the ranking system, which is critical for a medical platform.

### 2.6 Key Academic References

- Evan Miller, "How Not To Sort By Average Rating" (2009) — Wilson score for ranking
- Kamvar et al., "The EigenTrust Algorithm" (Stanford, 2003) — trust propagation framework
- Golbeck, "Computing and Applying Trust in Web-based Social Networks" (UMD, 2005) — trust decay across hops
- Koren et al., "Matrix Factorization Techniques for Recommender Systems" (IEEE, 2009) — collaborative filtering
- Twitter/X open-sourced recommendation algorithm (2023) — social graph ranking at scale

---

## Part 3: Entity Linking & Navigation

### 3.1 Clickable Entities Throughout the App

Every mention of a grower, strain, pharmacy, or user should be a clickable link that navigates within the app (no new windows).

| Entity | Links To | URL Pattern |
|--------|----------|-------------|
| Strain name | Strain detail page | `/strain/{id}` |
| Grower name | Grower profile page | `/grower/{id}` |
| Pharmacy name | Pharmacy page | `/pharmacy/{id}` |
| Username | User public profile | `/user/{username}` |
| Batch number | Batch detail page | `/batch/{id}` |

### 3.2 Strain Detail Page — Enhanced

When clicking on a strain, the page should show:
1. **Strain info** — name, aliases, type, description, photo
2. **Versions by other growers** — same strain grown by different producers, with ratings comparison
3. **Similar strains** — strains with matching terpene profiles, effects, or conditions
4. **"People who liked this also liked"** — collaborative filtering from the affinity algorithm
5. **All batches** — list of batches for this strain with ratings and stock levels
6. **Reviews** — reviews for this strain's batches, using the ranking algorithm above

---

*This document serves as the research foundation for DataStrain's security architecture and review ranking system. Implementation should follow the phased approach outlined above.*
