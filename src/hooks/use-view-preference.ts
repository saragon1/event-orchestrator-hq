
import { useState, useEffect } from 'react';

type ViewMode = 'grid' | 'list';

export function useViewPreference(key: string, defaultView: ViewMode = 'grid') {
  const [view, setView] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(`view-preference-${key}`);
    return (saved as ViewMode) || defaultView;
  });

  useEffect(() => {
    localStorage.setItem(`view-preference-${key}`, view);
  }, [key, view]);

  return [view, setView] as const;
}
