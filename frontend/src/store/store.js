// frontend/src/store/store.js

import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import resumeReducer from './slices/resumeSlice'
import jobReducer from './slices/jobSlice'
import notificationReducer from './slices/notificationSlice'
import uiReducer from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    resume: resumeReducer,
    job: jobReducer,
    notification: notificationReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch