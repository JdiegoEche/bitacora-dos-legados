import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { recipesApi } from '../../api/client';
import { methodNames } from '../icons/MethodIcons';
import type { Recipe } from '../../types';

// ─── Helpers ──────────────────────────────────────────────────────────

function formatDose(g: number): string {
  return `${g}g`;
}

function formatWater(ml: number): string {
  return `${ml}ml`;
}

// ─── Component ────────────────────────────────────────────────────────

export default function RecipeList() {
  const { method } = useParams<{ method: string }>();

  const {
    data: recipes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['recipes', method],
    queryFn: () => recipesApi.list(method),
    enabled: !!method,
  });

  if (isLoading) {
    return <div className="state-msg">Cargando recetas…</div>;
  }

  if (error) {
    return (
      <div className="state-msg state-error">
        Error al cargar recetas. ¿Está el backend funcionando?
      </div>
    );
  }

  const methodName = method ? methodNames[method] || method : '';

  if (!recipes || recipes.length === 0) {
    return (
      <div>
        <div className="detail-header">
          <h2>{methodName}</h2>
          <Link to="/recetas" className="btn btn-secondary">← Volver</Link>
        </div>
        <div className="empty-state">
          <p>No hay recetas para este método todavía.</p>
          <Link to="/recetas" className="btn">← Volver al recetario</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="detail-header">
        <h2>{methodName}</h2>
        <Link to="/recetas" className="btn btn-secondary">← Volver</Link>
      </div>

      <div className="recipe-list">
        {recipes.map((recipe: Recipe) => (
          <Link
            key={recipe.id}
            to={`/recetas/${method}/${recipe.id}`}
            className="recipe-card"
          >
            <h3 className="recipe-card-name">{recipe.name}</h3>
            {recipe.objective && (
              <p className="recipe-card-objective">{recipe.objective}</p>
            )}
            <div className="recipe-card-params">
              <span className="recipe-param">
                <strong>Café:</strong> {formatDose(recipe.coffeeDose)}
              </span>
              <span className="recipe-param">
                <strong>Agua:</strong> {formatWater(recipe.waterDose)}
              </span>
              <span className="recipe-param">
                <strong>Ratio:</strong> {recipe.ratio}
              </span>
              <span className="recipe-param">
                <strong>Temp:</strong> {recipe.temperature}
              </span>
              <span className="recipe-param">
                <strong>Tiempo:</strong> {recipe.totalTime}
              </span>
              <span className="recipe-param">
                <strong>Perfil:</strong> {recipe.profile}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
