import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserRole } from '@/config/dashboardConfig';
import { useMenuLoader, validateMenuConfig } from '@/hooks/useMenuLoader';
import { useMenuInheritance, getModuleCountBySource } from '@/hooks/useMenuInheritance';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

const ROLES: UserRole[] = ['OWNER', 'MANAGER', 'ACCOUNTANT', 'HOUSEKEEPING', 'MAINTENANCE', 'POS'];

export function RoleMenuPreview() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('MANAGER');
  const { modules, moduleCount } = useMenuLoader(selectedRole);
  const { inheritanceTree, totalModules, directModules, inheritedModules } = useMenuInheritance(selectedRole);
  const validation = validateMenuConfig();
  const moduleCounts = getModuleCountBySource(selectedRole);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Role Menu Configuration Preview</h1>
        <p className="text-muted-foreground">
          Debug tool for visualizing role-based menu inheritance
        </p>
      </div>

      {/* Validation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {validation.valid ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            Configuration Validation
          </CardTitle>
        </CardHeader>
        <CardContent>
          {validation.valid ? (
            <p className="text-sm text-green-600">✓ All configurations are valid</p>
          ) : (
            <div className="space-y-2">
              {validation.errors.map((error, i) => (
                <p key={i} className="text-sm text-red-600">✗ {error}</p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Role to Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {ROLES.map(role => (
              <Badge
                key={role}
                variant={selectedRole === role ? 'default' : 'outline'}
                className="cursor-pointer px-4 py-2 text-sm"
                onClick={() => setSelectedRole(role)}
              >
                {role}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="modules" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="modules">Modules ({moduleCount})</TabsTrigger>
          <TabsTrigger value="inheritance">Inheritance Tree</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Modules for {selectedRole}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {directModules} direct + {inheritedModules} inherited = {totalModules} total
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {modules.map((module, index) => (
                  <div
                    key={`${module.id}-${index}`}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{module.label}</p>
                      <p className="text-sm text-muted-foreground">{module.path}</p>
                    </div>
                    <Badge variant="outline">{module.icon}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inheritance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inheritance Hierarchy</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="p-4 bg-muted rounded-lg overflow-auto text-sm">
                {JSON.stringify(inheritanceTree, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
                <Info className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalModules}</div>
                <p className="text-xs text-muted-foreground">Available for {selectedRole}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Direct Modules</CardTitle>
                <Info className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{directModules}</div>
                <p className="text-xs text-muted-foreground">Defined for this role</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Inherited Modules</CardTitle>
                <Info className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inheritedModules}</div>
                <p className="text-xs text-muted-foreground">From parent roles</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Module Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(moduleCounts).map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{source}</span>
                    <Badge>{count} modules</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Validation Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Role</th>
                    <th className="text-center py-2">Direct</th>
                    <th className="text-center py-2">Inherited</th>
                    <th className="text-center py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {ROLES.map(role => {
                    const { modules: roleModules, roleConfig } = useMenuLoader(role);
                    const direct = roleConfig?.modules?.length || 0;
                    const total = roleModules.length;
                    return (
                      <tr key={role} className="border-b">
                        <td className="py-2 font-medium">{role}</td>
                        <td className="text-center">{direct}</td>
                        <td className="text-center">{total - direct}</td>
                        <td className="text-center font-bold">{total}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
