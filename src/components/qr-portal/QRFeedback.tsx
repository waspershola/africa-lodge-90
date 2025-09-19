import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft,
  Star,
  Send
} from 'lucide-react';
import { QRSession } from '@/hooks/useQRSession';

interface QRFeedbackProps {
  session: QRSession;
  onBack: () => void;
  onSubmit: (type: string, data: any) => void;
}

export const QRFeedback = ({ session, onBack, onSubmit }: QRFeedbackProps) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;

    setIsSubmitting(true);
    
    try {
      await onSubmit('feedback', {
        title: `Room ${session.room_id} Feedback`,
        rating,
        comment,
        room_id: session.room_id,
        hotel_id: session.hotel_id
      });
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="h-16 w-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <Star className="h-8 w-8 text-green-600 fill-current" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Thank You!</h1>
          <p className="text-muted-foreground mb-6">
            Your feedback has been submitted successfully. We appreciate you taking the time to share your experience.
          </p>
          <Button onClick={onBack} className="w-full">
            Back to Services
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="p-4">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="font-semibold">Share Feedback</h1>
            <div></div>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>How was your experience?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Star Rating */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Rate your overall experience
              </p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 rounded transition-colors hover:bg-muted"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= rating
                          ? 'text-yellow-500 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium">
                    {rating === 1 && 'Poor'}
                    {rating === 2 && 'Fair'}
                    {rating === 3 && 'Good'}
                    {rating === 4 && 'Very Good'}
                    {rating === 5 && 'Excellent'}
                  </p>
                </div>
              )}
            </div>

            {/* Written Feedback */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Additional Comments (Optional)
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us more about your experience..."
                rows={4}
              />
            </div>

            {/* Quick Feedback Options */}
            <div>
              <p className="text-sm font-medium mb-3">Quick feedback:</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Excellent service',
                  'Very clean room',
                  'Friendly staff',
                  'Great location',
                  'Good value',
                  'Would recommend'
                ].map((option) => (
                  <Button
                    key={option}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (comment.includes(option)) {
                        setComment(comment.replace(option + ', ', '').replace(option, ''));
                      } else {
                        setComment(comment ? `${comment}, ${option}` : option);
                      }
                    }}
                    className={comment.includes(option) ? 'bg-primary text-primary-foreground' : ''}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Feedback
                </>
              )}
            </Button>

            {rating === 0 && (
              <p className="text-sm text-muted-foreground text-center">
                Please select a rating to submit your feedback
              </p>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mt-4">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Need immediate assistance?</h3>
            <p className="text-sm text-muted-foreground mb-3">
              For urgent matters, please contact the front desk directly.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Front Desk:</span>
              <span className="text-primary">Dial 0 from room phone</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};