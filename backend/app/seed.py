"""Sample farmer + farm so the app can be demonstrated immediately. All sample numbers are flagged as 'sample'."""
from datetime import date, timedelta
from .models import Farmer, Farm, WaterUsage, IrrigationLog
from .security import hash_pw


def seed(db):
    if db.query(Farmer).count():
        return
    f = Farmer(name="Ramesh Patil (Sample)", phone="9999999999", password_hash=hash_pw("demo123"), language="mr")
    db.add(f); db.flush()
    today = date.today()
    farm = Farm(farmer_id=f.id, name="Ashta Onion Plot", area_acres=1.5, location="Ashta, Sangli, Maharashtra", latitude=16.95, longitude=74.40,
                soil="black", crop="onion", sowing_date=today - timedelta(days=45), irrigation_method="sprinkler",
                soil_moisture=55, moisture_source="sample", water_capacity_l=800000, water_available_l=520000)
    db.add(farm); db.flush()
    for i in range(21, 0, -1):  # 3 weeks of sample history: irrigation every 4th day + small daily use
        d = today - timedelta(days=i)
        if i % 4 == 0:
            liters = 105000 + (21 - i) * 1500
            db.add(IrrigationLog(farm_id=farm.id, day=d, liters=liters, mm=round(liters * 0.75 / (1.5 * 4046.86), 1), note="Sample data", source="sample"))
            db.add(WaterUsage(farm_id=farm.id, day=d, liters=liters, note="Irrigation (sample data)"))
        db.add(WaterUsage(farm_id=farm.id, day=d, liters=350 + (i * 37) % 120, note="Other use (sample data)"))
    db.commit()
