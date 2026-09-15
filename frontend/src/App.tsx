import React, { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './store';
import { 
  updateFormField, 
  resetForm, 
  runCopilotQuery, 
  uploadComplaintFile,
  saveComplaintRecord,
  ComplaintFormData 
} from './store/complaintSlice';

const FlaskIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" />
    <path d="M8.5 2h7" />
    <path d="M7 16h10" />
  </svg>
);

const ZapIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const PaperclipIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4338ca" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const FileBadgeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const RotateIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

const SaveIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const SAMPLE_CASE = "Apollo Pharmacy reported 12 discolored capsules in a sealed bottle of Amoxicillin Capsules 500 mg, Batch AMX240602 (Mfg: March 2026, Exp: February 2028). Requesting investigation and replacement.";

export default function App() {
  const dispatch = useAppDispatch();
  const { formData, messages, isProcessing, hasExtracted, saveStatus, saveError } = useAppSelector(
    (state) => state.complaint
  );

  const [inputPrompt, setInputPrompt] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFieldChange = (field: keyof ComplaintFormData, value: string) => {
    dispatch(updateFormField({ field, value }));
  };

  const handleSend = (text: string) => {
    if (text.trim() && !isProcessing) {
      dispatch(runCopilotQuery(text));
      setInputPrompt("");
    }
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && !isProcessing) {
      dispatch(uploadComplaintFile(file));
      // Reset input value so the same file can be chosen again if needed
      e.target.value = "";
    }
  };

  return (
    <div className="layout-split">
      {/* LEFT COLUMN: Collapsed or Expanded Form */}
      <div className="card-panel">
        <div className="header-flex">
          <div>
            <h1 className="title-primary">Log Customer Complaint</h1>
            <p className="title-secondary">API & FDF Quality Assurance Module</p>
          </div>
          <span className="badge-pending">Pending Triage</span>
        </div>

        {saveStatus && (
          <div className="alert-box-success">
            <span>{saveStatus}</span>
          </div>
        )}
        {saveError && (
          <div className="alert-box-error">
            <span>{saveError}</span>
          </div>
        )}

        {/* INITIAL VIEW (Before Ingestion) */}
        {!hasExtracted ? (
          <div className="fade-in">
            <div className="section-header">1. PRODUCT & BATCH IDENTIFICATION</div>
            <div className="grid-2">
              <div className="form-field">
                <label>Product Name (API/FDF)</label>
                <input 
                  type="text" 
                  placeholder="Awaiting AI extraction..." 
                  value={formData.product_name}
                  onChange={(e) => handleFieldChange('product_name', e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Batch / Lot Number</label>
                <input 
                  type="text" 
                  placeholder="Awaiting AI extraction..." 
                  value={formData.batch_number}
                  onChange={(e) => handleFieldChange('batch_number', e.target.value)}
                />
              </div>
            </div>

            <div className="section-header">2. FACILITY & MATERIAL IMPACT</div>
            <div className="grid-2">
              <div className="form-field">
                <label>Originating Site Block</label>
                <select 
                  value={formData.originating_site_block}
                  onChange={(e) => handleFieldChange('originating_site_block', e.target.value)}
                >
                  <option value="">Awaiting AI classification...</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Packaging & Warehousing">Packaging & Warehousing</option>
                  <option value="API Synthesis Block">API Synthesis Block</option>
                  <option value="Sterile Formulation">Sterile Formulation</option>
                </select>
              </div>
              <div className="form-field">
                <label>Impacted Non-Product Materials (NPM)</label>
                <input 
                  type="text" 
                  placeholder="e.g., Primary packaging..." 
                  value={formData.impacted_npm}
                  onChange={(e) => handleFieldChange('impacted_npm', e.target.value)}
                />
              </div>
            </div>

            <div className="section-header">3. DEFECT ANALYSIS</div>
            <div className="form-field" style={{ marginBottom: '20px' }}>
              <label>Structured Defect Summary</label>
              <textarea 
                rows={3} 
                placeholder="AI will synthesize the complaint into a formal QMS description..." 
                value={formData.complaint_description}
                onChange={(e) => handleFieldChange('complaint_description', e.target.value)}
              />
            </div>
          </div>
        ) : (
          /* EXPANDED VIEW (After Ingestion) */
          <div className="fade-in">
            <div className="section-header">1. ORIGIN & CUSTOMER DETAILS</div>
            <div className="grid-2">
              <div className="form-field">
                <label>Complaint Source</label>
                <input 
                  type="text" 
                  value={formData.complaint_source}
                  onChange={(e) => handleFieldChange('complaint_source', e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Customer Name</label>
                <input 
                  type="text" 
                  value={formData.customer_name}
                  onChange={(e) => handleFieldChange('customer_name', e.target.value)}
                />
              </div>
            </div>

            <div className="section-header">2. PRODUCT & BATCH IDENTIFICATION</div>
            <div className="grid-2">
              <div className="form-field">
                <label>Product Name</label>
                <input 
                  type="text" 
                  value={formData.product_name}
                  onChange={(e) => handleFieldChange('product_name', e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Product Strength</label>
                <input 
                  type="text" 
                  value={formData.product_strength}
                  onChange={(e) => handleFieldChange('product_strength', e.target.value)}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-field">
                <label>Batch / Lot Number</label>
                <input 
                  type="text" 
                  value={formData.batch_number}
                  onChange={(e) => handleFieldChange('batch_number', e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Affected Quantity</label>
                <input 
                  type="text" 
                  value={formData.affected_quantity}
                  onChange={(e) => handleFieldChange('affected_quantity', e.target.value)}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-field">
                <label>Manufacturing Date</label>
                <input 
                  type="text" 
                  value={formData.manufacture_date}
                  onChange={(e) => handleFieldChange('manufacture_date', e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Expiry Date</label>
                <input 
                  type="text" 
                  value={formData.expiry_date}
                  onChange={(e) => handleFieldChange('expiry_date', e.target.value)}
                />
              </div>
            </div>

            <div className="section-header">3. FACILITY & MATERIAL IMPACT</div>
            <div className="grid-2">
              <div className="form-field">
                <label>Originating Site Block</label>
                <select 
                  value={formData.originating_site_block}
                  onChange={(e) => handleFieldChange('originating_site_block', e.target.value)}
                >
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Packaging & Warehousing">Packaging & Warehousing</option>
                  <option value="API Synthesis Block">API Synthesis Block</option>
                  <option value="Sterile Formulation">Sterile Formulation</option>
                </select>
              </div>
              <div className="form-field">
                <label>Impacted Non-Product Materials (NPM)</label>
                <input 
                  type="text" 
                  value={formData.impacted_npm}
                  onChange={(e) => handleFieldChange('impacted_npm', e.target.value)}
                />
              </div>
            </div>

            <div className="section-header">4. DEFECT ANALYSIS</div>
            <div className="form-field" style={{ marginBottom: '14px' }}>
              <label>Complaint Category</label>
              <input 
                type="text" 
                value={formData.complaint_category}
                onChange={(e) => handleFieldChange('complaint_category', e.target.value)}
              />
            </div>

            <div className="form-field" style={{ marginBottom: '16px' }}>
              <label>Complaint Description</label>
              <textarea 
                rows={4} 
                value={formData.complaint_description}
                onChange={(e) => handleFieldChange('complaint_description', e.target.value)}
              />
            </div>

            {/* AI COPILOT RISK ASSESSMENT CARD */}
            <div className="ai-risk-assessment-card">
              <div className="risk-card-header">
                <ShieldCheckIcon />
                <span>AI copilot risk assessment</span>
              </div>

              <div className="grid-2" style={{ marginTop: '12px' }}>
                <div className="form-field">
                  <label className="risk-field-label">Severity (Suggested)</label>
                  <input 
                    type="text" 
                    className="risk-input"
                    value={formData.severity_suggested}
                    onChange={(e) => handleFieldChange('severity_suggested', e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label className="risk-field-label">Suggested Next Action</label>
                  <input 
                    type="text" 
                    className="risk-input"
                    value={formData.suggested_next_action}
                    onChange={(e) => handleFieldChange('suggested_next_action', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-field" style={{ marginTop: '12px' }}>
                <label className="risk-field-label">Initial Risk Assessment</label>
                <textarea 
                  rows={2}
                  className="risk-input"
                  value={formData.initial_risk_assessment}
                  onChange={(e) => handleFieldChange('initial_risk_assessment', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="actions-footer">
          <button className="btn-secondary" onClick={() => dispatch(resetForm())}>
            <RotateIcon />
            Reset Form
          </button>
          <button 
            className="btn-save-complaint" 
            onClick={() => dispatch(saveComplaintRecord())}
            disabled={isProcessing}
          >
            <SaveIcon />
            Save Complaint
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: AIVOA Copilot Chat */}
      <div className="card-panel">
        <div className="copilot-top-bar">
          <div className="brand-badge">
            <FlaskIcon />
            <h2 className="brand-text">AIVOA Copilot</h2>
          </div>
          <div className="status-dot-blue" />
        </div>
        <p className="copilot-subtext">Drop complaint files or paste text below.</p>

        <div className="chat-thread">
          {messages.map((m) => (
            <React.Fragment key={m.id}>
              {m.sender === 'ai' ? (
                <div className="msg-row-ai">
                  <div className="avatar-zap">
                    <ZapIcon />
                  </div>
                  <div className="bubble-ai-card">
                    {m.text}
                  </div>
                </div>
              ) : (
                <div className="msg-row-user">
                  <div className="bubble-user-card">
                    {m.isFile ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileBadgeIcon />
                        <span>{m.text}</span>
                      </div>
                    ) : (
                      m.text
                    )}
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
          {isProcessing && (
            <div className="msg-row-ai">
              <div className="avatar-zap">
                <ZapIcon />
              </div>
              <div className="bubble-ai-card" style={{ color: '#4f46e5', fontStyle: 'italic' }}>
                AIVOA Copilot is processing complaint data...
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        <div 
          className="quick-sample-pill"
          onClick={() => handleSend(SAMPLE_CASE)}
        >
          ⚡ Load Apollo Pharmacy Sample (Amoxicillin Capsules)
        </div>

        <div className="copilot-input-container">
          <input 
            type="file" 
            ref={fileInputRef} 
            accept=".pdf,.docx,.txt"
            style={{ display: 'none' }} 
            onChange={handleFileAttach}
          />
          <button 
            type="button"
            className="btn-paperclip" 
            title="Attach Complaint Document (.pdf, .txt)"
            onClick={() => fileInputRef.current?.click()}
          >
            <PaperclipIcon />
          </button>
          
          <input 
            type="text" 
            placeholder="Type a message or paste a complaint..."
            value={inputPrompt}
            disabled={isProcessing}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend(inputPrompt);
            }}
          />

          <button 
            type="button"
            className="btn-submit-check"
            disabled={isProcessing}
            onClick={() => handleSend(inputPrompt)}
          >
            <CheckIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
