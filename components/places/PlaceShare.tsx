import { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/types/supabase';
import { Button, Card, Popover, PopoverTrigger, PopoverContent } from '@nextui-org/react';
import { Share2, MessageSquare, Copy, Check } from 'lucide-react';
import { useRouter } from 'next/router';

interface PlaceShareProps {
  placeId: string;
  placeName: string;
}

export function PlaceShare({ placeId, placeName }: PlaceShareProps) {
  const supabase = useSupabaseClient<Database>();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const placeUrl = `${window.location.origin}/places/${placeId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(placeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShareInChat = async (userId: string) => {
    try {
      // Get or create chat room
      const { data: room, error: roomError } = await supabase.rpc('get_or_create_direct_chat', {
        other_user_id: userId
      });

      if (roomError) throw roomError;

      // Send place share message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_room_id: room.id,
          content: `Check out this place: ${placeName}`,
          metadata: {
            type: 'place_share',
            place_id: placeId
          }
        });

      if (messageError) throw messageError;

      // Navigate to chat
      router.push(`/chat/${room.id}`);
    } catch (err) {
      console.error('Error sharing place:', err);
      setError(err instanceof Error ? err.message : 'Failed to share place');
    }
  };

  return (
    <Popover
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      placement="bottom"
    >
      <PopoverTrigger>
        <Button
          isIconOnly
          variant="light"
          onPress={() => setIsOpen(true)}
        >
          <Share2 className="w-5 h-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Card className="p-3">
          <div className="space-y-3">
            <h4 className="font-medium">Share Place</h4>

            {/* Copy Link */}
            <Button
              variant="flat"
              startContent={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              className="w-full"
              onPress={handleCopyLink}
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>

            {/* Share in Chat */}
            <Button
              variant="flat"
              startContent={<MessageSquare className="w-4 h-4" />}
              className="w-full"
              onPress={() => {
                setIsOpen(false);
                router.push({
                  pathname: '/chat',
                  query: {
                    share: 'place',
                    placeId,
                    placeName
                  }
                });
              }}
            >
              Share in Chat
            </Button>

            {error && (
              <p className="text-danger text-sm">{error}</p>
            )}
          </div>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
