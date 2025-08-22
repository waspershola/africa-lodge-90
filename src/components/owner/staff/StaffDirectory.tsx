import { useState } from "react";
import { Plus, Search, MoreHorizontal, Edit, Trash2, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AddStaffDialog from "./AddStaffDialog";

interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  status: 'active' | 'inactive';
  joinDate: string;
  avatar?: string;
  lastLogin?: string;
}

const mockStaff: Staff[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@hotel.com',
    phone: '+1 (555) 123-4567',
    role: 'Front Desk Manager',
    department: 'Reception',
    status: 'active',
    joinDate: '2024-01-15',
    lastLogin: '2 hours ago'
  },
  {
    id: '2',
    name: 'Mike Chen',
    email: 'mike.chen@hotel.com',
    phone: '+1 (555) 234-5678',
    role: 'Housekeeping Supervisor',
    department: 'Housekeeping',
    status: 'active',
    joinDate: '2024-02-20',
    lastLogin: '1 day ago'
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@hotel.com',
    phone: '+1 (555) 345-6789',
    role: 'Concierge',
    department: 'Guest Services',
    status: 'inactive',
    joinDate: '2023-11-10',
    lastLogin: '1 week ago'
  }
];

export default function StaffDirectory() {
  const [staff, setStaff] = useState<Staff[]>(mockStaff);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filteredStaff = staff.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    return status === 'active' 
      ? <Badge variant="default" className="bg-success/10 text-success border-success/20">Active</Badge>
      : <Badge variant="secondary" className="bg-muted text-muted-foreground">Inactive</Badge>;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <Card className="flex-1 mr-6">
          <CardHeader>
            <CardTitle>Staff Overview</CardTitle>
            <CardDescription>Current staff statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{staff.filter(s => s.status === 'active').length}</div>
                <div className="text-sm text-muted-foreground">Active Staff</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-muted-foreground">{staff.length}</div>
                <div className="text-sm text-muted-foreground">Total Staff</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">{new Set(staff.map(s => s.department)).size}</div>
                <div className="text-sm text-muted-foreground">Departments</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Staff Member
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Directory</CardTitle>
          <CardDescription>Manage your hotel staff members and their roles</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Role & Department</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="text-xs">{getInitials(member.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-muted-foreground">Joined {new Date(member.joinDate).toLocaleDateString()}</div>
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
                    <div>
                      <div className="text-sm">{member.email}</div>
                      <div className="text-sm text-muted-foreground">{member.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(member.status)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {member.lastLogin}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
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
                        <DropdownMenuItem className="text-destructive">
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
        </CardContent>
      </Card>

      <AddStaffDialog 
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onStaffAdded={(newStaff) => setStaff([...staff, { 
          ...newStaff, 
          id: Date.now().toString(),
          avatar: undefined,
          lastLogin: undefined
        } as Staff])}
      />
    </div>
  );
}