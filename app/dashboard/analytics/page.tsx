import { AnalyticsCharts } from '@/components/features/analytics/analytics-charts';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
      </div>
      <AnalyticsCharts />
    </div>
  );
}
