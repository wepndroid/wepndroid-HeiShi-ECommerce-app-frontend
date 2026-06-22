import { useEffect, useState } from 'react';
import type { ListingFormOptionsDto } from '../api/types';
import { MOCK_FORM_OPTIONS } from '../data/formOptionsLocal';
import { fetchFormOptions } from '../services/formOptionsService';

export function useFormOptions() {
  const [options, setOptions] = useState<ListingFormOptionsDto>(MOCK_FORM_OPTIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchFormOptions()
      .then((data) => {
        if (active) setOptions(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { options, loading };
}