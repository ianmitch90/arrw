import { useState, useEffect, SetStateAction } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { Message, ChatRoom } from '../types/chat';
import { toMessage } from '../types/chat';
import { Card, Input, Button } from '@heroui/react';

interface ChatProps {
  roomId: string;
  userId: string;
}

export default function Chat({ roomId, userId }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [room, setRoom] = useState<ChatRoom | null>(null);

  // Initialize Supabase client
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchRoom = async () => {
      const { data: roomData, error: roomError } = await supabase
        .from('chat_rooms')
        .select(
          `
          *,
          chat_participants (*)
        `
        )
        .eq('id', roomId)
        .single();

      if (roomError) {
        console.error('Error fetching room:', roomError);
      } else if (roomData) {
        setRoom(roomData);
      }
    };

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
      } else if (data) {
        setMessages(data.map((msg) => toMessage(msg)));
      }
    };

    fetchRoom();
    fetchMessages();

    // Create a channel for real-time updates
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          const newMessage = toMessage(payload.new);
          setMessages((current) => [...current, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const sendMessage = async () => {
    if (newMessage.trim() === '') return;

    const { error } = await supabase.from('chat_messages').insert({
      room_id: roomId,
      sender_id: userId,
      content: newMessage,
      message_type: 'text'
    });

    if (error) {
      console.error('Error sending message:', error);
    } else {
      setNewMessage('');
    }
  };

  return (
    <Card className="chat-container">
      <div className="messages-container">
        {messages.map((message) => (
          <Card key={message.id} className="message-item">
            <p className="message-content">{message.content}</p>
            <small className="message-timestamp">
              {message.createdAt.toLocaleString()}
            </small>
          </Card>
        ))}
      </div>
      <div className="message-input-container">
        <Input
          type="text"
          value={newMessage}
          onChange={(e: { target: { value: SetStateAction<string> } }) =>
            setNewMessage(e.target.value)
          }
          placeholder="Type your message here"
          className="message-input"
        />
        <Button onClick={sendMessage} className="send-button">
          Send
        </Button>
      </div>
    </Card>
  );
}
