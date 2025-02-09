import { useSearchParams } from 'next/navigation';
import { MobileDrawer } from './MobileDrawer';
import { OverlayContent } from './OverlayContent';

export function ResponsiveOverlay() {
  const searchParams = useSearchParams();
  const chatType = searchParams?.get('chat') ?? null;
  const isOpen = !!chatType;

  if (!isOpen) return null;

  return (
    <MobileDrawer>
      <OverlayContent />
    </MobileDrawer>
  );
}
