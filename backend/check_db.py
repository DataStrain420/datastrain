"""Quick check: what's in the database?"""
import asyncio
import sys
sys.path.insert(0, ".")

from sqlalchemy import select, func
from app.database import async_session, engine, Base
from app.models import Batch, Strain, User, Review

async def check():
    async with async_session() as db:
        for model, name in [(User, "Users"), (Strain, "Strains"), (Batch, "Batches"), (Review, "Reviews")]:
            result = await db.execute(select(func.count()).select_from(model))
            count = result.scalar()
            print(f"{name}: {count}")

        # Check approved batches specifically
        result = await db.execute(select(func.count()).select_from(Batch).where(Batch.approved == True))
        print(f"Approved batches: {result.scalar()}")

        # Show first batch if any
        result = await db.execute(select(Batch).limit(1))
        batch = result.scalar_one_or_none()
        if batch:
            print(f"First batch: id={batch.id}, strain_id={batch.strain_id}, approved={batch.approved}")
        else:
            print("No batches found!")

if __name__ == "__main__":
    asyncio.run(check())
