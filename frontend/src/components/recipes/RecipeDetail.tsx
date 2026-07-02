import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { recipesApi } from '../../api/client';
import type { RecipeDetail as RecipeDetailType } from '../../types';

// ─── Helpers ──────────────────────────────────────────────────────────

function formatDose(g: number): string {
  return `${g}g`;
}

function formatWater(ml: number): string {
  return `${ml}ml`;
}

// ─── Sub-components ───────────────────────────────────────────────────

function ParamGrid({ recipe }: { recipe: RecipeDetailType }) {
  return (
    <div className="detail-grid">
      <div className="detail-field">
        <span className="detail-label">Café</span>
        <span className="detail-value">{formatDose(recipe.coffeeDose)}</span>
      </div>
      <div className="detail-field">
        <span className="detail-label">Agua</span>
        <span className="detail-value">{formatWater(recipe.waterDose)}</span>
      </div>
      <div className="detail-field">
        <span className="detail-label">Ratio</span>
        <span className="detail-value">{recipe.ratio}</span>
      </div>
      <div className="detail-field">
        <span className="detail-label">Temperatura</span>
        <span className="detail-value">{recipe.temperature}</span>
      </div>
      <div className="detail-field">
        <span className="detail-label">Molienda</span>
        <span className="detail-value">{recipe.grindSize}</span>
      </div>
      <div className="detail-field">
        <span className="detail-label">Tiempo total</span>
        <span className="detail-value">{recipe.totalTime}</span>
      </div>
    </div>
  );
}

function StepsTimeline({ steps }: { steps: RecipeDetailType['steps'] }) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="recipe-steps">
      <h3>Pasos</h3>
      <ol className="recipe-steps-list">
        {steps.map((step) => (
          <li key={step.stepOrder} className="recipe-step-item">
            <span className="recipe-step-number">{step.stepOrder}</span>
            <div className="recipe-step-content">
              <p className="recipe-step-instruction">{step.instruction}</p>
              {step.waterAtStep != null && (
                <span className="recipe-step-water">
                  {formatWater(step.waterAtStep)}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────

export default function RecipeDetail() {
  const { method, id } = useParams<{ method: string; id: string }>();
  const recipeId = Number(id);

  const {
    data: recipe,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['recipe', recipeId],
    queryFn: () => recipesApi.getById(recipeId),
    enabled: !Number.isNaN(recipeId),
  });

  if (Number.isNaN(recipeId)) {
    return (
      <div className="state-msg state-error">ID de receta inválido.</div>
    );
  }

  if (isLoading) {
    return <div className="state-msg">Cargando receta…</div>;
  }

  if (error) {
    return (
      <div className="state-msg state-error">
        Error al cargar la receta. ¿Está el backend funcionando?
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="state-msg state-error">Receta no encontrada.</div>
    );
  }

  return (
    <div className="recipe-detail">
      <div className="detail-header">
        <div>
          <h2>{recipe.name}</h2>
          {recipe.objective && (
            <p className="recipe-objective">{recipe.objective}</p>
          )}
        </div>
        <Link
          to={`/recetas/${method}`}
          className="btn btn-secondary"
        >
          ← Volver
        </Link>
      </div>

      <ParamGrid recipe={recipe} />

      <div className="recipe-profile">
        <h3>Perfil</h3>
        <p>{recipe.profile}</p>
      </div>

      <StepsTimeline steps={recipe.steps} />
    </div>
  );
}
