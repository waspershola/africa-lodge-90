import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Key, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  Eye,
  EyeOff,
  Loader2 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  required: boolean;
}

interface RecoverySession {
  sessionToken: string;
  stepsCompleted: string[];
  requiredSteps: string[];
  expiresAt: string;
}

export function EmergencyAccessPortal() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [email, setEmail] = useState('');
  const [masterKey, setMasterKey] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [session, setSession] = useState<RecoverySession | null>(null);
  const [securityQuestion, setSecurityQuestion] = useState('');

  const steps: VerificationStep[] = [
    {
      id: 'email_verification',
      title: 'Email Verification',
      description: 'Confirm your platform owner email address',
      icon: <Shield className="h-5 w-5" />,
      completed: session?.stepsCompleted.includes('email_verification') || false,
      required: true
    },
    {
      id: 'master_key',
      title: 'Master Recovery Key',
      description: 'Enter the emergency master recovery key',
      icon: <Key className="h-5 w-5" />,
      completed: session?.stepsCompleted.includes('master_key') || false,
      required: true
    },
    {
      id: 'security_question',
      title: 'Security Question',
      description: 'Answer your pre-configured security question',
      icon: <AlertTriangle className="h-5 w-5" />,
      completed: session?.stepsCompleted.includes('security_question') || false,
      required: true
    },
    {
      id: 'password_reset',
      title: 'Password Reset',
      description: 'Set your new password',
      icon: <CheckCircle2 className="h-5 w-5" />,
      completed: false,
      required: true
    }
  ];

  useEffect(() => {
    // Add security headers and detection
    document.title = 'Emergency Access Portal - Luxury Hotel Pro';
  }, []);

  const handleEmailVerification = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.functions.invoke('emergency-access-verify', {
        body: {
          step: 'email_verification',
          email: email.trim(),
          userAgent: navigator.userAgent
        }
      });

      if (error) throw error;

      if (data.success) {
        setSession(data.session);
        setSecurityQuestion(data.securityQuestion);
        setCurrentStep(1);
      } else {
        setError(data.error || 'Email verification failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify email');
    } finally {
      setLoading(false);
    }
  };

  const handleMasterKeyVerification = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.functions.invoke('emergency-access-verify', {
        body: {
          step: 'master_key',
          sessionToken: session?.sessionToken,
          masterKey: masterKey.trim(),
          userAgent: navigator.userAgent
        }
      });

      if (error) throw error;

      if (data.success) {
        setSession(data.session);
        setCurrentStep(2);
      } else {
        setError(data.error || 'Master key verification failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify master key');
    } finally {
      setLoading(false);
    }
  };

  const handleSecurityQuestionVerification = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.functions.invoke('emergency-access-verify', {
        body: {
          step: 'security_question',
          sessionToken: session?.sessionToken,
          securityAnswer: securityAnswer.trim(),
          userAgent: navigator.userAgent
        }
      });

      if (error) throw error;

      if (data.success) {
        setSession(data.session);
        setCurrentStep(3);
      } else {
        setError(data.error || 'Security question verification failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify security answer');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.functions.invoke('emergency-access-reset-password', {
        body: {
          sessionToken: session?.sessionToken,
          newPassword: newPassword,
          userAgent: navigator.userAgent
        }
      });

      if (error) throw error;

      if (data.success) {
        setSuccess(true);
        // Redirect after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setError(data.error || 'Password reset failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    if (success) {
      return (
        <div className="text-center space-y-6">
          <CheckCircle2 className="h-16 w-16 text-success mx-auto" />
          <div>
            <h3 className="text-xl font-semibold text-success">Password Reset Complete</h3>
            <p className="text-muted-foreground mt-2">
              Your password has been successfully reset. You will be redirected to the login page.
            </p>
          </div>
        </div>
      );
    }

    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Platform Owner Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your platform owner email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button 
              onClick={handleEmailVerification}
              disabled={!email.trim() || loading}
              className="w-full"
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</>
              ) : (
                <>Verify Email<ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="masterKey">Master Recovery Key</Label>
              <Input
                id="masterKey"
                type="password"
                placeholder="Enter the master recovery key"
                value={masterKey}
                onChange={(e) => setMasterKey(e.target.value)}
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                This is the emergency master key stored securely in the system configuration.
              </p>
            </div>
            <Button 
              onClick={handleMasterKeyVerification}
              disabled={!masterKey.trim() || loading}
              className="w-full"
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</>
              ) : (
                <>Verify Master Key<ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="securityAnswer">Security Question</Label>
              <p className="text-sm font-medium">{securityQuestion}</p>
              <Input
                id="securityAnswer"
                type="text"
                placeholder="Enter your answer"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button 
              onClick={handleSecurityQuestionVerification}
              disabled={!securityAnswer.trim() || loading}
              className="w-full"
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</>
              ) : (
                <>Verify Answer<ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <Button 
              onClick={handlePasswordReset}
              disabled={!newPassword || !confirmPassword || newPassword !== confirmPassword || loading}
              className="w-full"
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Resetting Password...</>
              ) : (
                <>Reset Password<CheckCircle2 className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-8 w-8 text-destructive" />
            <CardTitle className="text-2xl text-destructive">Emergency Access Portal</CardTitle>
          </div>
          <CardDescription>
            Platform Owner Emergency Recovery System
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress Indicators */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center space-y-2">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 
                  ${step.completed 
                    ? 'bg-success border-success text-success-foreground' 
                    : currentStep === index 
                      ? 'border-primary text-primary bg-primary/10' 
                      : 'border-muted-foreground/30 text-muted-foreground'
                  }
                `}>
                  {step.completed ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    step.icon
                  )}
                </div>
                <Badge 
                  variant={step.completed ? 'default' : currentStep === index ? 'secondary' : 'outline'}
                  className="text-xs"
                >
                  {step.title}
                </Badge>
              </div>
            ))}
          </div>

          <Separator />

          {/* Security Warning */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This portal is for emergency access only. All access attempts are logged and monitored.
              Only proceed if you are the legitimate platform owner and have proper authorization.
            </AlertDescription>
          </Alert>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step Content */}
          <div className="min-h-[200px]">
            {renderStepContent()}
          </div>

          {/* Session Info */}
          {session && (
            <div className="text-center text-sm text-muted-foreground">
              Session expires: {new Date(session.expiresAt).toLocaleTimeString()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}