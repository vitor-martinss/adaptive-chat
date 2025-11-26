"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DashboardStats = {
  totalSessions: number;
  abandonmentRate: number;
  avgSatisfaction: number;
  avgConfidence: number;
  withMicroInteractions: number;
  withoutMicroInteractions: number;
  totalMessages: number;
  totalVotes: number;
  positiveVotes: number;
};

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSessions: 0,
    abandonmentRate: 0,
    avgSatisfaction: 0,
    avgConfidence: 0,
    withMicroInteractions: 0,
    withoutMicroInteractions: 0,
    totalMessages: 0,
    totalVotes: 0,
    positiveVotes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard - Gatapreta Sapatilhas</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total de Sessões</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalSessions}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Taxa de Abandono</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{(stats.abandonmentRate || 0).toFixed(1)}%</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Satisfação Média</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{(stats.avgSatisfaction || 0).toFixed(1)}/5</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Total de Mensagens</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalMessages}</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Votos Positivos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {stats.positiveVotes} / {stats.totalVotes}
            </p>
            <p className="text-sm text-muted-foreground">
              {stats.totalVotes > 0 ? (((stats.positiveVotes || 0) / stats.totalVotes) * 100).toFixed(1) : 0}% positivos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Com Micro-interações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.withMicroInteractions}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Sem Micro-interações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.withoutMicroInteractions}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}