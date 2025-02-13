import { useState, useRef } from 'react';
import { Modal, ModalContent, Button, Input, Image } from '@heroui/react';
import { Camera, ImageIcon, MapPin, X } from 'lucide-react';
import { useSupabaseClient, SupabaseClient } from '@supabase/auth-helpers-react';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '@/types/supabase';
import { Coordinates } from '@/types/core';

/** Story type matching the database schema */
type Story = Database['public']['Tables']['stories']['Insert'];

interface StoryCreatorProps {
  /** Whether the story creator modal is open */
  isOpen: boolean;
  /** Callback when the modal is closed */
  onClose: () => void;
  /** Location where the story will be created */
  location: Coordinates;
}

/**
 * StoryCreator component allows users to create and upload stories
 * with images and location data
 */
export function StoryCreator({ isOpen, onClose, location }: StoryCreatorProps) {
  const supabase = useSupabaseClient<Database>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [radius, setRadius] = useState(10); // Default 10 mile radius

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if file is image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // TODO: Implement camera capture UI
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // 1. Upload image to storage
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `stories/${uuidv4()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('stories')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('stories')
        .getPublicUrl(filePath);

      // 3. Create thumbnail (you might want to implement proper image processing)
      const thumbnailUrl = publicUrl;

      // 4. Insert story record
      const { error: insertError } = await supabase
        .from('stories')
        .insert({
          content_type: 'image',
          content: publicUrl,
          thumbnail_url: thumbnailUrl,
          location: {
            type: 'Point',
            coordinates: [location.longitude, location.latitude],
            crs: {
              type: 'name',
              properties: {
                name: 'EPSG:4326'
              }
            }
          },
          radius,
          caption,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        } satisfies Story);

      if (insertError) throw insertError;

      onClose();
    } catch (error) {
      console.error('Error creating story:', error);
      alert('Failed to create story');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      classNames={{
        wrapper: 'p-0',
        base: 'h-screen m-0'
      }}
    >
      <ModalContent>
        <div className="h-full bg-background flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <Button
              isIconOnly
              variant="light"
              onPress={onClose}
            >
              <X />
            </Button>
            <h2 className="text-lg font-semibold">Create Story</h2>
            <Button
              color="primary"
              isLoading={isUploading}
              onPress={handleUpload}
              isDisabled={!selectedFile}
            >
              Share
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 flex flex-col gap-4">
            {preview ? (
              <div className="relative aspect-[9/16] bg-black rounded-lg overflow-hidden">
                <Image
                  src={preview}
                  alt="Story preview"
                  width={400}
                  height={300}
                  className="rounded-md"
                />
                <Button
                  isIconOnly
                  color="danger"
                  className="absolute top-2 right-2"
                  onPress={() => {
                    setSelectedFile(null);
                    setPreview(null);
                  }}
                >
                  <X />
                </Button>
              </div>
            ) : (
              <div className="flex gap-4">
                <Button
                  className="flex-1 h-32"
                  onPress={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-2">
                    <ImageIcon className="w-6 h-6" />
                    <span>Choose Photo</span>
                  </div>
                </Button>
                <Button
                  className="flex-1 h-32"
                  onPress={handleCapture}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Camera className="w-6 h-6" />
                    <span>Take Photo</span>
                  </div>
                </Button>
              </div>
            )}

            <input
              aria-label='File input'
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileSelect}
            />

            <Input
              label="Caption"
              placeholder="Write a caption..."
              value={caption}
              onValueChange={setCaption}
            />

            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <span className="text-sm">
                Visible within {radius} miles
              </span>
            </div>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
