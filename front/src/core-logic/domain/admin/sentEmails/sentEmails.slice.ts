import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { EmailSentDto } from "shared/src/email/email";

export type SentEmailsState = {
  isLoading: boolean;
  error: string | null;
  sentEmails: EmailSentDto[];
};

const initialState: SentEmailsState = {
  isLoading: false,
  sentEmails: [],
  error: null,
};

export const sentEmailsSlice = createSlice({
  name: "sentEmails",
  initialState,
  reducers: {
    lastSentEmailsRequested: (state) => {
      state.isLoading = true;
    },
    lastSentEmailsSucceeded: (state, action: PayloadAction<EmailSentDto[]>) => {
      state.sentEmails = action.payload;
      state.error = null;
      state.isLoading = false;
    },
    lastSentEmailsFailed: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});
