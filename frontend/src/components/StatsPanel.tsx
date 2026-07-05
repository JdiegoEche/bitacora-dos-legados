import TastingWordsPanel from './TastingWordsPanel';
import MethodChartPanel from './MethodChartPanel';

export default function StatsPanel() {
  return (
    <div className="stats-panel">
      <TastingWordsPanel />
      <MethodChartPanel />
    </div>
  );
}
