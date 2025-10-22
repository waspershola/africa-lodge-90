import React, { useState } from 'react';
import { MessageCircle, Star, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUnifiedQR } from '@/hooks/useUnifiedQR';

interface FeedbackServiceProps {
  qrToken: string;
  sessionToken: string;
}

export default function FeedbackService({ qrToken, sessionToken }: FeedbackServiceProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { createRequest } = useUnifiedQR();

  const submitFeedback = async () => {
    if (rating === 0) {
      alert('Please provide a rating');
      return;
    }

    setSubmitting(true);
    try {
      await createRequest.mutateAsync({
        sessionId: sessionToken,
        requestType: 'feedback',
        requestData: {
          rating: rating,
          comment: comment,
          notes: `Guest feedback: ${rating}/5 stars${comment ? ` - ${comment}` : ''}`
        },
        priority: 'low'
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again or contact the front desk.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Thank You for Your Feedback!</h3>
          <p className="text-muted-foreground">
            Your review helps us improve our service. We appreciate your time and input.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Share Your Experience
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <label className="text-sm font-medium">How would you rate your stay?</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 hover:text-yellow-400'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Comments (Optional)</label>
            <Textarea
              placeholder="Tell us about your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          <Alert>
            <AlertDescription>
              Your feedback is valuable to us and helps us provide better service to all guests.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Button 
        onClick={submitFeedback}
        disabled={submitting || rating === 0}
        className="w-full"
        size="lg"
      >
        {submitting ? 'Submitting Feedback...' : 'Submit Feedback'}
      </Button>
    </div>
  );
}