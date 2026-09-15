import io
import json
import traceback
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from pypdf import PdfReader
from database import get_db, ComplaintRecord
from agent import run_complaint_copilot

app = FastAPI(title="AIVOA Pharma QMS Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CopilotRequest(BaseModel):
    current_form: dict
    prompt: str

class ComplaintSaveRequest(BaseModel):
    form_data: dict

@app.get("/")
def read_root():
    return {"status": "online", "module": "AIVOA Pharma QMS Engine"}

@app.post("/api/complaints/copilot")
async def copilot_endpoint(req: CopilotRequest):
    if not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")
    try:
        return run_complaint_copilot(req.current_form, req.prompt)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/complaints/upload-file")
async def upload_file_endpoint(
    file: UploadFile = File(...),
    current_form_str: str = Form("{}")
):
    try:
        file_bytes = await file.read()
        extracted_text = ""

        if file.filename.lower().endswith(".pdf"):
            pdf_stream = io.BytesIO(file_bytes)
            reader = PdfReader(pdf_stream)
            for page in reader.pages:
                t = page.extract_text()
                if t:
                    extracted_text += t + "\n"
        else:
            extracted_text = file_bytes.decode("utf-8", errors="ignore")

        if not extracted_text.strip():
            extracted_text = f"Uploaded complaint document: {file.filename}."

        result = run_complaint_copilot({}, extracted_text, force_new_intake=True)
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"File processing error: {str(e)}")

@app.post("/api/complaints/save")
async def save_endpoint(req: ComplaintSaveRequest, db: Session = Depends(get_db)):
    try:
        d = req.form_data or {}
        record = ComplaintRecord(
            complaint_source=d.get("complaint_source", ""),
            customer_name=d.get("customer_name", ""),
            product_name=d.get("product_name", ""),
            product_strength=d.get("product_strength", ""),
            batch_number=d.get("batch_number", ""),
            affected_quantity=d.get("affected_quantity", ""),
            manufacture_date=d.get("manufacture_date", ""),
            expiry_date=d.get("expiry_date", ""),
            originating_site_block=d.get("originating_site_block", ""),
            impacted_npm=d.get("impacted_npm", ""),
            complaint_category=d.get("complaint_category", ""),
            complaint_description=d.get("complaint_description", ""),
            severity_suggested=d.get("severity_suggested", "Major"),
            suggested_next_action=d.get("suggested_next_action", ""),
            initial_risk_assessment=d.get("initial_risk_assessment", "")
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return {
            "status": "success", 
            "record_id": record.id, 
            "message": f"Complaint record #{record.id} successfully saved to cGMP audit trail!"
        }
    except Exception as e:
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database commit error: {str(e)}")
