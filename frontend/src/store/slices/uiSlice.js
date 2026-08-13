// frontend/src/store/slices/uiSlice.js

import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: true,
    theme: 'light',
    activeModal: null,
  },
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload
    },
    setTheme: (state, action) => {
      state.theme = action.payload
    },
    openModal: (state, action) => {
      state.activeModal = action.payload
    },
    closeModal: (state) => {
      state.activeModal = null
    }
  }
})

export const { 
  toggleSidebar, 
  setSidebarOpen, 
  setTheme, 
  openModal, 
  closeModal 
} = uiSlice.actions

export default uiSlice.reducer
