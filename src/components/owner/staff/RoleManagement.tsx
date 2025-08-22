import { useState } from "react";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import CreateRoleDialog from "./CreateRoleDialog";
import PermissionsMatrix from "./PermissionsMatrix";

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Record<string, Record<string, boolean>>;
  staffCount: number;
  isSystem: boolean;
  createdDate: string;
}

const mockRoles: Role[] = [
  {
    id: '1',
    name: 'Hotel Owner',
    description: 'Full access to all hotel operations and settings',
    permissions: {
      dashboard: { view: true, edit: true, approve: true },
      reservations: { view: true, edit: true, approve: true },
      rooms: { view: true, edit: true, approve: true },
      staff: { view: true, edit: true, approve: true },
      reports: { view: true, edit: true, approve: true }
    },
    staffCount: 1,
    isSystem: true,
    createdDate: '2024-01-01'
  },
  {
    id: '2',
    name: 'Front Desk Manager',
    description: 'Manage front desk operations, reservations, and guest services',
    permissions: {
      dashboard: { view: true, edit: false, approve: false },
      reservations: { view: true, edit: true, approve: true },
      rooms: { view: true, edit: true, approve: false },
      staff: { view: true, edit: false, approve: false },
      reports: { view: true, edit: false, approve: false }
    },
    staffCount: 2,
    isSystem: false,
    createdDate: '2024-01-15'
  },
  {
    id: '3',
    name: 'Housekeeping Supervisor',
    description: 'Oversee room cleaning and maintenance operations',
    permissions: {
      dashboard: { view: true, edit: false, approve: false },
      reservations: { view: true, edit: false, approve: false },
      rooms: { view: true, edit: true, approve: false },
      staff: { view: false, edit: false, approve: false },
      reports: { view: true, edit: false, approve: false }
    },
    staffCount: 1,
    isSystem: false,
    createdDate: '2024-02-01'
  },
  {
    id: '4',
    name: 'Concierge',
    description: 'Guest services and experience management',
    permissions: {
      dashboard: { view: true, edit: false, approve: false },
      reservations: { view: true, edit: false, approve: false },
      rooms: { view: true, edit: false, approve: false },
      staff: { view: false, edit: false, approve: false },
      reports: { view: false, edit: false, approve: false }
    },
    staffCount: 3,
    isSystem: false,
    createdDate: '2024-02-10'
  }
];

export default function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewPermissions = (role: Role) => {
    setSelectedRole(role);
    setIsPermissionsOpen(true);
  };

  const getTotalPermissions = (permissions: Record<string, Record<string, boolean>>) => {
    let total = 0;
    let granted = 0;
    
    Object.values(permissions).forEach(modulePerms => {
      Object.values(modulePerms).forEach(hasPermission => {
        total++;
        if (hasPermission) granted++;
      });
    });
    
    return { total, granted };
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{roles.length}</div>
            <p className="text-xs text-muted-foreground">
              {roles.filter(r => !r.isSystem).length} custom roles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff Assigned</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{roles.reduce((sum, role) => sum + role.staffCount, 0)}</div>
            <p className="text-xs text-muted-foreground">
              Across all roles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custom Roles</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{roles.filter(r => !r.isSystem).length}</div>
            <p className="text-xs text-muted-foreground">
              Created by you
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Role
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role Directory</CardTitle>
          <CardDescription>Manage roles and their permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Staff Count</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.map((role) => {
                const { total, granted } = getTotalPermissions(role.permissions);
                return (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{role.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Created {new Date(role.createdDate).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="text-sm text-muted-foreground truncate">{role.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{role.staffCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPermissions(role)}
                      >
                        {granted}/{total} permissions
                      </Button>
                    </TableCell>
                    <TableCell>
                      {role.isSystem ? (
                        <Badge variant="secondary">System</Badge>
                      ) : (
                        <Badge variant="outline">Custom</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewPermissions(role)}>
                            <Shield className="mr-2 h-4 w-4" />
                            View Permissions
                          </DropdownMenuItem>
                          {!role.isSystem && (
                            <>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Role
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Role
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateRoleDialog 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onRoleCreated={(newRole) => setRoles([...roles, { 
          ...newRole, 
          id: Date.now().toString()
        } as Role])}
      />

      {selectedRole && (
        <PermissionsMatrix
          open={isPermissionsOpen}
          onOpenChange={setIsPermissionsOpen}
          role={selectedRole}
          onPermissionsUpdate={(updatedRole) => {
            setRoles(roles.map(r => r.id === updatedRole.id ? updatedRole : r));
            setSelectedRole(updatedRole);
          }}
        />
      )}
    </div>
  );
}