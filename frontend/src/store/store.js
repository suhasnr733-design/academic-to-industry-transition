// frontend/src/store/store.js

import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import authReducer from './slices/authSlice'
import resumeReducer from './slices/resumeSlice'
import jobReducer from './slices/jobSlice'
import notificationReducer from './slices/notificationSlice'
import uiReducer from './slices/uiSlice'
import analyticsReducer from './slices/analyticsSlice'

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'ui'] // Only persist auth and UI state
}

const rootReducer = {
  auth: authReducer,
  resume: resumeReducer,
  job: jobReducer,
  notification: notificationReducer,
  ui: uiReducer,
  analytics: analyticsReducer
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE']
      }
    }),
  devTools: import.meta.env.NODE_ENV !== 'production'
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch