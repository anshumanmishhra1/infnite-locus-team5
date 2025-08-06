import './App.css'
import './index.css'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthForms from './components/userAuth/AuthForms'
import HomePage from './components/home/HomePage'
import LoadingSpinner from './components/common/LoadingSpinner'

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return isAuthenticated ? <HomePage /> : <AuthForms />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App