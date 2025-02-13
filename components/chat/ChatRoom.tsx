import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useUser } from '@/components/contexts/UserContext';
import { Message } from '@/components/types';
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

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_room_id', roomId)
        .order('sent_at', { ascending: true });

      setMessages((data as Message[]) || []);
    };

    fetchMessages();

    const messageSubscription = supabase
      .channel(`messages:chat_room_id=eq.${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
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
    const { error } = await supabase.from('messages').insert([
      {
        chat_room_id: roomId,
        sender_id: user?.id,
        content: newMessage,
        sent_at: new Date().toISOString()
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
            <strong>{message.sender_id}</strong>: {message.content}
          </div>
        ))}
        <Input
          fullWidth
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
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
