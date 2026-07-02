import { Link } from 'react-router-dom';
import { methodIcons, methodNames } from '../icons/MethodIcons';

export default function RecipeMethodGrid() {
  const methods = Object.keys(methodIcons) as Array<keyof typeof methodIcons>;

  return (
    <div>
      <div className="detail-header">
        <h2>Recetario</h2>
      </div>

      <div className="recipe-method-grid">
        {methods.map((slug) => {
          const Icon = methodIcons[slug];
          return (
            <Link
              key={slug}
              to={`/recetas/${slug}`}
              className="recipe-method-card"
            >
              <Icon size={64} />
              <span className="recipe-method-name">{methodNames[slug]}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
