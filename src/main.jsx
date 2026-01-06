import './assets/fonts/fonts.css';  // Fonts first
import './index.css';               // Tailwind
import './styles/app.css';          // Your custom styles
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)