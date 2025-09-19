import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, User, UserCheck } from 'lucide-react';

interface User {
  email: string;
  password: string;
  name: string;
  role: 'SUPER_ADMIN' | 'OWNER';
  tenant_id?: string;
}

const INITIAL_USERS: User[] = [
  {
    email: 'wasperstore@gmail.com',
    password: 'TempPassword123!',
    name: 'Abdulwasiu O. Suleiman',
    role: 'SUPER_ADMIN'
  },
  {
    email: 'owner@luxuryhotel.com',
    password: 'TempPassword123!',
    name: 'First Hotel Owner',
    role: 'OWNER',
    tenant_id: '44444444-4444-4444-4444-444444444444' // Demo tenant ID
  }
];

export function InitialUserCreator() {
  const [creating, setCreating] = useState(false);
  const [createdUsers, setCreatedUsers] = useState<string[]>([]);
  const { toast } = useToast();

  const createUser = async (user: User) => {
    try {
      console.log('Creating user:', user.email);
      
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: user.email,
          password: user.password,
          name: user.name,
          role: user.role,
          tenant_id: user.tenant_id
        }
      });

      if (error) {
        console.error('Function error:', error);
        throw new Error(error.message || 'Failed to create user');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to create user');
      }

      console.log('User created successfully:', data);
      return data.user;
    } catch (error: any) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  const createAllUsers = async () => {
    setCreating(true);
    const created: string[] = [];

    try {
      for (const user of INITIAL_USERS) {
        // Skip if already created
        if (createdUsers.includes(user.email)) {
          console.log(`Skipping ${user.email} - already created`);
          continue;
        }

        try {
          const createdUser = await createUser(user);
          created.push(user.email);
          
          toast({
            title: 'User Created',
            description: `Successfully created ${user.email}`,
          });

          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error: any) {
          console.error(`Failed to create ${user.email}:`, error);
          toast({
            title: 'Error Creating User',
            description: `Failed to create ${user.email}: ${error.message}`,
            variant: 'destructive',
          });
          // Continue with other users even if one fails
        }
      }

      setCreatedUsers(prev => [...new Set([...prev, ...created])]);

      if (created.length > 0) {
        toast({
          title: 'Users Created Successfully',
          description: `Created ${created.length} user(s). You can now log in with these accounts.`,
        });
      }

    } catch (error: any) {
      console.error('Error in createAllUsers:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create users',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Initial User Setup
        </CardTitle>
        <CardDescription>
          Create the initial system users to complete Phase 2 backend integration.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {INITIAL_USERS.map((user) => (
            <div key={user.email} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
                <div className="text-xs text-muted-foreground">Role: {user.role}</div>
              </div>
              <div className="flex items-center">
                {createdUsers.includes(user.email) ? (
                  <UserCheck className="h-5 w-5 text-green-600" />
                ) : (
                  <User className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4">
          <Button 
            onClick={createAllUsers} 
            disabled={creating || createdUsers.length === INITIAL_USERS.length}
            className="w-full"
          >
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Users...
              </>
            ) : createdUsers.length === INITIAL_USERS.length ? (
              <>
                <UserCheck className="mr-2 h-4 w-4" />
                All Users Created
              </>
            ) : (
              <>
                <User className="mr-2 h-4 w-4" />
                Create Initial Users
              </>
            )}
          </Button>
        </div>

        {createdUsers.length > 0 && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Login Credentials</h4>
            <div className="space-y-2 text-sm">
              {INITIAL_USERS.filter(u => createdUsers.includes(u.email)).map((user) => (
                <div key={user.email} className="text-green-700">
                  <strong>{user.email}</strong> / Password: <code className="bg-green-100 px-1 rounded">TempPassword123!</code>
                </div>
              ))}
            </div>
            <p className="text-xs text-green-600 mt-2">
              Please change passwords after first login for security.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}