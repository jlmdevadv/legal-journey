import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FileText, Clock, CheckCircle } from 'lucide-react';
import { DashboardStats } from '@/hooks/useDashboardData';

interface StatsBarProps {
  stats: DashboardStats;
  isMaster: boolean;
}

const StatsBar = ({ stats, isMaster }: StatsBarProps) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
    {isMaster && (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <p className="text-xs font-sans uppercase tracking-wider text-muted-foreground">Templates</p>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-serif text-foreground mt-2">
            {stats.templates.count}
            <span className="text-lg font-sans text-muted-foreground">/{stats.templates.limit}</span>
          </div>
          <p className="text-xs text-muted-foreground">Modelos criados</p>
        </CardContent>
      </Card>
    )}

    <Card className={!isMaster ? 'sm:col-start-1' : ''}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <p className="text-xs font-sans uppercase tracking-wider text-muted-foreground">Pendentes</p>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-serif text-foreground mt-2">{stats.pending}</div>
        <p className="text-xs text-muted-foreground">
          {isMaster ? 'Aguardando revisão' : 'Requerem sua ação'}
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <p className="text-xs font-sans uppercase tracking-wider text-muted-foreground">Finalizados</p>
        <CheckCircle className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-serif text-foreground mt-2">{stats.finalized}</div>
        <p className="text-xs text-muted-foreground">Documentos aprovados</p>
      </CardContent>
    </Card>
  </div>
);

export default StatsBar;
