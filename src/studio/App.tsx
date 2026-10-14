import { Toaster } from '@/studio/components/ui/toaster';
import { TooltipProvider } from '@/studio/components/ui/tooltip';
import Studio from '@/studio/pages/Studio';
import { StudioProvider } from '@/studio/studio/store';

function App() {
  return (
    <TooltipProvider>
      <StudioProvider>
        <div className="studio-root">
          <Studio />
        </div>
        <Toaster />
      </StudioProvider>
    </TooltipProvider>
  );
}

export default App;
