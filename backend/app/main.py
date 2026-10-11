# TODO: fill from guide
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from . import models, schemas
from .db import Base, engine, get_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(engine)  # tables bana do (prototype ke liye)
    yield


app = FastAPI(title="EGC Prototype", lifespan=lifespan)


@app.get("/api/health")
def health():
    return {"status": "ok"}


# ---------- Vendors ----------
@app.get("/api/vendors", response_model=list[schemas.VendorOut])
def list_vendors(db: Session = Depends(get_db)):
    return db.query(models.Vendor).order_by(models.Vendor.id).all()


@app.post("/api/vendors", response_model=schemas.VendorOut)
def create_vendor(data: schemas.VendorIn, db: Session = Depends(get_db)):
    obj = models.Vendor(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@app.delete("/api/vendors/{vendor_id}")
def delete_vendor(vendor_id: int, db: Session = Depends(get_db)):
    obj = db.get(models.Vendor, vendor_id)
    if not obj:
        raise HTTPException(404, "Vendor nahi mila")
    # is vendor se jude activities ka link hata do
    db.query(models.Activity).filter(models.Activity.vendor_id == vendor_id).update({"vendor_id": None})
    db.delete(obj)
    db.commit()
    return {"deleted": vendor_id}


# ---------- Activities ----------
@app.get("/api/activities", response_model=list[schemas.ActivityOut])
def list_activities(db: Session = Depends(get_db)):
    return db.query(models.Activity).order_by(models.Activity.id).all()


@app.post("/api/activities", response_model=schemas.ActivityOut)
def create_activity(data: schemas.ActivityIn, db: Session = Depends(get_db)):
    obj = models.Activity(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@app.put("/api/activities/{activity_id}", response_model=schemas.ActivityOut)
def update_activity(activity_id: int, data: schemas.ActivityIn, db: Session = Depends(get_db)):
    obj = db.get(models.Activity, activity_id)
    if not obj:
        raise HTTPException(404, "Activity nahi mili")
    for k, v in data.model_dump().items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


@app.delete("/api/activities/{activity_id}")
def delete_activity(activity_id: int, db: Session = Depends(get_db)):
    obj = db.get(models.Activity, activity_id)
    if not obj:
        raise HTTPException(404, "Activity nahi mili")
    db.query(models.Budget).filter(models.Budget.activity_id == activity_id).delete()
    db.delete(obj)
    db.commit()
    return {"deleted": activity_id}


# ---------- Budgets ----------
@app.get("/api/budgets", response_model=list[schemas.BudgetOut])
def list_budgets(db: Session = Depends(get_db)):
    return db.query(models.Budget).order_by(models.Budget.id).all()


@app.post("/api/budgets", response_model=schemas.BudgetOut)
def create_budget(data: schemas.BudgetIn, db: Session = Depends(get_db)):
    if not db.get(models.Activity, data.activity_id):
        raise HTTPException(400, "Ye activity exist nahi karti")
    obj = models.Budget(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


# ---------- Dashboard ----------
@app.get("/api/dashboard")
def dashboard(db: Session = Depends(get_db)):
    total = db.query(func.count(models.Activity.id)).scalar()
    rag_rows = db.query(models.Activity.rag, func.count()).group_by(models.Activity.rag).all()
    planned, forecast, actual = db.query(
        func.coalesce(func.sum(models.Budget.planned), 0),
        func.coalesce(func.sum(models.Budget.forecast), 0),
        func.coalesce(func.sum(models.Budget.actual), 0),
    ).one()
    return {
        "total_activities": total,
        "rag": {name: count for name, count in rag_rows},
        "budget": {"planned": planned, "forecast": forecast, "actual": actual},
    }