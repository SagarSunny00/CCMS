import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

export interface ComplaintFormData {
  complaint_source: string;
  customer_name: string;
  product_name: string;
  product_strength: string;
  batch_number: string;
  affected_quantity: string;
  manufacture_date: string;
  expiry_date: string;
  originating_site_block: string;
  impacted_npm: string;
  complaint_category: string;
  complaint_description: string;
  severity_suggested: string;
  suggested_next_action: string;
  initial_risk_assessment: string;
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  isFile?: boolean;
  fileName?: string;
}

export interface ComplaintState {
  formData: ComplaintFormData;
  messages: ChatMessage[];
  isProcessing: boolean;
  hasExtracted: boolean;
  saveStatus: string | null;
  saveError: string | null;
}

const emptyForm: ComplaintFormData = {
  complaint_source: "",
  customer_name: "",
  product_name: "",
  product_strength: "",
  batch_number: "",
  affected_quantity: "",
  manufacture_date: "",
  expiry_date: "",
  originating_site_block: "",
  impacted_npm: "",
  complaint_category: "",
  complaint_description: "",
  severity_suggested: "Major",
  suggested_next_action: "",
  initial_risk_assessment: ""
};

const initialState: ComplaintState = {
  formData: emptyForm,
  messages: [
    {
      id: '1',
      sender: 'ai',
      text: "Ready to process new complaints. You can paste the raw email from the customer, or upload a PDF of the complaint report. I will extract the data and run the initial risk assessment."
    }
  ],
  isProcessing: false,
  hasExtracted: false,
  saveStatus: null,
  saveError: null
};

export const runCopilotQuery = createAsyncThunk(
  'complaint/runCopilotQuery',
  async (promptText: string, { getState, rejectWithValue }) => {
    try {
      const state = (getState() as { complaint: ComplaintState }).complaint;
      const res = await axios.post('/api/complaints/copilot', {
        current_form: state.formData,
        prompt: promptText
      });
      return { prompt: promptText, data: res.data };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || err.message || "Failed to communicate with AI Backend");
    }
  }
);

export const uploadComplaintFile = createAsyncThunk(
  'complaint/uploadComplaintFile',
  async (file: File, { getState, rejectWithValue }) => {
    try {
      const state = (getState() as { complaint: ComplaintState }).complaint;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('current_form_str', JSON.stringify(state.formData));

      const res = await axios.post('/api/complaints/upload-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return { fileName: file.name, data: res.data };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || err.message || "File upload failed");
    }
  }
);

export const saveComplaintRecord = createAsyncThunk(
  'complaint/saveComplaintRecord',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = (getState() as { complaint: ComplaintState }).complaint;
      const res = await axios.post('/api/complaints/save', {
        form_data: state.formData
      });
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || err.message || "Database persistence failed");
    }
  }
);

const complaintSlice = createSlice({
  name: 'complaint',
  initialState,
  reducers: {
    updateFormField: (
      state,
      action: PayloadAction<{ field: keyof ComplaintFormData; value: string }>
    ) => {
      state.formData[action.payload.field] = action.payload.value;
    },
    resetForm: (state) => {
      state.formData = emptyForm;
      state.hasExtracted = false;
      state.saveStatus = null;
      state.saveError = null;
      state.messages = [initialState.messages[0]];
    }
  },
  extraReducers: (builder) => {
    // Text Prompt Handler
    builder
      .addCase(runCopilotQuery.pending, (state, action) => {
        state.isProcessing = true;
        state.messages.push({
          id: String(Date.now()),
          sender: 'user',
          text: action.meta.arg
        });
      })
      .addCase(runCopilotQuery.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.hasExtracted = true;
        state.formData = {
          ...state.formData,
          ...action.payload.data.form_data
        };
        state.messages.push({
          id: String(Date.now() + 1),
          sender: 'ai',
          text: action.payload.data.assistant_response
        });
      })
      .addCase(runCopilotQuery.rejected, (state, action) => {
        state.isProcessing = false;
        state.messages.push({
          id: String(Date.now() + 1),
          sender: 'ai',
          text: `Error: ${action.payload}`
        });
      });

    // File Upload Handler (Prevents binary text dump)
    builder
      .addCase(uploadComplaintFile.pending, (state, action) => {
        state.isProcessing = true;
        state.messages.push({
          id: String(Date.now()),
          sender: 'user',
          text: `Attached Document: ${action.meta.arg.name}`,
          isFile: true,
          fileName: action.meta.arg.name
        });
      })
      .addCase(uploadComplaintFile.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.hasExtracted = true;
        state.formData = {
          ...state.formData,
          ...action.payload.data.form_data
        };
        state.messages.push({
          id: String(Date.now() + 1),
          sender: 'ai',
          text: action.payload.data.assistant_response
        });
      })
      .addCase(uploadComplaintFile.rejected, (state, action) => {
        state.isProcessing = false;
        state.messages.push({
          id: String(Date.now() + 1),
          sender: 'ai',
          text: `Error processing file: ${action.payload}`
        });
      });

    // Database Save
    builder
      .addCase(saveComplaintRecord.pending, (state) => {
        state.saveStatus = "Writing to cGMP database...";
        state.saveError = null;
      })
      .addCase(saveComplaintRecord.fulfilled, (state, action) => {
        state.saveStatus = action.payload.message;
        state.saveError = null;
      })
      .addCase(saveComplaintRecord.rejected, (state, action) => {
        state.saveStatus = null;
        state.saveError = `Save Failed: ${action.payload}`;
      });
  }
});

export const { updateFormField, resetForm } = complaintSlice.actions;
export default complaintSlice.reducer;
