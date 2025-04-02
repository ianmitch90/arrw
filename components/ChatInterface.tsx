import { useState, useEffect, SetStateAction } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import ChatList from './ChatList';
import ChatRoom from './ChatRoom';
import { Button, Input, Card, Select, SelectItem } from '@heroui/react';

interface ChatInterfaceProps {
  userId: string;
}

export default function ChatInterface({ userId }: ChatInterfaceProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState<'direct' | 'group'>('group');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<
    Array<{ id: string; fullName: string }>
  >([]);

  // Initialize Supabase client
  const supabase = createClientComponentClient<Database>();

  // Fetch available users for creating new chats
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .neq('id', userId);

      if (error) {
        console.error('Error fetching users:', error);
      } else if (data) {
        setAvailableUsers(
          data.map((user) => ({
            id: user.id,
            fullName: user.full_name ?? ''
          }))
        );
      }
    };

    fetchUsers();
  }, [userId]);

  // Handle room selection
  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
  };

  // Create a new chat room
  const createRoom = async () => {
    if (newRoomType === 'direct' && selectedUsers.length !== 1) {
      alert('Please select exactly one user for direct chat');
      return;
    }

    if (
      newRoomType === 'group' &&
      (!newRoomName || selectedUsers.length === 0)
    ) {
      alert('Please provide a room name and select at least one user');
      return;
    }

    try {
      // Create the room
      const { data: roomData, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          type: newRoomType,
          name: newRoomType === 'direct' ? null : newRoomName,
          created_by: userId
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add current user as participant with owner role
      const { error: ownerError } = await supabase
        .from('chat_participants')
        .insert({
          room_id: roomData.id,
          user_id: userId,
          role: 'owner'
        });

      if (ownerError) throw ownerError;

      // Add selected users as participants
      const participantInserts = selectedUsers.map((selectedUserId) => ({
        room_id: roomData.id,
        user_id: selectedUserId,
        role: 'member'
      }));

      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert(participantInserts);

      if (participantsError) throw participantsError;

      // Reset form and select the new room
      setNewRoomName('');
      setSelectedUsers([]);
      setIsCreatingRoom(false);
      setSelectedRoomId(roomData.id);
    } catch (error) {
      console.error('Error creating chat room:', error);
      alert('Failed to create chat room');
    }
  };

  // Toggle user selection for new chat
  const toggleUserSelection = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  return (
    <div className="chat-interface">
      <div className="chat-sidebar">
        <div className="chat-actions">
          <Button
            onClick={() => setIsCreatingRoom(!isCreatingRoom)}
            className="new-chat-button"
          >
            {isCreatingRoom ? 'Cancel' : 'New Chat'}
          </Button>
        </div>

        {isCreatingRoom ? (
          <Card className="create-chat-form">
            <h3>Create New Chat</h3>

            <div className="form-group">
              <label>Chat Type</label>
              <Select
                value={newRoomType}
                onChange={(e: { target: { value: string } }) => {
                  const value = e.target.value as 'direct' | 'group';
                  setNewRoomType(value);
                }}
              >
                <SelectItem key="direct">Direct Message</SelectItem>
                <SelectItem key="group">Group Chat</SelectItem>
              </Select>
            </div>

            {newRoomType === 'group' && (
              <div className="form-group">
                <label>Group Name</label>
                <Input
                  type="text"
                  value={newRoomName}
                  onChange={(e: {
                    target: { value: SetStateAction<string> };
                  }) => setNewRoomName(e.target.value)}
                  placeholder="Enter group name"
                />
              </div>
            )}

            <div className="form-group">
              <label>
                Select {newRoomType === 'direct' ? 'User' : 'Users'}
              </label>
              <div className="user-selection-list">
                {availableUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`user-selection-item ${selectedUsers.includes(user.id) ? 'selected' : ''}`}
                    onClick={() => toggleUserSelection(user.id)}
                  >
                    <span>{user.fullName}</span>
                    {selectedUsers.includes(user.id) && (
                      <span className="checkmark">✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={createRoom} className="create-room-button">
              Create Chat
            </Button>
          </Card>
        ) : (
          <ChatList userId={userId} onSelectRoom={handleSelectRoom} />
        )}
      </div>

      <div className="chat-main">
        {selectedRoomId ? (
          <ChatRoom roomId={selectedRoomId} userId={userId} />
        ) : (
          <Card className="no-chat-selected">
            <p>Select a chat or create a new one to start messaging</p>
          </Card>
        )}
      </div>
    </div>
  );
}
