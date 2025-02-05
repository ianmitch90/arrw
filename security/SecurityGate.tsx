import { ReactNode } from 'react';
import { useSecurityContext } from '@/contexts/SecurityContext';
import { Card, CardBody, CardHeader } from '@nextui-org/react';

interface SecurityGateProps {
  children: ReactNode;
  requiredFeatureFlag: string;
  fallbackMessage?: string;
}

export function SecurityGate({ 
  children, 
  requiredFeatureFlag,
  fallbackMessage 
}: SecurityGateProps) {
  const security = useSecurityContext();
  const isAllowed = security.featureFlags[requiredFeatureFlag];

  if (!isAllowed) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader className="flex gap-3">
          <div className="flex flex-col">
            <p className="text-md">Access Restricted</p>
          </div>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-default-500">
            {fallbackMessage || getDefaultMessage(security, requiredFeatureFlag)}
          </p>
        </CardBody>
      </Card>
    );
  }

  return <>{children}</>;
}

function getDefaultMessage(security: ReturnType<typeof useSecurityContext>, featureFlag: string): string {
  // VPN/Location specific messages
  if (security.isUsingVPN) {
    return 'Please disable your VPN or proxy service to access this feature.';
  }
  
  if (!security.isLocationValid) {
    return security.locationErrorMessage || 'Unable to verify your location. Please enable location services and ensure high accuracy is enabled.';
  }

  // Moderation related messages
  if (security.isTimedOut) {
    const endTime = security.moderationEndTime;
    return `Your account is temporarily restricted until ${endTime?.toLocaleDateString()} ${endTime?.toLocaleTimeString()}.`;
  }

  // Premium features
  if (!security.isPremiumUser && featureFlag.includes('premium')) {
    return 'This feature is only available to premium subscribers.';
  }

  return 'You do not have access to this feature.';
}
