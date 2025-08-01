import React from 'react';
import './App.css';
import WorkflowPage from './pages/WorkflowPage';
import { socketService } from './services/socketService';

function App() {
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      socketService.connect(token);
    }

    return () => {
      socketService.disconnect();
    };
  }, []);

  return (
    <div className="App">
      <WorkflowPage />
    </div>
  );
}

export default App;

