import { useContext } from 'react';
import UnifiedAuthContext from '../contexts/UnifiedAuthContext';
import { useAuth as useAdminAuth } from '../admin/context/AuthContext';

/**
 * Custom hook to use either the unified auth context or admin auth context
 * depending on which one is available in the component tree
 */
export const useAuthContext = () => {
  // Try to get the unified auth context first
  const unifiedAuthContext = useContext(UnifiedAuthContext);
  
  // If unified auth context is available, return it
  if (unifiedAuthContext) {
    return unifiedAuthContext;
  }
  
  // Otherwise, try to get the admin auth context
  try {
    const adminAuthContext = useAdminAuth();
    return adminAuthContext;
  } catch (e) {
    // If admin auth context is not available, continue
  }
  
  // Return null if neither context is available
  return null;
};