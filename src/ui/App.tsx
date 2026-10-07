import { useReducer } from 'react';
import { useHashRoute } from './useHashRoute';
import { GraphProvider } from './data/GraphContext';
import { placeholderGraph } from './data/placeholderGraph';
import { placeholderQuestions } from './data/placeholderQuestions';
import { createSession, playReducer } from './state/playSession';
import { createLibraryNav, libraryReducer } from './state/libraryNav';
import PhoneShell from './components/common/PhoneShell';
import TabBar from './components/common/TabBar';
import PlayScreen from './components/play/PlayScreen';
import LibraryScreen from './components/library/LibraryScreen';
import StatesGallery from './dev/StatesGallery';

const graph = placeholderGraph;
const questions = placeholderQuestions;

export default function App() {
  const route = useHashRoute();
  // Both reducers live here so switching tabs keeps her place in each area.
  const [session, playDispatch] = useReducer(playReducer, undefined, () => createSession(questions, graph));
  const [nav, libDispatch] = useReducer(libraryReducer, undefined, () => createLibraryNav());

  return (
    <GraphProvider graph={graph}>
      {route === 'states' ? (
        <StatesGallery base={createSession(questions, graph)} />
      ) : (
        <PhoneShell tabBar={<TabBar active={route} />}>
          {route === 'library' ? (
            <LibraryScreen nav={nav} dispatch={libDispatch} />
          ) : (
            <PlayScreen session={session} dispatch={playDispatch} />
          )}
        </PhoneShell>
      )}
    </GraphProvider>
  );
}
