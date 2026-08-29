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
import notificationReducer from './slices/notificationSlice'
import uiReducer from './slices/uiSlice'
import analyticsReducer from './slices/analyticsSlice'

// 1. Combine reducers into a single root reducer
// Note: Job state is canonically managed by frontend/src/hooks/useJobs.js
const rootReducer = combineReducers({
  auth: authReducer,
  resume: resumeReducer,
  notification: notificationReducer,
  ui: uiReducer,
  analytics: analyticsReducer,
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
        // Ignore all Redux Persist internal action types
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: import.meta.env.NODE_ENV !== 'production',
})

export const persistor = persistStore(store)
export default store
