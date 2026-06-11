"""One-shot script: set placeholder logos for growers using DiceBear shape avatars."""

import sqlite3
import urllib.parse

db_path = "datastrain.db"
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Fetch all growers
cur.execute("SELECT id, name FROM growers")
growers = cur.fetchall()

updated = 0
for gid, name in growers:
    encoded = urllib.parse.quote(name)
    # Use 'shapes' style — colorful geometric patterns, distinct per grower
    logo_url = f"https://api.dicebear.com/9.x/shapes/svg?seed={encoded}&backgroundColor=0ad6da,51ed92,9251ed,249689&shape1Color=0ad6da,51ed92&shape2Color=9251ed,249689&shape3Color=00eeb2,0ad6da"
    cur.execute("UPDATE growers SET logo_url = ? WHERE id = ?", (logo_url, gid))
    updated += 1
    print(f"  [{gid}] {name} -> logo set")

conn.commit()
print(f"\nUpdated {updated} grower logos.")
conn.close()
