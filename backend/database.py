import os
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./complaints.db")
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class ComplaintRecord(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    complaint_source = Column(String(255), default="")
    customer_name = Column(String(255), default="")
    product_name = Column(String(255), default="")
    product_strength = Column(String(100), default="")
    batch_number = Column(String(100), default="")
    affected_quantity = Column(String(100), default="")
    manufacture_date = Column(String(50), default="")
    expiry_date = Column(String(50), default="")
    originating_site_block = Column(String(255), default="")
    impacted_npm = Column(String(255), default="")
    complaint_category = Column(String(255), default="")
    complaint_description = Column(Text, default="")
    severity_suggested = Column(String(50), default="Major")
    suggested_next_action = Column(String(255), default="")
    initial_risk_assessment = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
