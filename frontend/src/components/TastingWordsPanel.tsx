import { useQuery } from '@tanstack/react-query';
import { statsApi } from '../api/client';
import '../lib/chart-config';

// ─── Helpers ────────────────────────────────────────────────────────

function maxCount(category: { word: string; count: number }[]): number {
  if (category.length === 0) return 1;
  return Math.max(...category.map((w) => w.count));
}

// ─── Word Bar ───────────────────────────────────────────────────────

function WordBar({
  word,
  count,
  max,
}: {
  word: string;
  count: number;
  max: number;
}) {
  const pct = (count / max) * 100;
  return (
    <div className="word-bar-row">
      <span className="word-bar-label">{word}</span>
      <div className="word-bar-track">
        <div className="word-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="word-bar-count">{count}</span>
    </div>
  );
}

// ─── Category Section ───────────────────────────────────────────────

function CategorySection({
  title,
  words,
}: {
  title: string;
  words: { word: string; count: number }[];
}) {
  if (words.length === 0) return null;

  const max = maxCount(words);

  return (
    <div className="word-category">
      <h4>{title}</h4>
      {words.map((w) => (
        <WordBar key={w.word} word={w.word} count={w.count} max={max} />
      ))}
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────

export default function TastingWordsPanel() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['stats', 'tasting-words'],
    queryFn: statsApi.getTastingWords,
  });

  if (isLoading) {
    return (
      <div className="stats-section">
        <h3>Palabras de cata</h3>
        <div className="stats-empty">Cargando…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stats-section">
        <h3>Palabras de cata</h3>
        <div className="stats-empty">Error al cargar datos</div>
      </div>
    );
  }

  const hasData =
    data &&
    (data.aroma.length > 0 ||
      data.flavor.length > 0 ||
      data.body.length > 0 ||
      data.acidity.length > 0);

  if (!hasData) {
    return (
      <div className="stats-section">
        <h3>Palabras de cata</h3>
        <div className="stats-empty">
          Agregá notas de cata para ver tu perfil sensorial
        </div>
      </div>
    );
  }

  const categories = [
    { title: 'Aroma', words: data!.aroma },
    { title: 'Sabor', words: data!.flavor },
    { title: 'Cuerpo', words: data!.body },
    { title: 'Acidez', words: data!.acidity },
  ];

  return (
    <div className="stats-section">
      <h3>Palabras de cata</h3>
      {categories.map((cat) => (
        <CategorySection key={cat.title} title={cat.title} words={cat.words} />
      ))}
    </div>
  );
}
