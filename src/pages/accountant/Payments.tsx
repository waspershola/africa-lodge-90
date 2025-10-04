import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Filter } from "lucide-react";

export default function Payments() {
  const payments = [
    { id: 1, date: "2025-01-15", guest: "John Smith", room: "301", amount: 450, method: "Credit Card", status: "completed" },
    { id: 2, date: "2025-01-15", guest: "Sarah Johnson", room: "205", amount: 380, method: "Debit Card", status: "completed" },
    { id: 3, date: "2025-01-14", guest: "Mike Brown", room: "412", amount: 620, method: "Cash", status: "completed" },
    { id: 4, date: "2025-01-14", guest: "Emma Wilson", room: "108", amount: 295, method: "Credit Card", status: "pending" },
    { id: 5, date: "2025-01-13", guest: "David Lee", room: "502", amount: 890, method: "Bank Transfer", status: "completed" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Logs</h1>
          <p className="text-muted-foreground">Track and manage all payment transactions</p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search payments..." className="pl-9" />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Date</th>
                  <th className="text-left py-3 px-4 font-semibold">Guest</th>
                  <th className="text-left py-3 px-4 font-semibold">Room</th>
                  <th className="text-left py-3 px-4 font-semibold">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold">Method</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">{payment.date}</td>
                    <td className="py-3 px-4 font-medium">{payment.guest}</td>
                    <td className="py-3 px-4">{payment.room}</td>
                    <td className="py-3 px-4 font-semibold">${payment.amount.toFixed(2)}</td>
                    <td className="py-3 px-4">{payment.method}</td>
                    <td className="py-3 px-4">
                      <Badge variant={payment.status === "completed" ? "default" : "secondary"}>
                        {payment.status}
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
