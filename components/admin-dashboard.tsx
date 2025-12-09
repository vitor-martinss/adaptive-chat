"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type DashboardStats = {
  totalSessions: number;
  withMicroInteractions: number;
  withoutMicroInteractions: number;
  abandonmentRate: number;
  totalMessages: number;
  avgMessagesPerSession: number;
  avgSatisfaction: number;
  avgConfidence: number;
  completedSessions: number;
  redirectedSessions: number;
  skippedSessions: number;
  redirectRate: number;
  totalVotes: number;
  upvotes: number;
  downvotes: number;
  upvoteRatio: number;
  suggestionClicks: number;
  typedMessages: number;
  suggestionRatio: number;
  sessionsPerDay: Array<{ date: string; withMicro: boolean; count: number }>;
  dailyBreakdown: Array<{
    date: string;
    sessionsWith: number;
    sessionsWithout: number;
    totalSessions: number;
    totalMessages: number;
    avgMessagesPerSession: number;
    avgSessionDurationSec: number;
    upvoteRatio: number;
    suggestionRatio: number;
    avgSatisfaction: number;
    avgConfidence: number;
  }>;
  sessionDuration: {
    avgMs: number;
    medianMs: number;
    avgWithMicroMs: number;
    avgWithoutMicroMs: number;
    avgAbandonedMs: number;
  };
};

function formatDuration(ms: number): string {
  if (ms === 0) return "0s";
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) return `${remainingSeconds}s`;
  return `${minutes}m ${remainingSeconds}s`;
}

function formatDurationSec(sec: number): string {
  if (sec === 0) return "0s";
  const minutes = Math.floor(sec / 60);
  const remainingSeconds = Math.floor(sec % 60);
  if (minutes === 0) return `${remainingSeconds}s`;
  return `${minutes}m ${remainingSeconds}s`;
}

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
      console.log('Dashboard stats:', data);
      console.log('Session duration:', data.sessionDuration);
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
      <h1 className="mb-6 text-3xl font-bold">Dashboard</h1>

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

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
              <div className="flex justify-between text-sm">
                <span>Completed Sessions:</span>
                <span className="font-bold">{stats.completedSessions}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Redirected Sessions:</span>
                <span className="font-bold">{stats.redirectedSessions}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Skipped Feedback:</span>
                <span className="font-bold">{stats.skippedSessions}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Redirect Rate:</span>
                <span className="font-bold">{stats.redirectRate.toFixed(1)}%</span>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Session Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Avg Duration:</span>
                <span className="font-bold">{formatDuration(stats.sessionDuration.avgMs)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>With Micro:</span>
                <span>{formatDuration(stats.sessionDuration.avgWithMicroMs)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Without Micro:</span>
                <span>{formatDuration(stats.sessionDuration.avgWithoutMicroMs)}</span>
              </div>
              {stats.sessionDuration.avgAbandonedMs > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Avg Drop-Off:</span>
                  <span>{formatDuration(stats.sessionDuration.avgAbandonedMs)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Sessions Per Day</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.dailyBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data available</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.dailyBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-sm">
                          <div className="font-medium mb-2">{data.date}</div>
                          <div className="space-y-1 text-xs">
                            <div>Total Sessions: {data.totalSessions}</div>
                            <div>With Micro: {data.sessionsWith}</div>
                            <div>Without Micro: {data.sessionsWithout}</div>
                            <div>Total Messages: {data.totalMessages}</div>
                            <div>Avg Msg/Session: {data.avgMessagesPerSession.toFixed(1)}</div>
                            <div>Avg Duration: {formatDurationSec(data.avgSessionDurationSec)}</div>
                            <div>Upvote Ratio: {(data.upvoteRatio * 100).toFixed(1)}%</div>
                            <div>Suggestion Ratio: {(data.suggestionRatio * 100).toFixed(1)}%</div>
                            <div>Satisfaction: {data.avgSatisfaction.toFixed(1)}/5</div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="sessionsWith" stroke="#8884d8" name="With Micro" />
                  <Line type="monotone" dataKey="sessionsWithout" stroke="#82ca9d" name="Without Micro" />
                </LineChart>
              </ResponsiveContainer>

              <div className="mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">With Micro</TableHead>
                      <TableHead className="text-right">Without Micro</TableHead>
                      <TableHead className="text-right">Avg Duration</TableHead>
                      <TableHead className="text-right">Avg Msg/Session</TableHead>
                      <TableHead className="text-right">Upvote %</TableHead>
                      <TableHead className="text-right">Suggestion %</TableHead>
                      <TableHead className="text-right">Satisfaction</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.dailyBreakdown.map((day, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{day.date}</TableCell>
                        <TableCell className="text-right">{day.sessionsWith}</TableCell>
                        <TableCell className="text-right">{day.sessionsWithout}</TableCell>
                        <TableCell className="text-right">{formatDurationSec(day.avgSessionDurationSec)}</TableCell>
                        <TableCell className="text-right">{day.avgMessagesPerSession.toFixed(1)}</TableCell>
                        <TableCell className="text-right">{(day.upvoteRatio * 100).toFixed(1)}%</TableCell>
                        <TableCell className="text-right">{(day.suggestionRatio * 100).toFixed(1)}%</TableCell>
                        <TableCell className="text-right">{day.avgSatisfaction.toFixed(1)}/5</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
