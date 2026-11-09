import Dashboard from './pages/dashboard'
import Login from './pages/login'
import './App.css'

function App() {
  if (window.location.pathname === '/dashboard') {
    return <Dashboard />
  }

  return (
    <div className="App">
      <Login />
    </div>
  )
}

export default App
