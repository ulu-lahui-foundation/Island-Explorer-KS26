import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { GameProvider, useGame } from "@/lib/GameContext";
import { Navigation } from "@/components/Navigation";
import { AuthModal } from "@/components/AuthModal";
import { MapPage } from "@/pages/MapPage";
import { CameraPage } from "@/pages/CameraPage";
import { PikoPage } from "@/pages/PikoPage";
import { PlantIndexPage } from "@/pages/PlantIndexPage";
import { TasksPage } from "@/pages/TasksPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { AboutPage } from "@/pages/AboutPage";
import { Toaster } from "@/components/ui/toaster";
import { AnimatePresence, motion } from "framer-motion";

function MainApp() {
  const { currentView } = useGame();

  const renderView = () => {
    switch (currentView) {
      case 'ahupuaa':     return <MapPage key="ahupuaa" />;
      case 'camera':      return <CameraPage key="camera" />;
      case 'piko':        return <PikoPage key="piko" />;
      case 'plant_index': return <PlantIndexPage key="plant_index" />;
      case 'tasks':       return <TasksPage key="tasks" />;
      case 'settings':    return <SettingsPage key="settings" />;
      case 'about':       return <AboutPage key="about" />;
      default:            return <MapPage key="default" />;
    }
  };

  return (
    <div className="w-full h-[100dvh] max-w-[430px] mx-auto bg-black relative overflow-hidden flex flex-col font-sans">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full h-full"
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>
      <Navigation />
    </div>
  );
}

function AuthGatedApp() {
  const { currentUser } = useAuth();
  const [showAuth, setShowAuth] = useState(!currentUser);

  // Re-show auth modal when user signs out
  useEffect(() => {
    if (!currentUser) setShowAuth(true);
  }, [currentUser]);

  return (
    <>
      {/* Key on currentUser so GameProvider remounts fresh for each account */}
      <GameProvider key={currentUser ?? '__signed_out__'} username={currentUser}>
        <MainApp />
        <Toaster />
      </GameProvider>

      <AnimatePresence>
        {showAuth && (
          <AuthModal onSuccess={() => setShowAuth(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthGatedApp />
    </AuthProvider>
  );
}

export default App;
