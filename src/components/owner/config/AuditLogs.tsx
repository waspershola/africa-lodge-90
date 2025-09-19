import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useConfiguration } from '@/hooks/useConfiguration';
import { ConfigurationAuditLog } from '@/types/configuration';
import { format } from 'date-fns';
import { History, Search, Filter, Download, User, Clock, Settings } from 'lucide-react';

export const AuditLogs = () => {
  const { auditLogs, loading } = useConfiguration();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSection, setFilterSection] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = searchQuery === '' || 
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.field.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSection = filterSection === 'all' || log.section === filterSection;
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    
    return matchesSearch && matchesSection && matchesAction;
  });

  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'general': return <Settings className="h-4 w-4" />;
      case 'currency': return <span className="text-sm">₦</span>;
      case 'branding': return <span className="text-sm">🎨</span>;
      case 'documents': return <span className="text-sm">📄</span>;
      case 'guest_experience': return <User className="h-4 w-4" />;
      case 'permissions': return <span className="text-sm">🔒</span>;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatValue = (value: any): string => {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const exportLogs = () => {
    const csvContent = [
      'Timestamp,User,Role,Section,Action,Field,Description',
      ...filteredLogs.map(log => 
        `${log.timestamp},${log.user_name},${log.user_role},${log.section},${log.action},${log.field},"${log.description}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `configuration-audit-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-2">Configuration Audit Logs</h3>
          <p className="text-sm text-muted-foreground">
            Track all configuration changes and system modifications
          </p>
        </div>
        <Button onClick={exportLogs} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Section</label>
              <Select value={filterSection} onValueChange={setFilterSection}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  <SelectItem value="general">General Settings</SelectItem>
                  <SelectItem value="currency">Currency & Financials</SelectItem>
                  <SelectItem value="branding">Branding & Identity</SelectItem>
                  <SelectItem value="documents">Documents</SelectItem>
                  <SelectItem value="guest_experience">Guest Experience</SelectItem>
                  <SelectItem value="permissions">Permissions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Action</label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Audit Trail ({filteredLogs.length} entries)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No audit logs found matching your criteria</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex items-center gap-2 mt-1">
                        {getSectionIcon(log.section)}
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </div>
                      
                      <div className="flex-1">
                        <p className="font-medium">{log.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {log.user_name} ({log.user_role})
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm')}
                          </span>
                        </div>
                        
                        {log.old_value && log.new_value && (
                          <div className="mt-2 text-xs">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div className="p-2 bg-red-50 border border-red-200 rounded">
                                <span className="font-medium text-red-800">Before:</span>
                                <pre className="mt-1 text-red-700 whitespace-pre-wrap">
                                  {formatValue(log.old_value)}
                                </pre>
                              </div>
                              <div className="p-2 bg-green-50 border border-green-200 rounded">
                                <span className="font-medium text-green-800">After:</span>
                                <pre className="mt-1 text-green-700 whitespace-pre-wrap">
                                  {formatValue(log.new_value)}
                                </pre>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};