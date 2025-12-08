"use client"

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { ChartSkeleton } from '@/components/skeletons'

// Lazy load the charts component
const DashboardChartsContent = dynamic(
    () => import('./dashboard-charts-content'),
    {
        loading: () => <ChartSkeleton />,
        ssr: false
    }
)

export function DashboardCharts() {
    return (
        <Suspense fallback={<ChartSkeleton />}>
            <DashboardChartsContent />
        </Suspense>
    )
}
