"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

type DashboardStats = {
  totalSessions: number;
  uniqueUsers: number;
  uniqueUsersWithFeedback: number;
  feedbackCompletionRate: number;
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
  topicStats: Array<{
    topic: string;
    caseType: string;
    sessionCount: number;
    avgDurationSec: number;
    avgMessages: number;
    avgSatisfaction: number;
    suggestionClicks: number;
    typedMessages: number;
    suggestionRatio: number;
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
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
      setLastUpdate(new Date());
    }, 30000);
    
    return () => clearInterval(interval);
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
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-9 w-48 mb-6" />
        
        <div className="mb-6 flex gap-4">
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-[180px]" />
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-4 w-32" /></CardHeader>
              <CardContent className="space-y-3">
                {[...Array(4)].map((_, j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mb-8">
          <CardHeader><Skeleton className="h-4 w-40" /></CardHeader>
          <CardContent><Skeleton className="h-[200px] w-full" /></CardContent>
        </Card>

        <Card>
          <CardHeader><Skeleton className="h-4 w-36" /></CardHeader>
          <CardContent><Skeleton className="h-[300px] w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">Dashboard</h1>

      <div className="mb-6 flex gap-4 items-center">
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
        
        <div className="text-xs text-muted-foreground">
          Última atualização: {lastUpdate.toLocaleTimeString()}
        </div>
        
        <button 
          onClick={() => fetchStats()}
          className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded"
        >
          Atualizar
        </button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Com: {stats.withMicroInteractions} | Sem: {stats.withoutMicroInteractions}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sessões Completas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedSessions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalSessions > 0 ? ((stats.completedSessions / stats.totalSessions) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Com Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueUsersWithFeedback}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.completedSessions > 0 ? ((stats.uniqueUsersWithFeedback / stats.completedSessions) * 100).toFixed(1) : 0}% das completas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Abandono</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.abandonmentRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sessões não finalizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Msgs/Sessão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgMessagesPerSession.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total: {stats.totalMessages}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upvote Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upvoteRatio.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.upvotes} de {stats.totalVotes} votos
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Métricas de Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Satisfação Média</span>
                <span className="font-semibold">{Number(stats.avgSatisfaction || 0).toFixed(1)}/5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sessões Completas</span>
                <span className="font-semibold">{stats.completedSessions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Redirecionados</span>
                <span className="font-semibold">{stats.redirectedSessions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Feedback Pulado</span>
                <span className="font-semibold">{stats.skippedSessions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa Redirect</span>
                <span className="font-semibold">{stats.redirectRate.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Engajamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cliques em Sugestões</span>
                <span className="font-semibold">{stats.suggestionClicks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Msgs Digitadas</span>
                <span className="font-semibold">{stats.typedMessages}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ratio Sugestões</span>
                <span className="font-semibold">{stats.suggestionRatio.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tempo de Sessão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duração Média</span>
                <span className="font-semibold">{formatDuration(stats.sessionDuration.avgMs)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Com Micro</span>
                <span className="font-semibold">{formatDuration(stats.sessionDuration.avgWithMicroMs)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sem Micro</span>
                <span className="font-semibold">{formatDuration(stats.sessionDuration.avgWithoutMicroMs)}</span>
              </div>
              {stats.sessionDuration.avgAbandonedMs > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Até Abandono</span>
                  <span className="font-semibold">{formatDuration(stats.sessionDuration.avgAbandonedMs)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Análise por Tópicos</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topicStats && stats.topicStats.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tópico</TableHead>
                  <TableHead className="text-right">Sessões</TableHead>
                  <TableHead className="text-right">Duração Média</TableHead>
                  <TableHead className="text-right">Msg/Sessão</TableHead>
                  <TableHead className="text-right">Satisfação</TableHead>
                  <TableHead className="text-right">Sugestões %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topicStats.map((topic, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {topic.topic || 'Não Classificado'}
                    </TableCell>
                    <TableCell className="text-right">{topic.sessionCount}</TableCell>
                    <TableCell className="text-right">{formatDurationSec(topic.avgDurationSec)}</TableCell>
                    <TableCell className="text-right">{topic.avgMessages.toFixed(1)}</TableCell>
                    <TableCell className="text-right">{topic.avgSatisfaction.toFixed(1)}/5</TableCell>
                    <TableCell className="text-right">{topic.suggestionRatio.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum dado de tópicos disponível</p>
          )}
        </CardContent>
      </Card>

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
