import { useCallback, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import type { Database } from '@/types/supabase';
import { Button, Card, Input, Textarea, Select, SelectItem } from '@nextui-org/react';
import { Coordinates, PlaceTag } from '@/types/core';
import { Upload } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface PlaceCreatorProps {
  location: Coordinates;
  onClose: () => void;
  onSuccess: () => void;
  proposalId?: string; 
  initialData?: {
    name: string;
    description: string;
    tags: PlaceTag[];
    photo_url?: string;
  };
}

const PLACE_TAGS: { value: PlaceTag; label: string }[] = [
  { value: 'park', label: 'Park' },
  { value: 'private', label: 'Private Property' },
  { value: 'garage', label: 'Garage/Parking' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'cafe', label: 'Cafe' },
  { value: 'shop', label: 'Shop' },
  { value: 'venue', label: 'Venue' },
  { value: 'other', label: 'Other' },
];

export function PlaceCreator({ 
  location, 
  onClose, 
  onSuccess, 
  proposalId,
  initialData 
}: PlaceCreatorProps) {
  const supabase = useSupabaseClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [selectedTags, setSelectedTags] = useState<PlaceTag[]>(initialData?.tags ?? []);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setPhotoFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1
  });

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError('');

      if (!name.trim()) {
        throw new Error('Name is required');
      }

      let photoUrl = initialData?.photo_url;

      // Upload photo if provided
      if (photoFile) {
        const photoExt = photoFile.name.split('.').pop();
        const photoPath = `place-proposals/${Date.now()}.${photoExt}`;

        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(photoPath, photoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(photoPath);

        photoUrl = publicUrl;
      }

      if (proposalId) {
        // Update existing proposal
        const { error: updateError } = await supabase
          .from('place_proposals')
          .update({
            name: name.trim(),
            description: description.trim(),
            location,
            tags: selectedTags,
            photo_url: photoUrl,
          })
          .eq('id', proposalId);

        if (updateError) throw updateError;
      } else {
        // Create new proposal
        const { error: proposalError } = await supabase
          .from('place_proposals')
          .insert({
            name: name.trim(),
            description: description.trim(),
            location,
            tags: selectedTags,
            photo_url: photoUrl,
            status: 'pending'
          });

        if (proposalError) throw proposalError;
      }

      onSuccess();
    } catch (err) {
      console.error('Error saving place:', err);
      setError(err instanceof Error ? err.message : 'Failed to save place');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!proposalId) return;
    
    try {
      setIsSubmitting(true);
      setError('');

      const { error: deleteError } = await supabase
        .from('place_proposals')
        .delete()
        .eq('id', proposalId);

      if (deleteError) throw deleteError;

      onSuccess();
    } catch (err) {
      console.error('Error deleting place proposal:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete place proposal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-4 w-full max-w-md">
      <h3 className="text-lg font-semibold mb-4">
        {proposalId ? 'Edit Place' : 'Create New Place'}
      </h3>

      <div className="space-y-4">
        <Input
          label="Name"
          placeholder="Enter place name"
          value={name}
          onValueChange={setName}
          isRequired
        />

        <Textarea
          label="Description"
          placeholder="Describe this place..."
          value={description}
          onValueChange={setDescription}
          minRows={3}
        />

        <Select
          label="Tags"
          placeholder="Select tags"
          selectedKeys={selectedTags}
          onSelectionChange={(keys) => setSelectedTags(Array.from(keys) as PlaceTag[])}
          selectionMode="multiple"
        >
          {PLACE_TAGS.map((tag) => (
            <SelectItem key={tag.value} value={tag.value}>
              {tag.label}
            </SelectItem>
          ))}
        </Select>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/10' : 'border-default-300 hover:border-primary'}`}
        >
          <input {...getInputProps()} />
          <Upload className="w-6 h-6 mx-auto mb-2" />
          {photoFile ? (
            <p className="text-sm">Selected: {photoFile.name}</p>
          ) : initialData?.photo_url ? (
            <div>
              <img
                src={initialData.photo_url}
                alt="Current photo"
                className="w-20 h-20 object-cover mx-auto mb-2 rounded-lg"
              />
              <p className="text-sm">Drop a new image to replace</p>
            </div>
          ) : (
            <p className="text-sm">Drop an image here or click to select</p>
          )}
        </div>

        {error && (
          <p className="text-danger text-sm">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          {proposalId && (
            <Button
              variant="flat"
              color="danger"
              onPress={handleDelete}
              isDisabled={isSubmitting}
            >
              Delete
            </Button>
          )}
          <Button
            variant="flat"
            color="default"
            onPress={onClose}
            isDisabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={isSubmitting}
          >
            {proposalId ? 'Save Changes' : 'Submit'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
