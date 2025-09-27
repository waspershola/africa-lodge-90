import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { 
  validateSMSTemplate, 
  extractPlaceholders, 
  getCharacterCountColor, 
  getSMSCountBadgeVariant, 
  formatSMSCountText,
  type ValidationResult 
} from "@/lib/sms-validation";

interface SMSTemplateFormProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  label?: string;
  description?: string;
}

export function SMSTemplateForm({ 
  value, 
  onChange, 
  placeholder = "Enter your SMS template with variables like {guest}, {hotel}, {room}",
  rows = 4,
  label = "Message Template",
  description = "Use {variable_name} for dynamic content. Variables will be detected automatically."
}: SMSTemplateFormProps) {
  const [validation, setValidation] = useState<ValidationResult>({
    characterCount: 0,
    estimatedSmsCount: 0,
    hasWarning: false,
    warningType: 'none',
    warningMessage: '',
    preview: ''
  });

  const [placeholders, setPlaceholders] = useState<string[]>([]);

  useEffect(() => {
    const validationResult = validateSMSTemplate(value);
    setValidation(validationResult);
    setPlaceholders(extractPlaceholders(value));
  }, [value]);

  const handleChange = (newValue: string) => {
    onChange(newValue);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="message_template">{label}</Label>
        <Textarea
          id="message_template"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
        />
        {description && (
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {/* Real-time Validation Display */}
      <Card className="border-l-4 border-l-primary/20">
        <CardContent className="pt-4">
          <div className="space-y-3">
            {/* Character Count and SMS Estimate */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {validation.warningType === 'exceeded' ? (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-success" />
                )}
                <span className={`text-sm font-medium ${getCharacterCountColor(validation)}`}>
                  {validation.warningMessage}
                </span>
              </div>
              <Badge variant={getSMSCountBadgeVariant(validation)}>
                {formatSMSCountText(validation)}
              </Badge>
            </div>

            {/* Preview with truncation applied */}
            {validation.preview && (
              <div>
                <Label className="text-xs">Preview with max placeholders:</Label>
                <div className="p-2 bg-muted rounded text-sm font-mono">
                  {validation.preview}
                </div>
              </div>
            )}

            {/* Detected Variables */}
            {placeholders.length > 0 && (
              <div>
                <Label className="text-xs">Detected Variables:</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {placeholders.map((placeholder, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {placeholder}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Cost Warning */}
            {validation.hasWarning && validation.warningType === 'exceeded' && (
              <div className="p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-xs text-destructive">
                  💰 This template will consume {validation.estimatedSmsCount} SMS credits per message sent. 
                  Consider shortening to reduce costs.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}