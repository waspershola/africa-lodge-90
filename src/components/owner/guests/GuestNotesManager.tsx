import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  StickyNote, 
  Plus, 
  Save, 
  X, 
  AlertCircle, 
  Star, 
  Heart,
  Flag,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

interface GuestNotesManagerProps {
  guestId: string;
}

interface GuestNote {
  id: string;
  content: string;
  type: 'general' | 'preference' | 'alert' | 'vip';
  createdAt: Date;
  createdBy: string;
}

interface GuestPreference {
  id: string;
  category: string;
  preference: string;
}

export default function GuestNotesManager({ guestId }: GuestNotesManagerProps) {
  const [notes, setNotes] = useState<GuestNote[]>([
    {
      id: 'note-1',
      content: 'Prefers room on higher floors with city view',
      type: 'preference',
      createdAt: new Date('2024-01-15'),
      createdBy: 'John Manager'
    },
    {
      id: 'note-2',
      content: 'Allergic to nuts - inform restaurant',
      type: 'alert',
      createdAt: new Date('2024-01-10'),
      createdBy: 'Sarah Staff'
    }
  ]);

  const [preferences, setPreferences] = useState<GuestPreference[]>([
    { id: 'pref-1', category: 'Room', preference: 'High floor, city view' },
    { id: 'pref-2', category: 'Food', preference: 'Vegetarian meals' },
    { id: 'pref-3', category: 'Service', preference: 'Late checkout preferred' }
  ]);

  const [newNote, setNewNote] = useState('');
  const [newNoteType, setNewNoteType] = useState<GuestNote['type']>('general');
  const [showNewNote, setShowNewNote] = useState(false);
  const [newPreference, setNewPreference] = useState({ category: '', preference: '' });
  const [showNewPreference, setShowNewPreference] = useState(false);

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    
    const note: GuestNote = {
      id: `note-${Date.now()}`,
      content: newNote,
      type: newNoteType,
      createdAt: new Date(),
      createdBy: 'Current User'
    };
    
    setNotes([note, ...notes]);
    setNewNote('');
    setNewNoteType('general');
    setShowNewNote(false);
  };

  const handleAddPreference = () => {
    if (!newPreference.category.trim() || !newPreference.preference.trim()) return;
    
    const preference: GuestPreference = {
      id: `pref-${Date.now()}`,
      category: newPreference.category,
      preference: newPreference.preference
    };
    
    setPreferences([...preferences, preference]);
    setNewPreference({ category: '', preference: '' });
    setShowNewPreference(false);
  };

  const getNoteIcon = (type: GuestNote['type']) => {
    switch (type) {
      case 'alert': return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'vip': return <Star className="h-4 w-4 text-warning-foreground" />;
      case 'preference': return <Heart className="h-4 w-4 text-primary" />;
      default: return <StickyNote className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getNoteColor = (type: GuestNote['type']) => {
    switch (type) {
      case 'alert': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'vip': return 'bg-warning/10 text-warning-foreground border-warning/20';
      case 'preference': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-6">
      {/* Notes Section */}
      <Card className="luxury-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5" />
              Guest Notes
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowNewNote(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showNewNote && (
            <div className="border rounded-lg p-4 bg-card">
              <div className="space-y-3">
                <div>
                  <Label>Note Type</Label>
                  <Select value={newNoteType} onValueChange={(value: GuestNote['type']) => setNewNoteType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Note</SelectItem>
                      <SelectItem value="preference">Preference</SelectItem>
                      <SelectItem value="alert">Alert/Warning</SelectItem>
                      <SelectItem value="vip">VIP Note</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Note Content</Label>
                  <Textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Enter note content..."
                    className="min-h-20"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddNote} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Save Note
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewNote(false)} size="sm">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {notes.map((note) => (
            <div key={note.id} className="border rounded-lg p-4">
              <div className="flex items-start gap-3">
                {getNoteIcon(note.type)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getNoteColor(note.type)} variant="outline">
                      {note.type.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(note.createdAt, 'MMM dd, yyyy')} by {note.createdBy}
                    </span>
                  </div>
                  <p className="text-sm">{note.content}</p>
                </div>
              </div>
            </div>
          ))}

          {notes.length === 0 && !showNewNote && (
            <div className="text-center py-8 text-muted-foreground">
              <StickyNote className="h-12 w-12 mx-auto mb-4" />
              <div className="text-lg font-medium mb-2">No notes yet</div>
              <div className="text-sm">Add notes to track guest preferences and important information</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preferences Section */}
      <Card className="luxury-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Guest Preferences
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowNewPreference(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Preference
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showNewPreference && (
            <div className="border rounded-lg p-4 bg-card">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <Label>Category</Label>
                  <Input
                    value={newPreference.category}
                    onChange={(e) => setNewPreference({...newPreference, category: e.target.value})}
                    placeholder="e.g., Room, Food, Service"
                  />
                </div>
                <div>
                  <Label>Preference</Label>
                  <Input
                    value={newPreference.preference}
                    onChange={(e) => setNewPreference({...newPreference, preference: e.target.value})}
                    placeholder="e.g., High floor, No nuts"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddPreference} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save Preference
                </Button>
                <Button variant="outline" onClick={() => setShowNewPreference(false)} size="sm">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {preferences.map((pref) => (
              <div key={pref.id} className="border rounded-lg p-3">
                <div className="font-medium text-sm text-muted-foreground mb-1">{pref.category}</div>
                <div className="text-sm">{pref.preference}</div>
              </div>
            ))}
          </div>

          {preferences.length === 0 && !showNewPreference && (
            <div className="text-center py-8 text-muted-foreground">
              <Heart className="h-12 w-12 mx-auto mb-4" />
              <div className="text-lg font-medium mb-2">No preferences recorded</div>
              <div className="text-sm">Add guest preferences to provide personalized service</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}