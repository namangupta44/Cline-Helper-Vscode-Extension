import { useCollectorStore } from './store';

export function FileAndFolderCollector() {
  const store = useCollectorStore();

  return (
    <main>
      <h1>File and Folder Collector</h1>
      <p>Component under construction.</p>
      <pre>{JSON.stringify(store, null, 2)}</pre>
    </main>
  );
}
