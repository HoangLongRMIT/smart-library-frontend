import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './css/App.css'
import './css/Typo.css'
import App from './App.jsx'
import LoginPage from './pages/LoginPage'
import React from 'react';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
  {/* <App/> For testing purposes, replace with <App /> when ready */}
    <LoginPage />
  </React.StrictMode>
)
