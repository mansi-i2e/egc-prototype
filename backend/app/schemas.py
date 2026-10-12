from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict


class VendorIn(BaseModel):
    name: str
    country: str | None = None
    status: str = "Active"


class VendorOut(VendorIn):
    model_config = ConfigDict(from_attributes=True)
    id: int


class ActivityIn(BaseModel):
    title: str
    owner: str | None = None
    status: str = "Planned"
    rag: Literal["Red", "Amber", "Green"] = "Green"
    start_date: date | None = None
    end_date: date | None = None
    vendor_id: int | None = None


class ActivityOut(ActivityIn):
    model_config = ConfigDict(from_attributes=True)
    id: int


class BudgetIn(BaseModel):
    activity_id: int
    year: int
    planned: float = 0
    forecast: float = 0
    actual: float = 0


class BudgetOut(BudgetIn):
    model_config = ConfigDict(from_attributes=True)
    id: int