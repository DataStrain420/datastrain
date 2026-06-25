"""
Seed script — populates the local SQLite database with dummy growers,
strains, batches, users, and reviews so the frontend has data to render.

Usage:
    cd backend
    python seed.py
"""

import asyncio
import json
import random
from datetime import date, datetime, timedelta

from sqlalchemy import select, text

from app.config import settings
from app.database import Base, async_session, engine
from app.models import (
    Batch,
    BatchTerpene,
    Clinic,
    ConditionRating,
    Grower,
    Pharmacy,
    Review,
    ReviewStatus,
    Strain,
    StrainType,
    Terpene,
    User,
)

# ── Grower data (real UK medical cannabis producers / importers) ──────────────

GROWERS = [
    {"name": "GW Pharmaceuticals", "country_of_origin": "United Kingdom", "verified": True},
    {"name": "Northern Leaf", "country_of_origin": "United Kingdom", "verified": True},
    {"name": "Dalgety", "country_of_origin": "United Kingdom", "verified": True},
    {"name": "Glass Pharms", "country_of_origin": "United Kingdom", "verified": True},
    {"name": "PLF Pharma", "country_of_origin": "Germany", "verified": True},
    {"name": "Tilray", "country_of_origin": "Canada", "verified": True},
    {"name": "Aurora", "country_of_origin": "Canada", "verified": True},
    {"name": "Bedrocan", "country_of_origin": "Netherlands", "verified": True},
    {"name": "Noidecs", "country_of_origin": "Portugal", "verified": True},
    {"name": "Khiron", "country_of_origin": "Colombia", "verified": True},
    {"name": "Grow Pharma", "country_of_origin": "United Kingdom", "verified": True},
    {"name": "BOL Pharma", "country_of_origin": "Israel", "verified": True},
    {"name": "Cellen", "country_of_origin": "United Kingdom", "verified": True},
    {"name": "Cantourage", "country_of_origin": "Germany", "verified": True},
    {"name": "Lyphe Group", "country_of_origin": "United Kingdom", "verified": True},
    {"name": "Althea", "country_of_origin": "Australia", "verified": True},
    {"name": "MedCan", "country_of_origin": "Australia", "verified": True},
    {"name": "Fotmer", "country_of_origin": "Uruguay", "verified": True},
]

# ── Strain data ───────────────────────────────────────────────────────────────

# (name, type, grower_idx, aliases, genetics)
STRAINS = [
    ("Adven EMT-1 Flos", StrainType.INDICA, 0, "EMT-1, Egyptian", None),
    ("Adven EMT-2 Flos", StrainType.SATIVA, 0, "EMT-2", None),
    ("Gorilla Glue", StrainType.HYBRID, 1, "GG4, Original Glue", "Chem's Sister x Sour Dubb x Chocolate Diesel"),
    ("Gelato", StrainType.HYBRID, 1, "Larry Bird, Zelato", "Sunset Sherbet x Thin Mints GSC"),
    ("Isando", StrainType.INDICA, 2, "Royal Moby", "Haze x White Widow"),
    ("Mahdjong", StrainType.SATIVA, 2, None, None),
    ("Strawberry Glue", StrainType.HYBRID, 3, "Strawberry Gorilla", "Strawberry Diesel x Gorilla Glue"),
    ("Hindu Kush", StrainType.INDICA, 3, "HK, Pure Kush", "Landrace (Hindu Kush Mountains)"),
    ("Ghost Train Haze", StrainType.SATIVA, 4, "GTH, Ghost OG", "Ghost OG x Neville's Wreck"),
    ("Gelato Runtz", StrainType.HYBRID, 4, "Larry Bird, Zelato", "Gelato x Zkittlez x Runtz"),
    ("Master Kush", StrainType.INDICA, 5, "High Rise, Grandmaster", "Hindu Kush x Skunk #1"),
    ("Purple Kush", StrainType.INDICA, 5, "Purple Hindu, PK", "Hindu Kush x Purple Afghani"),
    ("Pedanios 22/1", StrainType.SATIVA, 6, None, None),
    ("Pedanios 20/1", StrainType.HYBRID, 6, None, None),
    ("Bedica", StrainType.INDICA, 7, "Talea", None),
    ("Bedrobinol", StrainType.SATIVA, 7, "Jack Herer", "Haze x Northern Lights #5 x Shiva Skunk"),
    ("Shishkaberry", StrainType.INDICA, 8, "Kish, DJ Short", "DJ Short Blueberry x Afghani"),
    ("Amnesia Haze", StrainType.SATIVA, 8, "Amnesia, Ammo", "South Asian x Jamaican x Afghani Hawaiian"),
    ("Afghan Kush", StrainType.INDICA, 9, "Afghan, Afghani", "Landrace (Afghanistan)"),
    ("Herijuana", StrainType.INDICA, 10, "Heri, Woodhorse", "Petrolia Headstash x Killer New Haven"),
    ("Blue Cheese", StrainType.INDICA, 11, "Blueberry Cheese, BC", "Blueberry x UK Cheese"),
    ("Lemon Skunk", StrainType.SATIVA, 12, "Lemon S, DNA Lemon", "Skunk #1 pheno x Skunk #1 pheno"),
    ("Warlock", StrainType.HYBRID, 13, "Magus Genetics", "Skunk #1 x Afghani"),
    ("Super Lemon Haze", StrainType.SATIVA, 14, "SLH, Lemon Haze", "Lemon Skunk x Super Silver Haze"),
    ("Henik", StrainType.HYBRID, 15, None, None),
    ("Pink Kush", StrainType.INDICA, 16, "Pink OG, PK", "OG Kush phenotype"),
    ("Uruguayan Kush", StrainType.INDICA, 17, "UKush", None),
]

# ── Pharmacies (real UK dispensing pharmacies for medical cannabis) ──────────

PHARMACIES = [
    {"name": "IPS Pharma", "location": "Wickford, Essex", "website": "https://ipspecialspharma.com", "description": "Specials manufacturer and dispensing pharmacy supplying unlicensed medical cannabis to UK clinics.", "verified": True},
    {"name": "Dispensary Green", "location": "Crawley, West Sussex", "website": "https://dispensarygreen.com", "description": "UK specialist pharmacy focused on medical cannabis dispensing with mail-order across England, Scotland and Wales.", "verified": True},
    {"name": "Lyphe Pharmacy", "location": "London", "website": "https://lyphegroup.com", "description": "Dispensing arm of the Lyphe Group, fulfilling prescriptions written through Lyphe Clinic and partner clinics.", "verified": True},
    {"name": "Curaleaf Pharmacy", "location": "Stoke-on-Trent", "website": "https://curaleafclinic.com", "description": "Vertically-integrated pharmacy paired with Curaleaf Clinic; UK distribution of Curaleaf-imported product.", "verified": True},
    {"name": "Mamedica Pharmacy", "location": "London", "website": "https://mamedica.co.uk", "description": "Mamedica's dispensing pharmacy — exclusive fulfilment for Mamedica subscription patients.", "verified": True},
    {"name": "Astral Health", "location": "Knaresborough, North Yorkshire", "website": "https://astralhealth.co.uk", "description": "Independent specials pharmacy offering same-day dispensing for Northern England clinics.", "verified": True},
    {"name": "Releaf Pharmacy", "location": "Cambridge", "website": "https://releaf.co.uk", "description": "In-house dispensing for Releaf clinic patients on the all-in monthly subscription model.", "verified": True},
    {"name": "Cellen Vivary", "location": "London", "website": "https://cellen.life", "description": "Cellen Therapeutics' dispensing pharmacy — partnered with Lyphe Clinic and other major prescribers.", "verified": True},
    {"name": "Marvera Specials", "location": "Bedford", "website": "https://marvera.co.uk", "description": "Independent specials pharmacy dispensing imported medical cannabis flower and oils to UK clinics.", "verified": True},
    {"name": "Roseway Labs", "location": "London", "website": "https://rosewaylabs.com", "description": "Specials pharmacy and product developer working with multiple UK prescribing clinics.", "verified": True},
    {"name": "Pharmadica", "location": "London", "website": "https://pharmadica.uk", "description": "Specials pharmacy with same-day delivery into central London and next-day nationwide.", "verified": False},
    {"name": "Lloydspharmacy Specials", "location": "Coventry", "website": "https://lloydspharmacy.com", "description": "High-street pharmacy chain offering specials dispensing including medical cannabis via select clinics.", "verified": False},
]

# ── Clinics (real UK prescribing clinics for medical cannabis) ───────────────

CLINICS = [
    {"name": "Sapphire Medical Clinics", "location": "London (Harley Street)", "website": "https://sapphireclinics.com", "description": "MHRA-registered specialist clinic with the UK Medical Cannabis Registry; consultants across pain, mental health and neurology.", "specialties": '["Chronic pain", "Anxiety", "PTSD", "Sleep disorders", "Neurological"]', "consultation_fee_gbp": 150, "verified": True},
    {"name": "Lyphe Clinic", "location": "London", "website": "https://lyphe.com", "description": "Formerly The Medical Cannabis Clinics. One of the longest-running prescribers in the UK with a large multi-disciplinary consultant team.", "specialties": '["Chronic pain", "Anxiety", "ADHD", "Cancer-related symptoms", "Palliative care"]', "consultation_fee_gbp": 100, "verified": True},
    {"name": "Mamedica", "location": "London", "website": "https://mamedica.co.uk", "description": "Fixed monthly subscription model — initial assessment plus all follow-ups and reissues bundled into one fee.", "specialties": '["Chronic pain", "Anxiety", "PTSD", "Insomnia"]', "consultation_fee_gbp": 50, "verified": True},
    {"name": "Releaf", "location": "Cambridge", "website": "https://releaf.co.uk", "description": "All-in-one subscription bundling consultations, prescription delivery and medication into a single monthly fee.", "specialties": '["Chronic pain", "Anxiety", "Sleep disorders", "ADHD"]', "consultation_fee_gbp": 50, "verified": True},
    {"name": "Curaleaf Clinic", "location": "Stoke-on-Trent / online UK-wide", "website": "https://curaleafclinic.com", "description": "Specialist team across pain, neurology and mental health; vertically integrated with Curaleaf Pharmacy.", "specialties": '["Chronic pain", "Anxiety", "PTSD", "Neurological", "Oncology"]', "consultation_fee_gbp": 100, "verified": True},
    {"name": "Alternaleaf", "location": "London (online UK-wide)", "website": "https://alternaleaf.co.uk", "description": "Australian-origin clinic that launched UK operations in 2024 — fast online triage and prescriber assignment.", "specialties": '["Chronic pain", "Anxiety", "ADHD", "Endometriosis"]', "consultation_fee_gbp": 75, "verified": True},
    {"name": "Cantourage Clinic UK", "location": "London", "website": "https://cantourageclinic.co.uk", "description": "UK arm of German licensed producer Cantourage; consultants across pain, mental-health and neurology.", "specialties": '["Chronic pain", "Anxiety", "Migraine", "Fibromyalgia"]', "consultation_fee_gbp": 95, "verified": True},
    {"name": "Integro Medical Cannabis Clinics", "location": "Reading, Berkshire", "website": "https://integroclinics.com", "description": "Specialist clinic with a long-standing focus on chronic pain and complex multi-morbidity cases.", "specialties": '["Chronic pain", "Fibromyalgia", "Cancer pain", "Neuropathic pain"]', "consultation_fee_gbp": 120, "verified": True},
    {"name": "Birmingham Cannabis Clinic", "location": "Birmingham", "website": "https://birminghamcannabisclinic.com", "description": "Independent Midlands-based clinic offering in-person and remote appointments for medical cannabis assessment.", "specialties": '["Chronic pain", "Anxiety", "Insomnia"]', "consultation_fee_gbp": 110, "verified": False},
    {"name": "Onyx Medical Cannabis Clinic", "location": "London", "website": "https://onyxmedical.co.uk", "description": "Boutique private clinic with same-week appointments and follow-up via secure messaging.", "specialties": '["Chronic pain", "Anxiety", "PTSD"]', "consultation_fee_gbp": 200, "verified": False},
    {"name": "LVL Health", "location": "London", "website": "https://lvlhealth.uk", "description": "Patient-membership model with bundled consultations and an in-app symptom tracker.", "specialties": '["Chronic pain", "Sleep disorders", "Anxiety"]', "consultation_fee_gbp": 80, "verified": False},
    {"name": "Cancard Wellford Clinic", "location": "Online UK-wide", "website": "https://wellfordmedical.co.uk", "description": "Online-first clinic associated with the Cancard patient advocacy programme; focus on accessibility.", "specialties": '["Chronic pain", "Anxiety", "Inflammatory bowel disease"]', "consultation_fee_gbp": 60, "verified": False},
]

