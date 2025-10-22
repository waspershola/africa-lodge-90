import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { runCompleteTest, TestResult } from "@/utils/qrSystemTest";
import { CheckCircle, XCircle, Loader2, PlayCircle, AlertTriangle } from "lucide-react";

export function QRSystemTest() {
  const [qrToken, setQrToken] = useState("");
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [progress, setProgress] = useState(0);

  const handleTest = async () => {
    if (!qrToken.trim()) {
      alert("Please enter a QR token to test");
      return;
    }

    setTesting(true);
    setResults([]);
    setProgress(0);

    try {
      const testResults = await runCompleteTest(qrToken);
      setResults(testResults);
      setProgress(100);
    } catch (error) {
      console.error("Test error:", error);
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    if (success) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            QR System Test Suite
          </CardTitle>
          <CardDescription>
            Run comprehensive tests on the QR-to-SMS system to verify all components are working
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> This test will create a real session and request. Use a test QR code to avoid cluttering production data.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="qr-token">QR Token to Test</Label>
            <Input
              id="qr-token"
              placeholder="Enter QR token (e.g., QR_ROOM_101_SERVICE)"
              value={qrToken}
              onChange={(e) => setQrToken(e.target.value)}
              disabled={testing}
            />
            <p className="text-xs text-muted-foreground">
              You can find QR tokens in the QR Management section
            </p>
          </div>

          <Button
            onClick={handleTest}
            disabled={testing || !qrToken.trim()}
            className="w-full"
            size="lg"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4 mr-2" />
                Run Complete Test
              </>
            )}
          </Button>

          {testing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Testing...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              <div className="flex gap-4 mt-2">
                <Badge variant="default" className="bg-green-500">
                  {successCount} Passed
                </Badge>
                <Badge variant="destructive">
                  {failCount} Failed
                </Badge>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {getStatusIcon(result.success)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{result.step}</h3>
                      <Badge variant={result.success ? "default" : "destructive"}>
                        {result.success ? "PASS" : "FAIL"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {result.message}
                    </p>
                    {result.error && (
                      <div className="text-xs text-destructive bg-white p-2 rounded border border-red-200">
                        <strong>Error:</strong> {result.error}
                      </div>
                    )}
                    {result.data && (
                      <details className="text-xs mt-2">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          View Details
                        </summary>
                        <pre className="mt-2 p-2 bg-white rounded border overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {failCount === 0 && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription>
                  <strong>All tests passed!</strong> Your QR system is fully operational.
                </AlertDescription>
              </Alert>
            )}

            {failCount > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{failCount} test(s) failed.</strong> Please review the errors above and check the QR System Guide for troubleshooting steps.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>What This Test Checks</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm list-decimal list-inside">
            <li><strong>QR Generation:</strong> Verifies the QR code exists and is active</li>
            <li><strong>Session Creation:</strong> Tests guest session creation with device info</li>
            <li><strong>Request Creation:</strong> Validates request submission flow</li>
            <li><strong>SMS Template:</strong> Checks if templates are configured for notifications</li>
            <li><strong>SMS Provider:</strong> Verifies at least one healthy SMS provider is available</li>
            <li><strong>SMS Credits:</strong> Confirms sufficient credits for sending messages</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
