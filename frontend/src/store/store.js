// frontend/src/store/store.js

import { configureStore, combineReducers } from '@reduxjs/toolkit'
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import authReducer from './slices/authSlice'
import resumeReducer from './slices/resumeSlice'
import jobReducer from './slices/jobSlice'
import notificationReducer from './slices/notificationSlice'
import uiReducer from './slices/uiSlice'
import analyticsReducer from './slices/analyticsSlice'
import { api } from '../services/api'

// 1. Combine reducers into a single root reducer
const rootReducer = combineReducers({
  auth: authReducer,
  resume: resumeReducer,
  job: jobReducer,
  notification: notificationReducer,
  ui: uiReducer,
  analytics: analyticsReducer,
  [api.reducerPath]: api.reducer,
})

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'ui'], // Only persist auth and UI state
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // 2. Ignore all Redux Persist internal action types
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(api.middleware),
  devTools: import.meta.env.NODE_ENV !== 'production',
})

export const persistor = persistStore(store)
