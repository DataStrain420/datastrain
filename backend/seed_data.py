"""Seed script: populates the database with dummy data for development.

Run from the backend directory:
    python seed_data.py

Creates:
- 2 test users (patient + admin-style)
- 5 growers
- 6 terpenes
- 8 strains (all approved)
- 12 batches (all approved) with terpene profiles
- 1 pharmacy
- 10 reviews (all approved) with condition ratings
- Library entries and follows

Dummy login credentials:
    Patient: email=patient@test.com  password=password123
    Patient2: email=reviewer@test.com  password=password123
"""

import asyncio
import sys
from datetime import date, datetime, timezone

# Add parent to path
sys.path.insert(0, ".")

from app.config import settings
from app.database import Base, engine, async_session
from app.auth import hash_password
from app.models import (
    User, Grower, Strain, Terpene, Batch, BatchTerpene,
    Pharmacy, Review, ConditionRating, UserFollow,
    UserLibraryEntry, KudosEvent, ReviewStatus, KudosEventType,
)


async def seed():
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        # ── Users ──
        # Demo avatars are pulled from DiceBear's free `avataaars` style —
        # deterministic per-username, no setup. Swap for real uploads later.
        def _avatar(seed: str) -> str:
            return f"https://api.dicebear.com/9.x/avataaars/svg?seed={seed}"

        user1 = User(
            username="patient1",
            email="patient@test.com",
            password_hash=hash_password("password123"),
            bio="UK medical cannabis patient. Chronic pain and insomnia.",
            avatar_url=_avatar("patient1"),
            community_status="grower",
            kudos_points=350,
            review_count=6,
            is_verified=True,
        )
        user2 = User(
            username="greenreviewer",
            email="reviewer@test.com",
            password_hash=hash_password("password123"),
            bio="Reviewing every strain I try. Anxiety and PTSD.",
            avatar_url=_avatar("greenreviewer"),
            community_status="sprout",
            kudos_points=120,
            review_count=4,
            is_verified=True,
        )
        # Extra demo accounts spanning the full rank ladder so the homepage
        # showcases the new avatar + rank-badge styling end-to-end.
        user3 = User(
            username="theLegend",
            email="legend@test.com",
            password_hash=hash_password("password123"),
            bio="Been reviewing UK medical flower since the prescription scheme started.",
            avatar_url=_avatar("theLegend"),
            community_status="legend",
            kudos_points=4250,
            review_count=120,
            is_verified=True,
        )
        user4 = User(
            username="bigSesh",
            email="cultivator@test.com",
            password_hash=hash_password("password123"),
            bio="Indica enjoyer. Looking for the deepest body stones.",
            avatar_url=_avatar("bigSesh"),
            community_status="cultivator",
            kudos_points=820,
            review_count=22,
            is_verified=True,
        )
        user5 = User(
            username="firstTimer",
            email="seedling@test.com",
            password_hash=hash_password("password123"),
            bio="New patient working out what works for me.",
            avatar_url=_avatar("firstTimer"),
            community_status="seedling",
            kudos_points=30,
            review_count=1,
            is_verified=True,
        )
        db.add_all([user1, user2, user3, user4, user5])
        await db.flush()

        # ── Follow ──
        follow = UserFollow(follower_id=user2.id, following_id=user1.id)
        db.add(follow)
        user1.follower_count = 1
        user2.following_count = 1

        # ── Growers ──
        growers_data = [
            ("Noidecs", "UK", True),
            ("Grow Pharma", "UK", True),
            ("Tilray", "Canada", True),
            ("Aurora", "Canada", True),
            ("Bedrocan", "Netherlands", True),
        ]
        growers = []
        for name, country, verified in growers_data:
            g = Grower(name=name, country_of_origin=country, verified=verified)
            db.add(g)
            growers.append(g)
        await db.flush()

        # ── Terpenes ──
        terpenes_data = [
            ("Myrcene", "Earthy, musky, herbal", "Sedating, relaxing"),
            ("Limonene", "Citrus, lemon", "Uplifting, stress relief"),
            ("Caryophyllene", "Peppery, spicy", "Anti-inflammatory"),
            ("Linalool", "Floral, lavender", "Calming, anti-anxiety"),
            ("Pinene", "Pine, sharp", "Alertness, memory"),
            ("Terpinolene", "Herbal, floral, piney", "Mildly sedating"),
        ]
        terpenes = []
        for name, aroma, desc in terpenes_data:
            t = Terpene(name=name, aroma_notes=aroma, description=desc)
            db.add(t)
            terpenes.append(t)
        await db.flush()

        # ── Strains ──
        strains_data = [
            ("Khiron Hindu Kush", "indica", growers[0].id, "Classic indica. Deep body relaxation."),
            ("Noidecs T20:C4 Sativa", "sativa", growers[0].id, "Energising daytime strain."),
            ("Tilray Master Kush", "indica", growers[2].id, "Potent indica for pain relief."),
            ("Aurora Pedanios 22/1", "sativa", growers[3].id, "High-THC sativa for daytime use."),
            ("Bedrocan Jack Herer", "sativa", growers[4].id, "Award-winning sativa. Creative and focused."),
            ("Grow Pharma Gelato", "hybrid", growers[1].id, "Sweet, dessert-like hybrid. Balanced effects."),
            ("Noidecs T14:C2 Mazar", "indica", growers[0].id, "Relaxing indica for evening use."),
            ("Tilray Purple Kush", "indica", growers[2].id, "Sedating purple-hued indica."),
        ]
        strains = []
        for name, stype, gid, desc in strains_data:
            s = Strain(
                name=name, strain_type=stype, grower_id=gid,
                description=desc, approved=True,
                approved_at=datetime.now(timezone.utc),
            )
            db.add(s)
            strains.append(s)
        await db.flush()

        # ── Pharmacy ──
        pharmacy = Pharmacy(name="IPS Pharmacy", location="London, UK", is_active=True)
        db.add(pharmacy)
        await db.flush()

        # ── Batches ──
        batches_data = [
            (strains[0], growers[0], "KHK-2026-001", 20.0, 1.0, date(2026, 1, 15), [0, 2, 3]),
            (strains[0], growers[0], "KHK-2026-002", 21.5, 0.8, date(2026, 2, 10), [0, 3, 5]),
            (strains[1], growers[0], "NST-2026-001", 20.0, 4.0, date(2026, 1, 20), [1, 4]),
            (strains[2], growers[2], "TMK-2026-001", 22.0, 0.5, date(2026, 2, 5), [0, 2]),
            (strains[3], growers[3], "AP22-2026-001", 22.4, 1.0, date(2026, 1, 28), [1, 4, 5]),
            (strains[4], growers[4], "BJH-2026-001", 18.0, 0.2, date(2026, 2, 15), [1, 4]),
            (strains[5], growers[1], "GPG-2026-001", 19.5, 2.5, date(2026, 2, 20), [0, 1, 2]),
            (strains[5], growers[1], "GPG-2026-002", 20.0, 2.0, date(2026, 3, 1), [0, 1, 3]),
            (strains[6], growers[0], "NMZ-2026-001", 14.0, 2.0, date(2026, 1, 10), [0, 3]),
            (strains[7], growers[2], "TPK-2026-001", 19.0, 0.3, date(2026, 2, 25), [0, 2, 3]),
            (strains[1], growers[0], "NST-2026-002", 19.5, 4.2, date(2026, 3, 5), [1, 4, 5]),
            (strains[3], growers[3], "AP22-2026-002", 23.0, 0.8, date(2026, 3, 8), [1, 4]),
        ]
        batches = []
        for strain, grower, bnum, thc, cbd, tested, terp_indices in batches_data:
            b = Batch(
                strain_id=strain.id, grower_id=grower.id,
                batch_number=bnum, thc_percentage=thc, cbd_percentage=cbd,
                tested_date=tested, approved=True,
                dispensing_pharmacy_id=pharmacy.id,
            )
            db.add(b)
            await db.flush()

            # Add terpene profiles
            for idx in terp_indices:
                pct = round(0.2 + (idx * 0.15) + (b.id * 0.03), 2)
                bt = BatchTerpene(
                    batch_id=b.id, terpene_id=terpenes[idx].id, percentage=pct
                )
                db.add(bt)

            batches.append(b)

        await db.flush()

        # ── Reviews ──
        # Reviews: (user, batch, appearance, aroma, moisture, flavour, effect, narrative)
        reviews_data = [
            (user3, batches[0], 5, 5, 5, 5, 5, "After 5+ years of UK medical cannabis, this is right up there. Dense, frosty, knocks out chronic pain inside 20 minutes."),
            (user1, batches[0], 5, 4, 5, 4, 5, "Excellent for chronic pain. Smooth smoke, earthy aroma. Knocked out my insomnia."),
            (user4, batches[2], 4, 4, 4, 4, 5, "Daytime hero — clear-headed buzz, manageable productivity, no anxiety creep."),
            (user1, batches[2], 4, 3, 3, 4, 4, "Good daytime option. Clear-headed but effective for anxiety."),
            (user1, batches[3], 4, 4, 4, 5, 4, "Very potent. Great pain relief but start low."),
            (user3, batches[3], 5, 5, 4, 5, 5, "Reference indica. Old-school terps, slow heavy come-up."),
            (user1, batches[5], 4, 5, 4, 4, 4, "Creative and focused. Perfect for daytime."),
            (user1, batches[6], 5, 5, 4, 4, 4, "Delicious flavour. Balanced effects, great all-rounder."),
            (user2, batches[0], 4, 4, 4, 5, 4, "Reliable for sleep. Consistent batch quality."),
            (user4, batches[1], 5, 5, 5, 4, 5, "Second batch is on a different level — texture, smell, density all up."),
            (user5, batches[1], 3, 3, 3, 3, 3, "First strain I've tried, so I've not got much to compare to. Slept well."),
            (user1, batches[8], 4, 3, 4, 3, 4, "Mild but consistent. Good for beginners."),
            (user2, batches[1], 5, 4, 5, 5, 4, "Even better than the first batch. Higher THC, smoother."),
            (user2, batches[4], 4, 3, 4, 5, 4, "Great sativa for PTSD. Keeps me functional."),
            (user2, batches[9], 4, 4, 5, 4, 4, "Beautiful purple buds. Sedating but not overwhelming."),
        ]
        conditions_map = {
            0: [("Chronic Pain", 5), ("Insomnia", 4)],
            1: [("Anxiety", 4)],
            2: [("Chronic Pain", 4), ("Muscle Spasms", 3)],
            3: [("Depression", 4), ("Fatigue", 4)],
            4: [("Anxiety", 4), ("Appetite", 3)],
            5: [("Insomnia", 3)],
            6: [("Insomnia", 5), ("Anxiety", 4)],
            7: [("Insomnia", 5), ("Chronic Pain", 4)],
            8: [("PTSD", 5), ("Anxiety", 4)],
            9: [("Insomnia", 4), ("Stress", 4)],
        }

        for i, (user, batch, appear, aroma, moisture, flav, effect, narrative) in enumerate(reviews_data):
            review = Review(
                user_id=user.id,
                batch_id=batch.id,
                appearance_rating=appear,
                aroma_rating=aroma,
                moisture_rating=moisture,
                flavour_rating=flav,
                effect_rating=effect,
                written_narrative=narrative,
                confirmed_own_experience=True,
                confirmed_medical_only=True,
                status=ReviewStatus.APPROVED.value,
            )
            db.add(review)
            await db.flush()

            for cond_name, rating in conditions_map.get(i, []):
                cr = ConditionRating(
                    review_id=review.id,
                    condition_name=cond_name,
                    efficacy_rating=rating,
                )
                db.add(cr)

        # ── Library entries ──
        lib_entries = [
            (user1, batches[0], "tried", date(2026, 1, 20)),
            (user1, batches[6], "favourite", None),
            (user1, batches[4], "wishlist", None),
            (user2, batches[0], "tried", date(2026, 2, 1)),
            (user2, batches[1], "favourite", None),
        ]
        for user, batch, list_type, tried_date in lib_entries:
            entry = UserLibraryEntry(
                user_id=user.id,
                batch_id=batch.id,
                strain_id=batch.strain_id,
                list_type=list_type,
                date_tried=tried_date,
            )
            db.add(entry)

        # ── Kudos events ──
        kudos_review_counts = {
            user1.id: 6,
            user2.id: 4,
            user3.id: 120,
            user4.id: 22,
            user5.id: 1,
        }
        for uid, count in kudos_review_counts.items():
            for _ in range(count):
                db.add(KudosEvent(
                    user_id=uid,
                    event_type=KudosEventType.REVIEW_SUBMITTED.value,
                    points_awarded=10,
                    reference_type="review",
                ))

        await db.commit()
        print("Database seeded successfully!")
        print()
        print("Dummy login credentials:")
        print("  Patient 1 (Grower):           patient@test.com / password123")
        print("  Patient 2 (Sprout):           reviewer@test.com / password123")
        print("  Patient 3 (Legend):           legend@test.com / password123")
        print("  Patient 4 (Cultivator):       cultivator@test.com / password123")
        print("  Patient 5 (Seedling):         seedling@test.com / password123")
        print("  Admin:     Use 'Bearer dev-admin' header (no Firebase needed)")
        print()
        print(f"Created: 5 users, {len(growers)} growers, {len(terpenes)} terpenes,")
        print(f"         {len(strains)} strains, {len(batches)} batches, {len(reviews_data)} reviews,")
        print(f"         1 pharmacy, {len(lib_entries)} library entries")


if __name__ == "__main__":
    asyncio.run(seed())
