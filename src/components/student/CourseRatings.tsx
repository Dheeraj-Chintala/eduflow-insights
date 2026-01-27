import { useEffect, useState } from 'react';
import { Star, Edit2, Trash2, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { fromTable } from '@/lib/supabase-helpers';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import type { CourseRating, Profile } from '@/types/database';

interface RatingWithAuthor extends CourseRating {
  author?: Profile;
}

interface CourseRatingsProps {
  courseId: string;
}

export function CourseRatings({ courseId }: CourseRatingsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ratings, setRatings] = useState<RatingWithAuthor[]>([]);
  const [userRating, setUserRating] = useState<CourseRating | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchRatings();
  }, [courseId, user]);

  const fetchRatings = async () => {
    try {
      const { data } = await fromTable('course_ratings')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (data) {
        const ratingsList = data as CourseRating[];
        
        // Find user's rating
        const myRating = user ? ratingsList.find(r => r.user_id === user.id) : null;
        if (myRating) {
          setUserRating(myRating);
          setSelectedRating(myRating.rating);
          setReview(myRating.review || '');
        }

        // Fetch authors
        const userIds = [...new Set(ratingsList.map(r => r.user_id))];
        const { data: profiles } = await fromTable('profiles')
          .select('*')
          .in('user_id', userIds);

        const profileMap = new Map((profiles as Profile[] || []).map(p => [p.user_id, p]));
        
        const ratingsWithAuthors = ratingsList.map(rating => ({
          ...rating,
          author: profileMap.get(rating.user_id),
        }));

        setRatings(ratingsWithAuthors);
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!user || selectedRating === 0) return;

    setIsSubmitting(true);
    try {
      if (userRating) {
        // Update existing rating
        const { error } = await fromTable('course_ratings')
          .update({
            rating: selectedRating,
            review: review.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userRating.id);

        if (error) throw error;

        toast({
          title: 'Rating updated',
          description: 'Your review has been updated.',
        });
      } else {
        // Create new rating
        const { error } = await fromTable('course_ratings')
          .insert({
            course_id: courseId,
            user_id: user.id,
            rating: selectedRating,
            review: review.trim() || null,
          });

        if (error) throw error;

        toast({
          title: 'Rating submitted',
          description: 'Thank you for your feedback!',
        });
      }

      setIsEditing(false);
      fetchRatings();
    } catch (error: any) {
      if (error.code === '23505') {
        toast({
          title: 'Already rated',
          description: 'You have already rated this course.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to submit rating. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRating = async () => {
    if (!userRating) return;

    try {
      const { error } = await fromTable('course_ratings')
        .delete()
        .eq('id', userRating.id);

      if (error) throw error;

      toast({
        title: 'Rating deleted',
        description: 'Your review has been removed.',
      });

      setUserRating(null);
      setSelectedRating(0);
      setReview('');
      fetchRatings();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete rating.',
        variant: 'destructive',
      });
    }
  };

  const averageRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5" />
            Ratings & Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Star className="h-5 w-5 text-warning" />
          Ratings & Reviews
        </CardTitle>
        <CardDescription>
          {ratings.length > 0 ? (
            <span className="flex items-center gap-2">
              <span className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${star <= Math.round(averageRating) ? 'text-warning fill-warning' : 'text-muted-foreground'}`}
                  />
                ))}
              </span>
              <span>{averageRating.toFixed(1)} ({ratings.length} review{ratings.length !== 1 ? 's' : ''})</span>
            </span>
          ) : (
            'Be the first to review this course'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rating Form */}
        {user && (!userRating || isEditing) && (
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium">
              {userRating ? 'Update your review' : 'Rate this course'}
            </h4>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setSelectedRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-8 w-8 ${star <= selectedRating ? 'text-warning fill-warning' : 'text-muted-foreground'}`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Share your experience with this course (optional)"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={3}
            />
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSubmitRating}
                disabled={isSubmitting || selectedRating === 0}
                className="bg-gradient-primary hover:opacity-90"
              >
                {isSubmitting ? 'Submitting...' : userRating ? 'Update Review' : 'Submit Review'}
              </Button>
              {isEditing && (
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}

        {/* User's Rating Display */}
        {userRating && !isEditing && (
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Your Review</span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleDeleteRating}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${star <= userRating.rating ? 'text-warning fill-warning' : 'text-muted-foreground'}`}
                />
              ))}
            </div>
            {userRating.review && (
              <p className="text-sm text-muted-foreground">{userRating.review}</p>
            )}
          </div>
        )}

        {/* Other Reviews */}
        {ratings.filter(r => r.user_id !== user?.id).length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Recent Reviews</h4>
            {ratings.filter(r => r.user_id !== user?.id).slice(0, 5).map((rating) => (
              <div key={rating.id} className="p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={rating.author?.avatar_url || ''} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">
                        {rating.author?.full_name || 'Anonymous'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(rating.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3 w-3 ${star <= rating.rating ? 'text-warning fill-warning' : 'text-muted-foreground'}`}
                        />
                      ))}
                    </div>
                    {rating.review && (
                      <p className="text-sm text-muted-foreground">{rating.review}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
