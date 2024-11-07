import { useEffect, useState } from 'react';
import { Progress } from '@nextui-org/react';
import { UsageTracker, UsageMetrics } from '@/utils/usage-tracking';

interface UsageDisplayProps {
  featureId: string;
}

export function UsageDisplay({ featureId }: UsageDisplayProps) {
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsageMetrics();
  }, [featureId]);

  const loadUsageMetrics = async () => {
    try {
      const data = await UsageTracker.getUsageMetrics(featureId);
      setMetrics(data);
    } catch (error) {
      console.error('Error loading usage metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading usage...</div>;
  if (!metrics) return null;

  const total = metrics.used + metrics.remaining;
  const percentage = (metrics.used / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{metrics.used} used</span>
        <span>{metrics.remaining} remaining</span>
      </div>
      <Progress
        value={percentage}
        color={
          percentage > 90 ? 'danger' : percentage > 70 ? 'warning' : 'primary'
        }
      />
      {metrics.resetDate && (
        <p className="text-xs text-gray-500">
          Resets on {metrics.resetDate.toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
