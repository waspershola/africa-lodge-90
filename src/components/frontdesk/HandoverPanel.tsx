import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, 
  AlertCircle, 
  CheckCircle,
  MessageSquare,
  User,
  Calendar,
  FileText,
  Send,
  ArrowRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HandoverNote {
  id: string;
  fromStaff: string;
  toStaff?: string;
  shift: 'morning' | 'afternoon' | 'night';
  date: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'general' | 'guest-issue' | 'maintenance' | 'financial' | 'security';
  subject: string;
  content: string;
  status: 'pending' | 'acknowledged' | 'resolved';
  resolvedBy?: string;
  resolvedAt?: Date;
  followUpRequired: boolean;
}

interface ShiftSummary {
  shift: 'morning' | 'afternoon' | 'night';
  date: Date;
  staff: string;
  checkIns: number;
  checkOuts: number;
  issues: number;
  revenue: number;
  notes: string;
}

const mockHandoverNotes: HandoverNote[] = [
  {
    id: '1',
    fromStaff: 'Sarah Johnson',
    toStaff: 'Next Shift',
    shift: 'morning',
    date: new Date('2024-09-18T07:00:00'),
    priority: 'high',
    category: 'guest-issue',
    subject: 'Room 301 Guest Complaint',
    content: 'Guest in Room 301 reported AC not working properly. Maintenance has been notified but could not fix today. Guest offered room change but declined. Expects resolution by tomorrow morning.',
    status: 'pending',
    followUpRequired: true
  },
  {
    id: '2',
    fromStaff: 'Mike Chen',
    toStaff: 'Morning Staff',
    shift: 'night',
    date: new Date('2024-09-17T23:00:00'),
    priority: 'medium',
    category: 'maintenance',
    subject: 'Elevator Issue Floor 3',
    content: 'Elevator making unusual noise between floors 2-3. Technician scheduled for 9 AM tomorrow. No safety concerns but guests have been informed.',
    status: 'acknowledged',
    followUpRequired: true
  },
  {
    id: '3',
    fromStaff: 'David Wilson',
    toStaff: 'Evening Shift',
    shift: 'afternoon',
    date: new Date('2024-09-17T15:00:00'),
    priority: 'low',
    category: 'general',
    subject: 'VIP Guest Arrival Tomorrow',
    content: 'VIP guest Mr. Thompson arriving tomorrow at 2 PM. Presidential suite prepared. Requested champagne and flowers - arranged with housekeeping.',
    status: 'resolved',
    resolvedBy: 'Lisa Brown',
    resolvedAt: new Date('2024-09-17T20:00:00'),
    followUpRequired: false
  }
];

const mockShiftSummaries: ShiftSummary[] = [
  {
    shift: 'morning',
    date: new Date('2024-09-18'),
    staff: 'Sarah Johnson',
    checkIns: 8,
    checkOuts: 12,
    issues: 2,
    revenue: 245000,
    notes: 'Busy morning with multiple group check-outs. One payment issue resolved. AC repair pending in Room 301.'
  },
  {
    shift: 'night',
    date: new Date('2024-09-17'),
    staff: 'Mike Chen',
    checkIns: 3,
    checkOuts: 0,
    issues: 1,
    revenue: 89000,
    notes: 'Quiet night shift. Late arrival for Room 205. Elevator noise reported - technician scheduled.'
  }
];

