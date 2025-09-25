import { useState } from 'react';
import { Search, MoreHorizontal, UserPlus, Shield, ShieldAlert, Clock, Trash2, Key, UserCheck, UserX } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,  
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  useGlobalUsers, 
  useUpdateGlobalUser, 
  useDeleteGlobalUser, 
  useResetGlobalUserPassword,
  type GlobalUser 
} from '@/hooks/useGlobalUsers';
import { format } from 'date-fns';
import { useMultiTenantAuth } from '@/hooks/useMultiTenantAuth';

export function GlobalUsersTable() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  const { user: currentUser } = useMultiTenantAuth();
  const { data: users = [], isLoading, error, refetch } = useGlobalUsers();
  const updateUser = useUpdateGlobalUser();
  const deleteUser = useDeleteGlobalUser();
  const resetPassword = useResetGlobalUserPassword();

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'inactive' && !user.is_active);

    return matchesSearch && matchesStatus;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-red-500/10 text-red-700 border-red-200';
      case 'PLATFORM_ADMIN':
        return 'bg-orange-500/10 text-orange-700 border-orange-200';
      case 'SUPPORT_STAFF':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-500/10 text-green-700 border-green-200'
      : 'bg-gray-500/10 text-gray-700 border-gray-200';
  };

  const handleToggleStatus = async (user: GlobalUser) => {
    if (user.is_platform_owner || !isSuperAdmin) {
      return; // Prevent any changes to platform owner or non-super admin users
    }

    await updateUser.mutateAsync({
      userId: user.id,
      updates: { is_active: !user.is_active }
    });
  };

  const handleDelete = async (user: GlobalUser) => {
    // Allow deletion of Reset Required users even if they are platform owners
    if (!user.force_reset && user.is_platform_owner) {
      return; // Don't allow deletion of platform owners unless they have force_reset
    }
    
    if (!isSuperAdmin) {
      return; // Only super admin can delete
    }

    if (confirm(`Are you sure you want to delete ${user.name || user.email}? This action cannot be undone.`)) {
      await deleteUser.mutateAsync(user.id);
    }
  };

  const handleResetPassword = async (user: GlobalUser) => {
    await resetPassword.mutateAsync(user.id);
  };

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <ShieldAlert className="h-4 w-4 text-red-600" />
        <AlertDescription>
          Failed to load global users. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Global Users ({filteredUsers.length})
          </CardTitle>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            {(['all', 'active', 'inactive'] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status === 'all' ? 'All' : status === 'active' ? 'Active' : 'Inactive'}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading global users...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    {searchQuery ? 'No users match your search.' : 'No global users found.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.name || 'Unnamed User'}</span>
                          {user.is_platform_owner && (
                            <Badge variant="outline" className="bg-gold-500/10 text-gold-700 border-gold-200">
                              <Shield className="h-3 w-3 mr-1" />
                              Owner
                            </Badge>
                          )}
                          {user.force_reset && (
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-200">
                              <Clock className="h-3 w-3 mr-1" />
                              Reset Required
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">{user.email}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="outline" className={getRoleColor(user.role)}>
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <span className="text-sm">
                        {user.department || '—'}
                      </span>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(user.is_active)}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {user.last_login 
                          ? format(new Date(user.last_login), 'MMM d, yyyy')
                          : 'Never'
                        }
                      </span>
                    </TableCell>
                    
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(user.created_at), 'MMM d, yyyy')}
                      </span>
                    </TableCell>
                    
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                            <Key className="mr-2 h-4 w-4" />
                            Reset Password
                          </DropdownMenuItem>
                          
                          {/* Reset to temporary password only for non-platform owners */}
                          {!user.is_platform_owner && isSuperAdmin && (
                            <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                              <Clock className="mr-2 h-4 w-4" />
                              Reset to Temporary Password
                            </DropdownMenuItem>
                          )}
                          
                          {/* Suspend/Activate only for non-platform owners */}
                          {!user.is_platform_owner && isSuperAdmin && (
                            <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                              {user.is_active ? (
                                <>
                                  <UserX className="mr-2 h-4 w-4" />
                                  Suspend User
                                </>
                              ) : (
                                <>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Activate User
                                </>
                              )}
                            </DropdownMenuItem>
                          )}
                          
                          {/* Delete for Reset Required users OR non-platform owners */}
                          {(user.force_reset || !user.is_platform_owner) && isSuperAdmin && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDelete(user)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User{user.force_reset ? ' (Reset Required)' : ''}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}