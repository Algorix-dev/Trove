"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BadgesList } from "./badges-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock } from "lucide-react"

export function ProfileTabs() {
    return (
        <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="badges">Badges & Achievements</TabsTrigger>
                <TabsTrigger value="history">Reading History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
                <BadgesList />
            </TabsContent>

            <TabsContent value="badges">
                <BadgesList />
            </TabsContent>

            <TabsContent value="history">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground text-center py-8">
                            Reading history tracking coming soon.
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}
