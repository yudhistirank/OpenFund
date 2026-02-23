import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layout Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Landing from './pages/Landing';
import HomePage from './pages/HomePage';
import CreateCampaign from './pages/CreateCampaign';
import CampaignDetail from './pages/CampaignDetail';
import UserDashboard from './pages/UserDashboard';

// Styles
import './index.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Navigation */}
        <Navbar />
        
        {/* Main Content */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/campaigns" element={<HomePage />} />
            <Route path="/create" element={<CreateCampaign />} />
            <Route path="/campaign/:id" element={<CampaignDetail />} />
            <Route path="/dashboard" element={<UserDashboard />} />
            
            {/* Catch all route - redirect to campaigns */}
            <Route path="*" element={<HomePage />} />
          </Routes>
        </main>
        
        {/* Footer */}
        <Footer />
        
        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10B981',
              },
            },
            error: {
              style: {
                background: '#EF4444',
              },
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;
