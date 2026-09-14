"""Kabadiwala Connect API — tables mirror the SIH26229 dataset spec.
Runs on Postgres (DATABASE_URL) or local SQLite (default, zero-setup dev).
"""
import os
from datetime import datetime

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel
from sqlalchemy import (Column, DateTime, Float, ForeignKey, Integer, String,
                        Text, create_engine)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./kabadi.db")
engine = create_engine(DATABASE_URL,
                       connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
Session = sessionmaker(bind=engine)
Base = declarative_base()

MATERIALS = ["PCB", "CRT", "LCD", "Cables", "Batteries", "Motors/Magnets",
             "Mixed Plastics", "Metals"]


class Collector(Base):
    __tablename__ = "collectors"
    id = Column(Integer, primary_key=True)
    language = Column(String(8), default="hi")  # hi | mr | en
    area = Column(String(120), default="")


class Recycler(Base):
    __tablename__ = "recyclers"
    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    city = Column(String(100), default="")
    materials = Column(Text, default="")  # comma-separated categories
    auth_id = Column(String(100), default="")  # CPCB/EPR registration
    contact = Column(String(100), default="")
    rate_inr_per_kg = Column(Float, default=0)  # headline offered rate
    pickup = Column(String(20), default="yes")  # yes | no
    lat = Column(Float, default=0)
    lon = Column(Float, default=0)


class Price(Base):
    __tablename__ = "prices"
    id = Column(Integer, primary_key=True)
    material = Column(String(60), nullable=False)
    city = Column(String(100), default="")
    date = Column(String(10), default="")  # YYYY-MM-DD
    buy_price = Column(Float, default=0)  # INR/kg
    unit = Column(String(10), default="kg")


class Lot(Base):
    __tablename__ = "lots"
    id = Column(Integer, primary_key=True)
    collector_id = Column(Integer, ForeignKey("collectors.id"))
    material = Column(String(60), nullable=False)
    weight_kg = Column(Float, default=0)
    estimate_inr = Column(Float, default=0)
    photo_ref = Column(String(260), default="")
    lat = Column(Float, default=0)
    lon = Column(Float, default=0)
    status = Column(String(20), default="open")  # open|matched|handed|paid
    created = Column(DateTime, default=datetime.utcnow)
    collector = relationship("Collector")


class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True)
    lot_id = Column(Integer, ForeignKey("lots.id"))
    recycler_id = Column(Integer, ForeignKey("recyclers.id"))
    quoted_price = Column(Float, default=0)
    final_price = Column(Float, default=0)
    payment_status = Column(String(20), default="pending")  # pending|paid (cash ok)
    handover_ref = Column(String(40), default="")  # unique verifiable ref
    recycler_confirmed = Column(String(10), default="no")
    created = Column(DateTime, default=datetime.utcnow)


Base.metadata.create_all(engine)

app = FastAPI(title="Kabadiwala Connect API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"],
                   allow_headers=["*"])


class LotIn(BaseModel):
    collector_id: int = 1
    material: str
    weight_kg: float
    photo_ref: str = ""
    lat: float = 0
    lon: float = 0


def latest_price(db, material, city=""):
    q = db.query(Price).filter(Price.material == material)
    if city:
        q = q.filter((Price.city == city) | (Price.city == ""))
    row = q.order_by(Price.date.desc()).first()
    return row.buy_price if row else 0


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/classify")
def classify_photo(photo: UploadFile = File(...)):
    from classify import classify
    try:
        img = Image.open(photo.file)
    except Exception:
        raise HTTPException(400, "unreadable image")
    preds = classify(img)
    # ponytail: low-confidence fallback is human confirm, not a bigger model
    return {"predictions": preds, "needs_confirm": preds[0]["conf"] < 0.5}


@app.get("/materials")
def materials():
    return MATERIALS


@app.get("/prices")
def prices(material: str = "", city: str = ""):
    db = Session()
    q = db.query(Price)
    if material:
        q = q.filter(Price.material == material)
    if city:
        q = q.filter(Price.city == city)
    return [{"material": p.material, "city": p.city, "date": p.date,
             "buy_price": p.buy_price, "unit": p.unit}
            for p in q.order_by(Price.date.desc()).limit(100)]


@app.get("/recyclers")
def recyclers(material: str = "", city: str = ""):
    db = Session()
    q = db.query(Recycler)
    if city:
        q = q.filter(Recycler.city == city)
    out = []
    for r in q.all():
        if material and material not in (r.materials or ""):
            continue
        out.append({"id": r.id, "name": r.name, "city": r.city,
                    "materials": r.materials, "auth_id": r.auth_id,
                    "contact": r.contact, "rate_inr_per_kg": r.rate_inr_per_kg,
                    "pickup": r.pickup, "lat": r.lat, "lon": r.lon})
    return out


@app.post("/lots")
def create_lot(lot: LotIn):
    if lot.material not in MATERIALS:
        raise HTTPException(400, f"material must be one of {MATERIALS}")
    db = Session()
    rate = latest_price(db, lot.material)
    row = Lot(collector_id=lot.collector_id, material=lot.material,
              weight_kg=lot.weight_kg, estimate_inr=round(rate * lot.weight_kg, 2),
              photo_ref=lot.photo_ref, lat=lot.lat, lon=lot.lon)
    db.add(row)
    db.commit()
    return {"id": row.id, "estimate_inr": row.estimate_inr,
            "rate_used": rate, "status": row.status}


@app.post("/lots/{lot_id}/handover/{recycler_id}")
def handover(lot_id: int, recycler_id: int, final_price: float = 0):
    db = Session()
    lot = db.get(Lot, lot_id)
    if not lot or lot.status != "open":
        raise HTTPException(400, "lot not open")
    lot.status = "handed"
    ref = f"KC{lot_id:06d}R{recycler_id:03d}"
    txn = Transaction(lot_id=lot_id, recycler_id=recycler_id,
                      quoted_price=lot.estimate_inr,
                      final_price=final_price or lot.estimate_inr,
                      handover_ref=ref)
    db.add(txn)
    db.commit()
    return {"handover_ref": ref, "final_price": txn.final_price}


@app.post("/transactions/{txn_id}/confirm")
def confirm(txn_id: int):
    db = Session()
    txn = db.get(Transaction, txn_id)
    if not txn:
        raise HTTPException(404, "no such transaction")
    txn.recycler_confirmed = "yes"
    txn.payment_status = "paid"
    lot = db.get(Lot, txn.lot_id)
    lot.status = "paid"
    db.commit()
    return {"handover_ref": txn.handover_ref, "payment_status": "paid"}


@app.get("/ledger/{collector_id}")
def ledger(collector_id: int):
    db = Session()
    lots = db.query(Lot).filter(Lot.collector_id == collector_id).all()
    txns = {t.lot_id: t for t in
            db.query(Transaction).filter(Transaction.lot_id.in_([l.id for l in lots])).all()}
    return [{"lot_id": l.id, "material": l.material, "weight_kg": l.weight_kg,
             "estimate_inr": l.estimate_inr, "status": l.status,
             "handover_ref": (txns[l.id].handover_ref if l.id in txns else ""),
             "paid": (txns[l.id].payment_status if l.id in txns else "pending")}
            for l in lots]
