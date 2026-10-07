import { useEffect, useState } from 'react';

export type Route = 'play' | 'library' | 'states';

const read = (): Route => {
  const r = window.location.hash.replace(/^#\/?/, '');
  return r === 'library' || r === 'states' ? r : 'play';
};

/** Three routes, no router dependency yet. */
export function useHashRoute(): Route {
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onHash = () => setRoute(read());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return route;
}
