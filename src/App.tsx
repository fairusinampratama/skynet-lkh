import { BrowserRouter } from 'react-router-dom';
import { LkhProvider } from './context/LkhContext';
import { DefaultLayout } from './layout/DefaultLayout';

export default function App() {
  return (
    <BrowserRouter>
      <LkhProvider>
        <DefaultLayout />
      </LkhProvider>
    </BrowserRouter>
  );
}
