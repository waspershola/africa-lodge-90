// Utility function to create test users via edge function
// Run this in browser console: window.createTestUsers()

export const createTestUsers = async () => {
  const baseUrl = 'https://dxisnnjsbuuiunjmzzqj.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4aXNubmpzYnV1aXVuam16enFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODg2MDMsImV4cCI6MjA3Mzg2NDYwM30.nmuC7AAV-6PMpIPvOed28P0SAlL04PIUNibaq4OogU8';

  const users = [
    {
      email: 'wasperstore@gmail.com',
      password: 'TempPassword123!',
      name: 'Super Admin',
      role: 'SUPER_ADMIN'
    },
    {
      email: 'owner@luxuryhotel.com',
      password: 'TempPassword123!',
      name: 'Hotel Owner',
      role: 'OWNER',
      tenant_id: '44444444-4444-4444-4444-444444444444'
    }
  ];

  console.log('🚀 Starting user creation...');

  for (const userData of users) {
    try {
      console.log(`Creating user: ${userData.email}`);
      
      const response = await fetch(`${baseUrl}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey
        },
        body: JSON.stringify(userData)
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ User ${userData.email} created successfully:`, result);
      } else {
        console.log(`❌ Failed to create user ${userData.email}:`, result);
      }
    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error);
    }
  }

  console.log('✨ User creation completed! You can now try logging in.');
};

// Make it available globally for browser console access
if (typeof window !== 'undefined') {
  (window as any).createTestUsers = createTestUsers;
}