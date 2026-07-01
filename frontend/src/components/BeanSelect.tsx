import { useQuery } from '@tanstack/react-query';
import { beansApi } from '../api/client';

interface BeanSelectProps {
  value: number | null | undefined;
  onChange: (id: number | null) => void;
}

export default function BeanSelect({ value, onChange }: BeanSelectProps) {
  const { data: beans } = useQuery({
    queryKey: ['beans'],
    queryFn: beansApi.list,
  });

  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      className="input"
    >
      <option value="">— No bean —</option>
      {beans?.map((b) => (
        <option key={b.id} value={b.id}>
          {b.name} ({b.roaster})
        </option>
      ))}
    </select>
  );
}
