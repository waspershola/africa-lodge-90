import { useState } from "react";
import { Plus, Search, MoreHorizontal, Edit, Trash2, UserCheck, UserX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useOwnerStaff, useDeleteStaffMember, useUpdateStaffMember } from "@/hooks/useApi";
import { toast } from "sonner";
import AddStaffDialog from "./AddStaffDialog";

interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  status: 'active' | 'inactive' | 'pending';
  startDate?: string;
  avatar?: string;
  lastLogin?: string;
  permissions?: string[];
}

export default function StaffDirectory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: staffData, isLoading, error } = useOwnerStaff();
  const deleteStaffMutation = useDeleteStaffMember();
  const updateStaffMutation = useUpdateStaffMember();

  const staff = staffData?.data || [];

  const filteredStaff = staff.filter((member: Staff) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStatusToggle = async (staffId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await updateStaffMutation.mutateAsync({ 
        id: staffId, 
        data: { status: newStatus }
      });
    } catch (error) {
      toast.error('Failed to update staff status');
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (window.confirm('Are you sure you want to remove this staff member?')) {
      try {
        await deleteStaffMutation.mutateAsync(staffId);
      } catch (error) {
        toast.error('Failed to remove staff member');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-success/10 text-success border-success/20">Active</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-warning/10 text-warning-foreground border-warning/20">Pending</Badge>;
      case 'inactive':
        return <Badge variant="secondary" className="bg-muted text-muted-foreground">Inactive</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Stats calculation
  const activeStaff = staff.filter((s: Staff) => s.status === 'active').length;
  const pendingStaff = staff.filter((s: Staff) => s.status === 'pending').length;
  const totalStaff = staff.length;

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-destructive">
              Failed to load staff data. Please try again.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Staff Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Staff</p>
                <p className="text-2xl font-bold">{totalStaff}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Staff</p>
                <p className="text-2xl font-bold text-success">{activeStaff}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="luxury-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Invites</p>
                <p className="text-2xl font-bold text-warning-foreground">{pendingStaff}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                <UserX className="h-6 w-6 text-warning-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Management */}
      <Card className="luxury-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Staff Directory</CardTitle>
              <CardDescription>Manage your hotel staff and their roles</CardDescription>
            </div>
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-gradient-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Staff Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search staff by name, email, role, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Staff Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading staff...</span>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No staff found matching your search.' : 'No staff members yet.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Role & Department</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((member: Staff) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{member.role}</div>
                        <div className="text-sm text-muted-foreground">{member.department}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{member.email}</div>
                        <div className="text-muted-foreground">{member.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(member.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {member.lastLogin 
                          ? new Date(member.lastLogin).toLocaleDateString()
                          : 'Never'
                        }
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStatusToggle(member.id, member.status)}
                            disabled={updateStaffMutation.isPending}
                          >
                            {member.status === 'active' ? (
                              <>
                                <UserX className="mr-2 h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeleteStaff(member.id)}
                            disabled={deleteStaffMutation.isPending}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove Staff
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddStaffDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onStaffAdded={() => {
          setIsAddDialogOpen(false);
        }}
      />
    </div>
  );
}