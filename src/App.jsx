import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app-layout">
        <nav style={{ borderBottom: '1px solid var(--border-color)', padding: '1rem 0', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 10 }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', items: 'center' }}>
            <div style={{ fontWeight: 'bold', fontSize: '1.5rem', color: 'var(--text-primary)' }}>OpenLMS</div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {/* Navigation links will go here */}
            </div>
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Add more routes here later */}
        </Routes>
      </div>
    </Router>
  )
}

export default App
