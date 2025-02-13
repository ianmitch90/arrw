import { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/types/supabase';
import { PlaceComment } from '@/types/core';
import { Avatar, Button, Card, Textarea } from '@heroui/react';
import { Rating } from '@smastrom/react-rating';
import '@smastrom/react-rating/style.css';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Star } from 'lucide-react';

interface PlaceCommentsProps {
  placeId: string;
}

export function PlaceComments({ placeId }: PlaceCommentsProps) {
  const supabase = useSupabaseClient<Database>();
  const [comments, setComments] = useState<PlaceComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchComments();
  }, [placeId]);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('place_comments')
      .select(`
        *,
        user:users (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('place_id', placeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
    } else {
      setComments(data || []);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError('');

      if (!newComment.trim() && !newRating) {
        throw new Error('Please add a comment or rating');
      }

      const { error: commentError } = await supabase
        .from('place_comments')
        .insert({
          place_id: placeId,
          content: newComment.trim(),
          rating: newRating || null
        });

      if (commentError) throw commentError;

      setNewComment('');
      setNewRating(0);
      fetchComments();
    } catch (err) {
      console.error('Error posting comment:', err);
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Comment Form */}
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            <h3 className="font-medium">Add Your Review</h3>
          </div>

          <div className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            <Rating
              value={newRating}
              onChange={setNewRating}
              style={{ maxWidth: 150 }}
            />
          </div>

          <Textarea
            placeholder="Share your experience..."
            value={newComment}
            onValueChange={setNewComment}
            minRows={2}
          />

          {error && (
            <p className="text-danger text-sm">{error}</p>
          )}

          <div className="flex justify-end">
            <Button
              color="primary"
              size="sm"
              onPress={handleSubmit}
              isLoading={isSubmitting}
            >
              Post Review
            </Button>
          </div>
        </div>
      </Card>

      {/* Comments List */}
      <div className="space-y-3">
        {comments.map((comment) => (
          <Card key={comment.id} className="p-3">
            <div className="flex gap-3">
              <Avatar
                src={comment.user?.avatar_url}
                name={comment.user?.full_name || 'Anonymous User'}
                size="sm"
                fallback={
                  <div className="w-8 h-8 bg-default-200 rounded-full flex items-center justify-center">
                    <span className="text-sm">?</span>
                  </div>
                }
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {comment.user?.full_name || 'Anonymous User'}
                  </span>
                  <span className="text-sm text-default-500">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                </div>
                {comment.rating && (
                  <Rating
                    value={comment.rating}
                    readOnly
                    style={{ maxWidth: 100 }}
                    className="mt-1"
                  />
                )}
                <p className="mt-1 text-sm">
                  {comment.content}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
