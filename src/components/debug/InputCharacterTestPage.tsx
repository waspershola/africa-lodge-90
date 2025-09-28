import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandInput, CommandItem, CommandList, CommandEmpty, CommandGroup } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";

interface TestResult {
  component: string;
  testString: string;
  success: boolean;
  blockedChars: string[];
}

export const InputCharacterTestPage = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [textareaValue, setTextareaValue] = useState("");
  const [commandValue, setCommandValue] = useState("");

  // Test string containing all problematic characters
  const TEST_STRING = "abciouABCIOU123!@#$%^&*()_+-=[]{}|;':\",./<>?";
  const CRITICAL_CHARS = ['a', 'i', 'o', 'u', 'A', 'I', 'O', 'U'];

  const runCharacterTest = (componentName: string, inputString: string, originalString: string) => {
    const blockedChars: string[] = [];
    
    // Check each critical character
    CRITICAL_CHARS.forEach(char => {
      if (originalString.includes(char) && !inputString.includes(char)) {
        blockedChars.push(char);
      }
    });

    const result: TestResult = {
      component: componentName,
      testString: inputString,
      success: blockedChars.length === 0,
      blockedChars
    };

    setTestResults(prev => prev.filter(r => r.component !== componentName).concat(result));
  };

  const testAllInputs = () => {
    // Test regular input
    runCharacterTest("Standard Input", inputValue, TEST_STRING);
    
    // Test textarea
    runCharacterTest("Textarea", textareaValue, TEST_STRING);
    
    // Test command input
    runCharacterTest("Command Input", commandValue, TEST_STRING);
  };

  const clearTests = () => {
    setTestResults([]);
    setInputValue("");
    setTextareaValue("");
    setCommandValue("");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Input Character Testing Suite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Test Instructions */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">Testing Instructions:</h3>
            <p className="text-sm mb-2">
              1. Type or paste the test string: <code className="bg-gray-100 px-1 rounded">{TEST_STRING}</code>
            </p>
            <p className="text-sm mb-2">
              2. Critical characters to test: <code className="bg-gray-100 px-1 rounded">{CRITICAL_CHARS.join(', ')}</code>
            </p>
            <p className="text-sm">
              3. Click "Run Tests" to check if any characters are being blocked.
            </p>
          </div>

          {/* Test Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Standard Input Test */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Standard Input Field</label>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type or paste test string here..."
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Current: {inputValue.length} chars
              </p>
            </div>

            {/* Textarea Test */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Textarea Field</label>
              <Textarea
                value={textareaValue}
                onChange={(e) => setTextareaValue(e.target.value)}
                placeholder="Type or paste test string here..."
                className="w-full min-h-[80px]"
              />
              <p className="text-xs text-gray-500">
                Current: {textareaValue.length} chars
              </p>
            </div>

            {/* Command Input Test */}
            <div className="col-span-full space-y-2">
              <label className="text-sm font-medium">Command Input (Guest Search Style)</label>
              <Command className="border rounded-md">
                <CommandInput
                  value={commandValue}
                  onValueChange={setCommandValue}
                  placeholder="Type or paste test string here..."
                />
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem>Test Item 1</CommandItem>
                    <CommandItem>Test Item 2</CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
              <p className="text-xs text-gray-500">
                Current: {commandValue.length} chars
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={testAllInputs} className="flex-1">
              Run Character Tests
            </Button>
            <Button variant="outline" onClick={clearTests}>
              Clear All
            </Button>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Test Results:</h3>
              {testResults.map((result, index) => (
                <Card key={index} className={result.success ? "border-green-200" : "border-red-200"}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{result.component}</span>
                      <Badge variant={result.success ? "default" : "destructive"}>
                        {result.success ? "PASS" : "FAIL"}
                      </Badge>
                    </div>
                    
                    {!result.success && (
                      <div className="text-sm text-red-600 mb-2">
                        Blocked characters: <code className="bg-red-50 px-1 rounded">{result.blockedChars.join(', ')}</code>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      Received: <code className="bg-gray-50 px-1 rounded">{result.testString}</code>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Quick Fill Button for Testing */}
          <div className="pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setInputValue(TEST_STRING);
                setTextareaValue(TEST_STRING);
                setCommandValue(TEST_STRING);
              }}
              className="w-full"
            >
              Fill All Fields with Test String
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};