import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Keyboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface KeyboardShortcutsHelperProps {
  isVisible: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsHelper = ({ isVisible, onClose }: KeyboardShortcutsHelperProps) => {
  const shortcuts = [
    { key: 'A', action: 'Assign Room', description: 'Assign selected room to a guest' },
    { key: 'I', action: 'Check-In', description: 'Check-in guest to selected room' },
    { key: 'O', action: 'Check-Out', description: 'Check-out guest from selected room' },
    { key: 'M', action: 'Mark Available', description: 'Mark OOS room as available' },
    { key: 'Esc', action: 'Deselect', description: 'Deselect current room' },
    { key: '/', action: 'Quick Search', description: 'Focus on search field' },
    { key: '?', action: 'Help', description: 'Show/hide this shortcuts panel' },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed bottom-20 right-4 z-50"
        >
          <Card className="w-80 shadow-lg border bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Keyboard className="h-4 w-4" />
                  Keyboard Shortcuts
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onClose}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {shortcuts.map((shortcut) => (
                <div key={shortcut.key} className="flex items-center gap-3 text-sm">
                  <kbd className="bg-muted px-2 py-1 rounded text-xs font-mono min-w-[2rem] text-center">
                    {shortcut.key}
                  </kbd>
                  <div>
                    <div className="font-medium">{shortcut.action}</div>
                    <div className="text-xs text-muted-foreground">{shortcut.description}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};