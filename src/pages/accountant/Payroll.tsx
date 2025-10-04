import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Calendar, Users } from "lucide-react";

export default function Payroll() {
  const employees = [
    { id: 1, name: "John Smith", role: "Manager", salary: 4500, status: "paid", date: "2025-01-01" },
    { id: 2, name: "Sarah Johnson", role: "Front Desk", salary: 2800, status: "paid", date: "2025-01-01" },
    { id: 3, name: "Mike Brown", role: "Housekeeping", salary: 2200, status: "pending", date: "2025-01-15" },
    { id: 4, name: "Emma Wilson", role: "Chef", salary: 3500, status: "paid", date: "2025-01-01" },
    { id: 5, name: "David Lee", role: "Maintenance", salary: 2600, status: "pending", date: "2025-01-15" },
  ];

  const totalPayroll = employees.reduce((sum, emp) => sum + emp.salary, 0);
  const pendingPayroll = employees.filter(e => e.status === "pending").reduce((sum, emp) => sum + emp.salary, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payroll Management</h1>
          <p className="text-muted-foreground">Manage employee salaries and payments</p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export Payroll
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">Active staff members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPayroll.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total monthly cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${pendingPayroll.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Due this period</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search employees..." className="pl-9" />
            </div>
            <Button>Process Payroll</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Employee</th>
                  <th className="text-left py-3 px-4 font-semibold">Role</th>
                  <th className="text-left py-3 px-4 font-semibold">Salary</th>
                  <th className="text-left py-3 px-4 font-semibold">Pay Date</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium">{employee.name}</td>
                    <td className="py-3 px-4">{employee.role}</td>
                    <td className="py-3 px-4 font-semibold">${employee.salary.toLocaleString()}</td>
                    <td className="py-3 px-4">{employee.date}</td>
                    <td className="py-3 px-4">
                      <Badge variant={employee.status === "paid" ? "default" : "secondary"}>
                        {employee.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm">View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
