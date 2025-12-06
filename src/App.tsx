import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CheckInForm from './components/CheckInForm';
import OwnerDashboard from './components/OwnerDashboard';
import BrowserDatabaseService from './services/browserDatabase';
import type { CustomerCheckInForm } from './types/models';

function App() {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckInSubmit = async (formData: CustomerCheckInForm) => {
    setIsLoading(true);
    try {
      console.log('Processing check-in:', formData);
      const checkIn = BrowserDatabaseService.processCustomerCheckIn(formData);
      console.log('Check-in created:', checkIn);

      // Show success message
      alert('Check-in successful! Thank you for providing your information ahead of time.');
    } catch (error) {
      console.error('Check-in failed:', error);
      alert('Check-in failed. Please try again or speak with the front desk.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route
            path="/"
            element={<CheckInForm onSubmit={handleCheckInSubmit} isLoading={isLoading} />}
          />
          <Route
            path="/check-in"
            element={<CheckInForm onSubmit={handleCheckInSubmit} isLoading={isLoading} />}
          />
          <Route
            path="/dashboard"
            element={<OwnerDashboard />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
