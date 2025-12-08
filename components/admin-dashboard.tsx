"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type DashboardStats = {
  totalSessions: number;
  withMicroInteractions: number;
  withoutMicroInteractions: number;
  abandonmentRate: number;
  totalMessages: number;
  avgMessagesPerSession: number;
  avgSatisfaction: number;
  avgConfidence: number;
  totalVotes: number;
  upvotes: number;
  downvotes: number;
  upvoteRatio: number;
  suggestionClicks: number;
  typedMessages: number;
  suggestionRatio: number;
  sessionsPerDay: Array<{ date: string; withMicro: boolean; count: number }>;
};

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all");

  useEffect(() => {
    fetchStats();
  }, [dateFilter, conditionFilter]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (dateFilter !== "all") {
        const now = new Date();
        const days = parseInt(dateFilter);
        const dateFrom = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        params.append("dateFrom", dateFrom.toISOString());
      }
      
      if (conditionFilter !== "all") {
        params.append("withMicroInteractions", conditionFilter);
      }

      const res = await fetch(`/api/dashboard/stats?${params}`);
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">TCC Analytics Dashboard</h1>

      <div className="mb-6 flex gap-4">
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
          </SelectContent>
        </Select>

        <Select value={conditionFilter} onValueChange={setConditionFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Condition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sessions</SelectItem>
            <SelectItem value="true">With micro-interactions</SelectItem>
            <SelectItem value="false">Without micro-interactions</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              With: {stats.withMicroInteractions} | Without: {stats.withoutMicroInteractions}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Abandonment Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.abandonmentRate.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Avg Messages/Session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgMessagesPerSession.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Total: {stats.totalMessages}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Upvote Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upvoteRatio.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.upvotes} / {stats.totalVotes} votes
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Feedback Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Avg Satisfaction:</span>
                <span className="font-bold">{Number(stats.avgSatisfaction || 0).toFixed(1)}/5</span>
              </div>
              <div className="flex justify-between">
                <span>Avg Confidence:</span>
                <span className="font-bold">{Number(stats.avgConfidence || 0).toFixed(1)}/5</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">User Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Suggestion Clicks:</span>
                <span className="font-bold">{stats.suggestionClicks}</span>
              </div>
              <div className="flex justify-between">
                <span>Typed Messages:</span>
                <span className="font-bold">{stats.typedMessages}</span>
              </div>
              <div className="flex justify-between">
                <span>Suggestion Ratio:</span>
                <span className="font-bold">{stats.suggestionRatio.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Sessions Per Day</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.sessionsPerDay.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data available</p>
            ) : (
              stats.sessionsPerDay.map((day, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{day.date}</span>
                  <span>
                    {day.withMicro ? "With Micro" : "Without Micro"}: {day.count}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