# ── Terpenes ──────────────────────────────────────────────────────────────────

TERPENES = [
    ("Myrcene", "Earthy, musky, herbal", "herbal, clove"),
    ("Limonene", "Citrus, fresh, uplifting", "lemon, orange"),
    ("Caryophyllene", "Spicy, peppery, woody", "pepper, clove"),
    ("Linalool", "Floral, lavender, calming", "lavender"),
    ("Pinene", "Pine, sharp, fresh", "pine, rosemary"),
    ("Humulene", "Earthy, woody, hoppy", "hops"),
    ("Terpinolene", "Herbal, floral, piney", "nutmeg, lilac"),
    ("Ocimene", "Sweet, herbal, woody", "mint, parsley"),
    ("Bisabolol", "Floral, sweet, gentle", "chamomile"),
    ("Valencene", "Citrus, sweet, fresh", "orange, grapefruit"),
]

# ── Seed users (for reviews) ─────────────────────────────────────────────────

SEED_USERS = [
    "patient_alex",
    "patient_beth",
    "patient_charlie",
    "patient_dana",
    "patient_evan",
    "patient_fiona",
    "patient_george",
    "patient_hannah",
]


async def seed():
    print("Dropping and recreating all tables...")
    async with engine.begin() as conn:
        if settings.is_sqlite:
            # SQLite has no FK enforcement during drop_all by default,
            # and our cycle (users.pinned_strain_id ↔ strains.submitted_by_id)
            # doesn't trip its dependency sort.
            await conn.run_sync(Base.metadata.drop_all)
        else:
            # Postgres: drop the whole public schema in one CASCADE so we
            # don't have to topologically sort tables — sidesteps the cycle.
            await conn.execute(text("DROP SCHEMA public CASCADE"))
            await conn.execute(text("CREATE SCHEMA public"))
            await conn.execute(text("GRANT ALL ON SCHEMA public TO public"))
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:

        # ── Growers ───────────────────────────────────────────────────────
        print("Seeding growers...")
        grower_objs = []
        for g in GROWERS:
            grower = Grower(**g)
            db.add(grower)
            grower_objs.append(grower)
        await db.flush()

        # ── Pharmacies ────────────────────────────────────────────────────
        print(f"Seeding {len(PHARMACIES)} pharmacies...")
        for p in PHARMACIES:
            db.add(Pharmacy(**p))
        await db.flush()

        # ── Clinics ───────────────────────────────────────────────────────
        print(f"Seeding {len(CLINICS)} clinics...")
        for c in CLINICS:
            db.add(Clinic(**c))
        await db.flush()

        # ── Terpenes ──────────────────────────────────────────────────────
        print("Seeding terpenes...")
        terpene_objs = []
        for name, desc, aroma in TERPENES:
            t = Terpene(name=name, description=desc, aroma_notes=aroma)
            db.add(t)
            terpene_objs.append(t)
        await db.flush()

        # ── Strains ───────────────────────────────────────────────────────
        print("Seeding strains...")
        strain_objs = []
        for name, stype, grower_idx, aliases, genetics in STRAINS:
            s = Strain(
                name=name,
                strain_type=stype.value,
                aliases=aliases,
                genetics=genetics,
                description=f"Premium medical cannabis strain by {grower_objs[grower_idx].name}.",
                grower_id=grower_objs[grower_idx].id,
                approved=True,
            )
            db.add(s)
            strain_objs.append(s)
        await db.flush()

        # Map grower name → irradiation default. Reflects real UK 2026
        # practice: Bedrocan flower is steam-sterilised, not gamma-irradiated;
        # most large North-American producers gamma-irradiate by default.
        # Anything not listed gets a randomised value below.
        IRRADIATION_BY_GROWER = {
            "Bedrocan": False,
            "Glass Pharms": False,
            "Tilray": True,
            "Aurora": True,
            "BOL Pharma": True,
            "Khiron": True,
            "Fotmer": True,
            "Curaleaf": True,
        }
        grower_by_id = {g.id: g.name for g in grower_objs}

        # ── Batches ───────────────────────────────────────────────────────
        print("Seeding batches...")
        # Pre-pull pharmacy IDs so each batch can be assigned to a dispensing
        # pharmacy — drives the "Available Stock" section on the pharmacy page.
        pharm_ids_result = await db.execute(select(Pharmacy.id))
        pharmacy_ids = [r[0] for r in pharm_ids_result.all()]
        batch_objs = []
        for i, strain in enumerate(strain_objs):
            thc = round(random.uniform(14.0, 28.0), 1)
            cbd = round(random.uniform(0.0, 2.0), 1)
            grower_name = grower_by_id.get(strain.grower_id, "")
            irradiated = IRRADIATION_BY_GROWER.get(grower_name)
            if irradiated is None:
                # ~70/30 split for growers without a fixed default.
                irradiated = random.random() < 0.7
            batch = Batch(
                strain_id=strain.id,
                grower_id=strain.grower_id,
                batch_number=f"BN-2026-{i+1:03d}",
                thc_percentage=thc,
                cbd_percentage=cbd,
                tested_date=date(2026, random.randint(1, 3), random.randint(1, 28)),
                irradiated=irradiated,
                dispensing_pharmacy_id=(random.choice(pharmacy_ids) if pharmacy_ids else None),
                approved=True,
            )
            db.add(batch)
            batch_objs.append(batch)
        await db.flush()

        # ── Batch terpene profiles ────────────────────────────────────────
        print("Seeding terpene profiles...")
        for batch in batch_objs:
            chosen = random.sample(terpene_objs, k=random.randint(2, 5))
            for t in chosen:
                bt = BatchTerpene(
                    batch_id=batch.id,
                    terpene_id=t.id,
                    percentage=round(random.uniform(0.1, 1.8), 2),
                )
                db.add(bt)
        await db.flush()

        # ── Users ─────────────────────────────────────────────────────────
        print("Seeding users...")
        user_objs = []
        for uname in SEED_USERS:
            u = User(
                username=uname,
                email=f"{uname}@example.com",
                password_hash="$2b$12$seedhashnotforlogin000000000000000000000000000",
                is_verified=True,
            )
            db.add(u)
            user_objs.append(u)
        await db.flush()

        # ── Reviews ───────────────────────────────────────────────────────
        print("Seeding reviews...")

        NARRATIVES = [
            "Absolutely stunning buds with deep purple hues and orange pistils. The aroma is incredibly complex with notes of berry, earth, and a hint of spice. The smoke is smooth and the effects are perfectly balanced — euphoric yet relaxing. Top-notch quality. The cure is perfect and the trichome coverage is exceptional.",
            "Really impressed with this batch. Dense, well-trimmed nugs with a strong citrus aroma. The effects come on quickly and last a good 3 hours. Great for evening use when you need to wind down after a long day.",
            "Decent quality but not the best I've had from this grower. The moisture level was slightly off — a bit too dry. Flavour was earthy with pine notes. Effects were mild but consistent. Would still recommend for daytime use.",
            "This is my go-to strain for managing chronic pain. The effects are deeply relaxing without being sedating. Beautiful frosty buds with a sweet, almost candy-like aroma. Excellent batch consistency.",
            "Very potent batch. Started with a cerebral uplift that gradually transitioned into full body relaxation. The flavour profile is complex — herbal, woody, with a peppery finish. One of the better batches I've reviewed this year.",
            "Good all-rounder. Nice bag appeal with tight, compact buds. The aroma is subtle but pleasant — earthy with floral undertones. Effects are balanced and manageable. Perfect for patients new to medical cannabis.",
            "Outstanding quality. The terpene profile on this batch is remarkable — strong limonene presence giving it a bright citrus flavour. Effects are uplifting and creative. Highly recommend for anxiety management.",
            "Consistent quality from this grower as always. The buds are perfectly cured with excellent moisture retention. Smooth smoke, no harshness. The effects are calming and great for sleep.",
        ]

        # Placeholder photo URLs
        PLACEHOLDER_PHOTO = "/images/strain-placeholder.png"

        EFFECTS_POOL = [
            "Relaxed", "Euphoric", "Creative", "Sleepy", "Uplifted",
            "Focused", "Happy", "Hungry", "Energised", "Calm",
            "Amused", "Giggly", "Tingly", "Aroused", "Talkative",
        ]

        FLAVOURS_POOL = [
            "Citrus", "Honey", "Sweet", "Earthy", "Pine",
            "Berry", "Spicy", "Woody", "Herbal", "Floral",
            "Peppery", "Diesel", "Tropical", "Mint", "Vanilla",
            "Gassy", "Skunky", "Cheese", "Lemon", "Grape",
        ]

        CONDITIONS_POOL = [
            "Anxiety", "Insomnia", "Chronic Pain", "Depression",
            "PTSD", "Migraines", "Nausea", "ADHD",
            "Muscle Spasms", "Appetite Loss", "Arthritis",
            "Fibromyalgia", "Epilepsy", "Stress",
        ]

        review_count = 0
        for batch in batch_objs:
            # Each batch gets 2-6 reviews from random users
            reviewers = random.sample(user_objs, k=random.randint(2, min(6, len(user_objs))))
            for user in reviewers:
                chosen_effects = random.sample(EFFECTS_POOL, k=3)
                chosen_flavours = random.sample(FLAVOURS_POOL, k=3)
                chosen_condition = random.choice(CONDITIONS_POOL)

                r = Review(
                    user_id=user.id,
                    batch_id=batch.id,
                    appearance_rating=random.randint(2, 5),
                    aroma_rating=random.randint(2, 5),
                    moisture_rating=random.randint(2, 5),
                    flavour_rating=random.randint(2, 5),
                    effect_rating=random.randint(2, 5),
                    written_narrative=random.choice(NARRATIVES),
                    photo_product_url=PLACEHOLDER_PHOTO,
                    photo_closeup_url=PLACEHOLDER_PHOTO,
                    photo_packaging_url=PLACEHOLDER_PHOTO,
                    effects=json.dumps(chosen_effects),
                    flavours=json.dumps(chosen_flavours),
                    confirmed_own_experience=True,
                    confirmed_medical_only=True,
                    status=ReviewStatus.APPROVED.value,
                    helpful_votes=random.randint(0, 45),
                )
                db.add(r)
                await db.flush()

                # Add condition rating
                cr = ConditionRating(
                    review_id=r.id,
                    condition_name=chosen_condition,
                    efficacy_rating=random.randint(2, 5),
                )
                db.add(cr)
                review_count += 1
        await db.flush()

        await db.commit()
        print(
            f"\nSeed complete:\n"
            f"  {len(grower_objs)} growers\n"
            f"  {len(terpene_objs)} terpenes\n"
            f"  {len(strain_objs)} strains\n"
            f"  {len(batch_objs)} batches\n"
            f"  {len(user_objs)} users\n"
            f"  {review_count} reviews"
        )


if __name__ == "__main__":
    asyncio.run(seed())
