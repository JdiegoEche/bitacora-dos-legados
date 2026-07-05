import { useQuery } from '@tanstack/react-query';
import { Bar } from 'react-chartjs-2';
import type { TooltipItem } from 'chart.js';
import { statsApi } from '../api/client';
import type { MethodPopItem } from '../types';
import '../lib/chart-config';

// ─── Color helpers ───────────────────────────────────────────────────

const RATING_COLORS = {
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
  gray: '#a8a29e',
} as const;

function getRatingColor(avgRating: number | null): string {
  if (avgRating === null) return RATING_COLORS.gray;
  if (avgRating >= 4.0) return RATING_COLORS.green;
  if (avgRating >= 2.5) return RATING_COLORS.yellow;
  return RATING_COLORS.red;
}

function formatRating(r: number | null): string {
  return r !== null ? r.toFixed(1) : '—';
}

// ─── Chart data builder ─────────────────────────────────────────────

function buildChartData(items: MethodPopItem[]) {
  const sorted = [...items].sort((a, b) => b.count - a.count);

  return {
    labels: sorted.map((item) => item.method),
    datasets: [
      {
        label: 'Preparaciones',
        data: sorted.map((item) => item.count),
        avgRatings: sorted.map((item) => item.avgRating),
        methods: sorted.map((item) => item.method),
        backgroundColor: sorted.map((item) => getRatingColor(item.avgRating)),
        borderColor: sorted.map((item) => getRatingColor(item.avgRating)),
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label(context: TooltipItem<'bar'>) {
          return `Cantidad: ${context.parsed.y}`;
        },
        afterLabel(context: TooltipItem<'bar'>) {
          const rating = (context.dataset as any).avgRatings?.[
            context.dataIndex
          ];
          return rating !== undefined
            ? `Rating: ${formatRating(rating)}`
            : '';
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1,
      },
    },
  },
};

// ─── Component ──────────────────────────────────────────────────────

export default function MethodChartPanel() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['stats', 'method-popularity'],
    queryFn: statsApi.getMethodPopularity,
  });

  if (isLoading) {
    return (
      <div className="stats-section">
        <h3>Métodos populares</h3>
        <div className="stats-empty">Cargando…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stats-section">
        <h3>Métodos populares</h3>
        <div className="stats-empty">Error al cargar datos</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="stats-section">
        <h3>Métodos populares</h3>
        <div className="stats-empty">
          Registrá preparaciones para ver tus métodos más usados
        </div>
      </div>
    );
  }

  const chartData = buildChartData(data);

  return (
    <div className="stats-section">
      <h3>Métodos populares</h3>
      <div className="chart-container">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}
