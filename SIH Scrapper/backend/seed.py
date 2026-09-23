"""Seed demo data: Maharashtra recyclers + baseline prices. Run: python seed.py"""
from app import Base, Collector, Price, Recycler, Session, engine

Base.metadata.create_all(engine)
db = Session()
if db.query(Recycler).count():
    print("already seeded")
    raise SystemExit

db.add(Collector(id=1, language="hi", area="Pune"))
db.add_all([
    Recycler(name="Ecoreset E-Waste Recyclers", city="Pune", materials="PCB,Metals",
             auth_id="CPCB/AUTH/2024/0117", contact="+91-9822000001",
             rate_inr_per_kg=320, lat=18.52, lon=73.85),
    Recycler(name="Green IT Recycling Centre", city="Mumbai", materials="LCD,PCB,Cables",
             auth_id="MPCB/EW/2023/0442", contact="+91-9822000002",
             rate_inr_per_kg=180, lat=19.07, lon=72.87),
    Recycler(name="Sahyadri E-Cycle", city="Pune", materials="Batteries,Metals,Mixed Plastics",
             auth_id="MPCB/EW/2024/0091", contact="+91-9822000003",
             rate_inr_per_kg=95, lat=18.58, lon=73.81),
])
db.add_all([
    Price(material="PCB", city="Pune", date="2026-09-10", buy_price=320),
    Price(material="PCB", city="Mumbai", date="2026-09-10", buy_price=305),
    Price(material="Cables", city="Pune", date="2026-09-10", buy_price=140),
    Price(material="Batteries", city="Pune", date="2026-09-10", buy_price=95),
    Price(material="LCD", city="Mumbai", date="2026-09-09", buy_price=60),
    Price(material="Metals", city="Pune", date="2026-09-10", buy_price=210),
    Price(material="Motors/Magnets", city="Pune", date="2026-09-08", buy_price=175),
    Price(material="Mixed Plastics", city="Pune", date="2026-09-10", buy_price=22),
    Price(material="CRT", city="Pune", date="2026-09-05", buy_price=15),
])
db.commit()
print("seeded: 1 collector, 3 recyclers, 9 prices")
