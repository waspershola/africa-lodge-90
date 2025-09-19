import { useState, useEffect } from 'react';
import { QRLanding } from './QRLanding';
import { QRServices } from './QRServices';
import { QRRequestTracking } from './QRRequestTracking';
import { QRFeedback } from './QRFeedback';
import { RoomServiceFlow } from './services/RoomServiceFlow';
import { HousekeepingFlow } from './services/HousekeepingFlow';
import { MaintenanceFlow } from './services/MaintenanceFlow';
import { WifiFlow } from './services/WifiFlow';
import { useQRSession } from '@/hooks/useQRSession';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';

export type QRStep = 
  | 'landing' 
  | 'services' 
  | 'room-service'
  | 'housekeeping' 
  | 'maintenance' 
  | 'wifi'
  | 'feedback'
  | 'tracking'
  | 'bill-preview';

export interface QRRequest {
  id: string;
  type: 'room-service' | 'housekeeping' | 'maintenance' | 'wifi' | 'feedback';
  status: 'pending' | 'assigned' | 'in-progress' | 'completed' | 'cancelled';
  title: string;
  details: any;
  created_at: string;
  updated_at: string;
  eta_minutes?: number;
  assigned_staff?: string;
}

export const QRPortal = () => {
  const [currentStep, setCurrentStep] = useState<QRStep>('landing');
  const [selectedRequest, setSelectedRequest] = useState<QRRequest | null>(null);
  
  const { 
    session, 
    hotelConfig, 
    requests, 
    isLoading,
    createRequest,
    updateRequest 
  } = useQRSession();
  
  const { isConnected } = useRealTimeUpdates(session?.id, requests);

  const handleServiceSelect = (service: string) => {
    setCurrentStep(service as QRStep);
  };

  const handleRequestCreate = async (type: string, data: any) => {
    const request = await createRequest(type, data);
    setCurrentStep('tracking');
    return request;
  };

  const handleBackToServices = () => {
    setCurrentStep('services');
  };

  const handleViewRequest = (request: QRRequest) => {
    setSelectedRequest(request);
    setCurrentStep('tracking');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading room services...</p>
        </div>
      </div>
    );
  }

  if (!session || !hotelConfig) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold">Invalid QR Code</h1>
          <p className="text-muted-foreground">
            This QR code is invalid or has expired. Please scan a valid QR code from your hotel room.
          </p>
        </div>
      </div>
    );
  }

  // Render different steps
  switch (currentStep) {
    case 'landing':
      return (
        <QRLanding
          session={session}
          hotelConfig={hotelConfig}
          requests={requests}
          onContinue={() => setCurrentStep('services')}
        />
      );

    case 'services':
      return (
        <QRServices
          session={session}
          hotelConfig={hotelConfig}
          requests={requests}
          onServiceSelect={handleServiceSelect}
          onViewRequest={handleViewRequest}
          isConnected={isConnected}
        />
      );

    case 'room-service':
      return (
        <RoomServiceFlow
          session={session}
          onBack={handleBackToServices}
          onRequestCreate={handleRequestCreate}
        />
      );

    case 'housekeeping':
      return (
        <HousekeepingFlow
          session={session}
          onBack={handleBackToServices}
          onRequestCreate={handleRequestCreate}
        />
      );

    case 'maintenance':
      return (
        <MaintenanceFlow
          session={session}
          onBack={handleBackToServices}
          onRequestCreate={handleRequestCreate}
        />
      );

    case 'wifi':
      return (
        <WifiFlow
          session={session}
          hotelConfig={hotelConfig}
          onBack={handleBackToServices}
        />
      );

    case 'feedback':
      return (
        <QRFeedback
          session={session}
          onBack={handleBackToServices}
          onSubmit={handleRequestCreate}
        />
      );

    case 'tracking':
      return (
        <QRRequestTracking
          session={session}
          requests={requests}
          selectedRequest={selectedRequest}
          onBack={handleBackToServices}
          onFeedback={(requestId) => {
            setSelectedRequest(requests.find(r => r.id === requestId) || null);
            setCurrentStep('feedback');
          }}
        />
      );

    default:
      return (
        <QRServices
          session={session}
          hotelConfig={hotelConfig}
          requests={requests}
          onServiceSelect={handleServiceSelect}
          onViewRequest={handleViewRequest}
          isConnected={isConnected}
        />
      );
  }
};