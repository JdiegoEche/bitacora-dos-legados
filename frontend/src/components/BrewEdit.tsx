import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { brewsApi } from '../api/client';
import BrewForm from './BrewForm';
import type { CreateBrewData } from '../types';

export default function BrewEdit() {
  const { id } = useParams<{ id: string }>();
  const brewId = Number(id);

  const {
    data: brew,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['brew', brewId],
    queryFn: () => brewsApi.getById(brewId),
    enabled: !Number.isNaN(brewId),
  });

  if (Number.isNaN(brewId)) {
    return <div className="state-error">ID de preparación inválido.</div>;
  }

  if (isLoading) return <div className="state-msg">Cargando datos de la preparación…</div>;

  if (error || !brew) {
    return (
      <div className="state-error">
        Preparación no encontrada.{' '}
        <Link to="/bitacora">Volver al listado</Link>
      </div>
    );
  }

  const initialData: CreateBrewData = {
    method: brew.method,
    grindSize: brew.grindSize ?? '',
    waterTemp: brew.waterTemp ?? 0,
    brewTime: String(brew.brewTime ?? ''),
    coffeeDose: brew.coffeeDose ?? 0,
    waterDose: brew.waterDose ?? 0,
    coffeeBeanId: brew.coffeeBeanId,
    notes: brew.notes ?? '',
    rating: brew.rating ?? '',
    grinder: brew.grinder ?? '',
    clicks: brew.clicks ?? '',
  };

  return (
    <div>
      <BrewForm brewId={brew.id} initialData={initialData} />
    </div>
  );
}
