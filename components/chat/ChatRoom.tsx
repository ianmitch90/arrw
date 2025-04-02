import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { useUser } from '@/components/contexts/UserContext';
import { Message } from '@/types/chat.types';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Button
} from '@heroui/react';

const ChatRoom = ({ roomId }: { roomId: string }) => {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // Initialize Supabase client
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      setMessages((data as unknown as Message[]) || []);
    };

    fetchMessages();

    const messageSubscription = supabase
      .channel(`messages:room_id=eq.${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload: { new: Message }) => {
          setMessages((currentMessages) => [...currentMessages, payload.new]);
        }
      )
      .subscribe();

    return () => {
      messageSubscription.unsubscribe(); // Changed from removeSubscription to unsubscribe
    };
  }, [roomId]);

  const sendMessage = async () => {
    const { error } = await supabase.from('chat_messages').insert([
      {
        room_id: roomId,
        sender_id: user?.id,
        content: newMessage,
        message_type: 'text',
        created_at: new Date().toISOString()
      }
    ]);

    if (error) {
      console.error(error);
    } else {
      setNewMessage('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <h1>Chat Room</h1>
      </CardHeader>
      <CardBody>
        {messages.map((message) => (
          <div key={message.id}>
            <strong>{message.senderId}</strong>: {message.content}
          </div>
        ))}
        <Input
          fullWidth
          value={newMessage}
          onChange={(e: { target: { value: React.SetStateAction<string> } }) =>
            setNewMessage(e.target.value)
          }
          placeholder="Type a message"
        />
      </CardBody>
      <CardFooter>
        <Button onClick={sendMessage}>Send</Button>
      </CardFooter>
    </Card>
  );
};

export default ChatRoom;