export const HandoverPanel = () => {
  const [activeTab, setActiveTab] = useState("current");
  const [handoverNotes, setHandoverNotes] = useState<HandoverNote[]>(mockHandoverNotes);
  const [shiftSummaries] = useState<ShiftSummary[]>(mockShiftSummaries);
  const [newHandover, setNewHandover] = useState({
    priority: 'medium' as HandoverNote['priority'],
    category: 'general' as HandoverNote['category'],
    subject: '',
    content: '',
    followUpRequired: false
  });

  const { toast } = useToast();

  const getCurrentShift = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 14) return 'morning';
    if (hour >= 14 && hour < 22) return 'afternoon';
    return 'night';
  };

  const getPriorityColor = (priority: HandoverNote['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: HandoverNote['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'acknowledged': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: HandoverNote['category']) => {
    switch (category) {
      case 'guest-issue': return <User className="h-4 w-4" />;
      case 'maintenance': return <AlertCircle className="h-4 w-4" />;
      case 'financial': return <FileText className="h-4 w-4" />;
      case 'security': return <AlertCircle className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const handleSubmitHandover = () => {
    if (!newHandover.subject.trim() || !newHandover.content.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both subject and content",
        variant: "destructive"
      });
      return;
    }

    const handoverNote: HandoverNote = {
      id: Date.now().toString(),
      fromStaff: 'Current User', // Would be from auth context
      shift: getCurrentShift(),
      date: new Date(),
      priority: newHandover.priority,
      category: newHandover.category,
      subject: newHandover.subject,
      content: newHandover.content,
      status: 'pending',
      followUpRequired: newHandover.followUpRequired
    };

    setHandoverNotes(prev => [handoverNote, ...prev]);
    setNewHandover({
      priority: 'medium',
      category: 'general',
      subject: '',
      content: '',
      followUpRequired: false
    });

    toast({
      title: "Handover Note Created",
      description: "Your handover note has been logged for the next shift"
    });
  };

  const handleAcknowledge = (noteId: string) => {
    setHandoverNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, status: 'acknowledged' as const }
        : note
    ));
    
    toast({
      title: "Note Acknowledged",
      description: "Handover note has been marked as acknowledged"
    });
  };

  const handleResolve = (noteId: string) => {
    setHandoverNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { 
            ...note, 
            status: 'resolved' as const,
            resolvedBy: 'Current User',
            resolvedAt: new Date()
          }
        : note
    ));
    
    toast({
      title: "Issue Resolved",
      description: "Handover note has been marked as resolved"
    });
  };

  const pendingNotes = handoverNotes.filter(note => note.status === 'pending');
  const urgentNotes = handoverNotes.filter(note => 
    note.priority === 'urgent' || note.priority === 'high'
  );

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{pendingNotes.length}</div>
            <div className="text-sm text-muted-foreground">Pending Items</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{urgentNotes.length}</div>
            <div className="text-sm text-muted-foreground">High Priority</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {handoverNotes.filter(n => n.followUpRequired).length}
            </div>
            <div className="text-sm text-muted-foreground">Follow-up Required</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {handoverNotes.filter(n => n.status === 'resolved').length}
            </div>
            <div className="text-sm text-muted-foreground">Resolved Today</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">Current Issues</TabsTrigger>
          <TabsTrigger value="create">Create Handover</TabsTrigger>
          <TabsTrigger value="history">Shift History</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          {/* Urgent Items First */}
          {urgentNotes.length > 0 && (
            <Card className="border-red-200 bg-red-50/20">
              <CardHeader>
                <CardTitle className="text-red-800 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Urgent Items Requiring Attention
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {urgentNotes.map((note) => (
                  <div key={note.id} className="p-3 bg-white rounded-lg border border-red-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getPriorityColor(note.priority)}>
                            {note.priority.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {getCategoryIcon(note.category)}
                            <span className="ml-1">{note.category.replace('-', ' ')}</span>
                          </Badge>
                        </div>
                        <h4 className="font-medium">{note.subject}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{note.content}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                          <span>From: {note.fromStaff}</span>
                          <span>{note.date.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        {note.status === 'pending' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleAcknowledge(note.id)}>
                              Acknowledge
                            </Button>
                            <Button size="sm" onClick={() => handleResolve(note.id)}>
                              Resolve
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* All Handover Notes */}
          <div className="space-y-3">
            {handoverNotes.map((note) => (
              <Card key={note.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getPriorityColor(note.priority)}>
                          {note.priority}
                        </Badge>
                        <Badge className={getStatusColor(note.status)}>
                          {note.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                          {note.status === 'acknowledged' && <MessageSquare className="h-3 w-3 mr-1" />}
                          {note.status === 'resolved' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {note.status.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {getCategoryIcon(note.category)}
                          <span className="ml-1">{note.category.replace('-', ' ')}</span>
                        </Badge>
                        {note.followUpRequired && (
                          <Badge variant="outline" className="text-orange-600">
                            Follow-up Required
                          </Badge>
                        )}
                      </div>
                      
                      <h3 className="font-medium mb-1">{note.subject}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{note.content}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {note.fromStaff}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {note.date.toLocaleString()}
                        </span>
                        <span className="capitalize">{note.shift} shift</span>
                        {note.resolvedBy && (
                          <span>Resolved by {note.resolvedBy}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      {note.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleAcknowledge(note.id)}>
                            Acknowledge
                          </Button>
                          <Button size="sm" onClick={() => handleResolve(note.id)}>
                            Resolve
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Create Shift Handover Note
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Priority Level</label>
                  <select 
                    className="w-full mt-1 p-2 border rounded-md"
                    value={newHandover.priority}
                    onChange={(e) => setNewHandover(prev => ({ 
                      ...prev, 
                      priority: e.target.value as HandoverNote['priority'] 
                    }))}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <select 
                    className="w-full mt-1 p-2 border rounded-md"
                    value={newHandover.category}
                    onChange={(e) => setNewHandover(prev => ({ 
                      ...prev, 
                      category: e.target.value as HandoverNote['category'] 
                    }))}
                  >
                    <option value="general">General</option>
                    <option value="guest-issue">Guest Issue</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="financial">Financial</option>
                    <option value="security">Security</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Subject *</label>
                <input
                  type="text"
                  className="w-full mt-1 p-2 border rounded-md"
                  value={newHandover.subject}
                  onChange={(e) => setNewHandover(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Brief subject line"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Detailed Notes *</label>
                <Textarea
                  className="mt-1"
                  value={newHandover.content}
                  onChange={(e) => setNewHandover(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Detailed information for the next shift..."
                  rows={4}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="followUp"
                  checked={newHandover.followUpRequired}
                  onChange={(e) => setNewHandover(prev => ({ ...prev, followUpRequired: e.target.checked }))}
                />
                <label htmlFor="followUp" className="text-sm">Requires follow-up action</label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSubmitHandover} className="flex-1">
                  <Send className="h-4 w-4 mr-2" />
                  Submit Handover Note
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {shiftSummaries.map((summary, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {summary.staff.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{summary.staff}</h3>
                      <div className="text-sm text-muted-foreground">
                        {summary.date.toLocaleDateString()} • {summary.shift} shift
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {summary.shift} Shift
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{summary.checkIns}</div>
                    <div className="text-xs text-muted-foreground">Check-ins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{summary.checkOuts}</div>
                    <div className="text-xs text-muted-foreground">Check-outs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-600">{summary.issues}</div>
                    <div className="text-xs text-muted-foreground">Issues</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">₦{(summary.revenue / 1000).toFixed(0)}K</div>
                    <div className="text-xs text-muted-foreground">Revenue</div>
                  </div>
                </div>

                <Separator className="my-3" />
                
                <div>
                  <h4 className="font-medium text-sm mb-2">Shift Notes:</h4>
                  <p className="text-sm text-muted-foreground">{summary.notes}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};