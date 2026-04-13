// chromeMock must be imported first so window.chrome is defined before
// any extension components that reference it are initialised.
import './chromeMock';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { UIPreview } from './UIPreview';
import '../popup/popup.css';
import './preview.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <UIPreview />
    </React.StrictMode>,
  );
}
