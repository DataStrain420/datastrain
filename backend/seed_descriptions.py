"""One-shot script: populate strain descriptions in the local SQLite database."""

import sqlite3

DESCRIPTIONS = {
    "Pink Kush": "A potent indica known for its powerful body-high and sweet, floral vanilla aroma. Popular among patients seeking deep relaxation and relief from chronic pain and insomnia.",
    "Super Lemon Haze": "An award-winning sativa-dominant hybrid with a zesty lemon citrus flavour and uplifting cerebral effects. Ideal for daytime use, promoting focus, energy, and creativity.",
    "Hindu Kush": "A pure indica landrace strain originating from the mountain range between Pakistan and Afghanistan. Delivers a deeply sedating body stone with earthy, sweet sandalwood notes.",
    "Master Kush": "A classic indica bred from two Hindu Kush strains. Offers a subtle earthy, citrus aroma with a full-body relaxation effect that eases tension without heavy sedation.",
    "Gorilla Glue": "A heavy-hitting hybrid famous for its chunky, resin-covered buds. Delivers a potent euphoric rush followed by deep physical relaxation. Earthy, pine, and sour notes.",
    "Mahdjong": "A balanced hybrid offering a smooth, mellow experience with gentle uplifting effects. Known for its unique terpene profile blending sweet and spicy undertones.",
    "Adven EMT-1 Flos": "A pharmaceutical-grade medical cannabis flower by Adven. Carefully cultivated for consistent cannabinoid and terpene profiles, suited for patients requiring reliable symptom management.",
    "Lemon Skunk": "A zesty sativa-leaning hybrid with an unmistakable skunky lemon aroma. Provides an energetic, happy buzz that's great for social situations and creative tasks.",
    "Blue Dream": "A legendary sativa-dominant hybrid blending Blueberry and Haze genetics. Delivers a gentle cerebral invigoration alongside full-body relaxation with sweet berry flavours.",
    "OG Kush": "One of the most iconic strains worldwide, known for its complex fuel-forward, earthy, and piney aroma. Provides a heavy, mixed head-and-body effect.",
    "Girl Scout Cookies": "A potent hybrid with a sweet, dessert-like flavour profile. Known for delivering a powerful euphoric high coupled with strong physical relaxation.",
    "Northern Lights": "A legendary pure indica celebrated for its resinous buds, fast flowering, and resilient growth. Delivers a dreamy, full-body stone with sweet, spicy aromas.",
    "Sour Diesel": "A fast-acting sativa with a pungent diesel aroma. Delivers energising, dreamy cerebral effects that fuel creativity and conversation. A staple for daytime use.",
    "Jack Herer": "Named after the cannabis activist, this sativa-dominant strain offers a blissful, clear-headed, and creative buzz with a spicy, pine-scented terpene profile.",
    "White Widow": "A balanced hybrid first bred in the Netherlands. Famous for its white crystal resin coating and a burst of euphoria and energy with earthy, woody notes.",
    "Amnesia Haze": "A potent sativa-dominant strain with a fresh, citrusy aroma and a long-lasting, energetic cerebral high. Popular for combating fatigue and low mood.",
    "Granddaddy Purple": "A famous indica cross of Purple Urkle and Big Bud. Delivers a potent fusion of cerebral euphoria and physical relaxation with grape and berry flavours.",
    "Gelato": "A flavourful hybrid known for its dessert-like aroma of sweet citrus and fruity cookies. Provides a balanced, relaxing yet uplifting experience.",
    "Wedding Cake": "A potent indica-leaning hybrid with rich, tangy flavours and a relaxing, euphoric effect. Known for its dense, frosty buds and high THC content.",
    "Zkittlez": "An indica-dominant strain bursting with tropical, fruity flavours reminiscent of the candy. Provides a calm, focused high perfect for unwinding after a long day.",
}

db_path = "datastrain.db"
conn = sqlite3.connect(db_path)
cur = conn.cursor()

updated = 0
for name, desc in DESCRIPTIONS.items():
    cur.execute("UPDATE strains SET description = ? WHERE name = ? AND (description IS NULL OR description = '')", (desc, name))
    updated += cur.rowcount

conn.commit()
print(f"Updated {updated} strain descriptions.")

# Show results
cur.execute("SELECT id, name, description FROM strains ORDER BY id")
for row in cur.fetchall():
    print(f"  [{row[0]}] {row[1]}: {row[2][:60] if row[2] else '(none)'}...")

conn.close()
