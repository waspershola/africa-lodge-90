import { SystemOwnerRecoveryCard } from './SystemOwnerRecoveryCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users } from 'lucide-react';

const SYSTEM_OWNERS = [
  {
    email: 'wasperstore@gmail.com',
    name: 'Wasper Store Admin',
    role: 'Super Admin',
    description: 'Primary system administrator with full platform access'
  },
  {
    email: 'info@waspersolution.com',  
    name: 'Wasiu',
    role: 'Super Admin',
    description: 'Chief Executive Officer with executive privileges'
  },
  {
    email: 'sholawasiu@gmail.com',
    name: 'Shola',
    role: 'Super Admin', 
    description: 'System owner with administrative capabilities'
  }
];

export function SystemOwnerManagement() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            System Owner Management
          </CardTitle>
          <CardDescription>
            Configure recovery settings for system owners. Set backup email addresses and phone numbers for emergency access.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SYSTEM_OWNERS.map((owner) => (
          <SystemOwnerRecoveryCard
            key={owner.email}
            owner={owner}
          />
        ))}
      </div>
    </div>
  );
}