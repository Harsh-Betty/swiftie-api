import { render } from 'preact';
import { App } from './app';
import { loadEras } from './lib/eras';
import './styles/globals.css';

void loadEras().catch(() => {
  // Falls back to build-time tokens when the api is unreachable.
});

const root = document.getElementById('app');
if (!root) throw new Error('Mount point #app not found');

render(<App />, root);
