import React, { useState } from 'react'
import Login from './auth/pages/Login'
import Register from './auth/pages/Register'

function App() {
  const [currentView, setCurrentView] = useState('register')

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
      {currentView === 'login' ? (
        <Login onNavigateToRegister={() => setCurrentView('register')} />
      ) : (
        <Register onNavigateToLogin={() => setCurrentView('login')} />
      )}
    </div>
  )
}

export default App
