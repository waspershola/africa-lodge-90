import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { User, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface GuestReliabilityScoreProps {
  guestId: string;
  score: number;
  totalStays: number;
  successfulStays: number;
  noShowCount: number;
  lateArrivalCount: number;
  vipStatus: string;
}

export const GuestReliabilityScore: React.FC<GuestReliabilityScoreProps> = ({
  score,
  totalStays,
  successfulStays,
  noShowCount,
  lateArrivalCount,
  vipStatus
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getVipBadgeColor = (status: string) => {
    switch (status) {
      case 'vip': return 'bg-purple-100 text-purple-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <User className="h-4 w-4" />
          Guest Reliability Score
        </CardTitle>
        <div className="flex gap-2">
          <Badge className={getVipBadgeColor(vipStatus)}>
            {vipStatus.toUpperCase()}
          </Badge>
          <Badge className={getScoreBadgeColor(score)}>
            {score}/100
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Reliability Score</span>
            <span className={`font-semibold ${getScoreColor(score)}`}>
              {score}%
            </span>
          </div>
          <Progress value={score} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <div>
              <p className="font-medium">{successfulStays}</p>
              <p className="text-muted-foreground">Successful Stays</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" />
            <div>
              <p className="font-medium">{totalStays}</p>
              <p className="text-muted-foreground">Total Bookings</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <div>
              <p className="font-medium">{noShowCount}</p>
              <p className="text-muted-foreground">No Shows</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-yellow-600" />
            <div>
              <p className="font-medium">{lateArrivalCount}</p>
              <p className="text-muted-foreground">Late Arrivals</p>
            </div>
          </div>
        </div>

        {score < 60 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-800">Low Reliability Score</p>
                <p className="text-red-700">
                  Consider requiring deposit or advance payment for this guest.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};