import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import MultiStepForm from './components/MultiStepForm';
import hpairPhoto from './IMG_6967.webp';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container">
        <div className="form-container">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={() => {}} />;
  }

  // Remount the form when switching accounts so drafts and files cannot mix.
  return React.cloneElement(children, { key: user.uid });
};

function AppLayout() {
  const { user, loading } = useAuth();
  const showForm = !loading && !!user;

  return (
    <div className={`App${showForm ? ' App--authenticated' : ''}`}>
      <aside className="photo-panel" aria-label="HPAIR community">
        <img className="community-photo" src={hpairPhoto} alt="Participants gathered at an HPAIR event" />
        <div className="photo-tint" aria-hidden="true" />
        <header className="App-header">
          <h1>HPAIR</h1>
          <p>Personal Information Portal</p>
        </header>
      </aside>
      <main className="form-panel">
        <Routes>
          <Route path="/" element={
            <ProtectedRoute>
              <MultiStepForm />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout />
      </Router>
    </AuthProvider>
  );
}

export default App;
