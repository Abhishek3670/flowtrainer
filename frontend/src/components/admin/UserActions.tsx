import { useState } from 'react';
import { User } from '../../types';
import { adminService } from '../../services/adminService';
import { useToast } from '../../components/ui/use-toast';
import { PencilIcon, TrashIcon, UserPlusIcon, UserMinusIcon, KeyIcon } from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { MoreHorizontal, Loader2 } from 'lucide-react';

interface UserActionsProps {
  user: User;
  onEdit: (user: User) => void;
  onUserUpdated: () => void;
  onDelete: (userId: string) => Promise<boolean>;
  isDeleting?: boolean;
}

export function UserActions({ user, onEdit, onUserUpdated, onDelete, isDeleting = false }: UserActionsProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const handleToggleStatus = async () => {
    try {
      setIsLoading(true);
      await adminService.updateUserStatus(user.id, !user.isActive);
      onUserUpdated();
      toast({
        title: 'Success',
        description: `User ${!user.isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update user status',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a new password',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      await adminService.resetUserPassword(user.id, newPassword);
      setShowResetPassword(false);
      setNewPassword('');
      toast({
        title: 'Success',
        description: 'Password reset successfully',
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reset password',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem 
            onClick={() => onEdit(user)} 
            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <PencilIcon className="mr-2 h-4 w-4" />
            <span>Edit</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={handleToggleStatus} 
            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
            disabled={isLoading}
          >
            {user.isActive ? (
              <>
                <UserMinusIcon className="mr-2 h-4 w-4" />
                <span>Deactivate</span>
              </>
            ) : (
              <>
                <UserPlusIcon className="mr-2 h-4 w-4" />
                <span>Activate</span>
              </>
            )}
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => setShowResetPassword(true)}
            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <KeyIcon className="mr-2 h-4 w-4" />
            <span>Reset Password</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={async () => await onDelete(user.id)}
            className="cursor-pointer text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
            disabled={isLoading || isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <TrashIcon className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showResetPassword && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-xl">
            <h3 className="text-lg font-medium mb-4">Reset Password for {user.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Enter new password"
                />
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowResetPassword(false);
                    setNewPassword('');
                  }}
                  disabled={isLoading}
                  className="dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleResetPassword}
                  disabled={isLoading || !newPassword.trim()}
                  className="dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
                >
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
