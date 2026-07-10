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

function SplashScreen({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      key="splash"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: '#0F2318' }}
    >
      {/* Subtle radial glow behind the card */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 55% at 50% 52%, rgba(92,200,130,0.13) 0%, transparent 75%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex flex-col items-center px-10 py-14 rounded-3xl mx-6"
        style={{
          background: 'linear-gradient(160deg, #1C4230 0%, #245238 60%, #1A3C2C 100%)',
          boxShadow: '0 0 0 1px rgba(92,200,130,0.18), 0 32px 80px rgba(0,0,0,0.55)',
          maxWidth: 360,
          width: '100%',
        }}
      >
        <h1
          className="text-4xl font-extrabold text-center leading-tight mb-2"
          style={{ color: '#ffffff', letterSpacing: '-0.02em' }}
        >
          ʻŌiwi
        </h1>
        <h1
          className="text-4xl font-extrabold text-center leading-tight mb-3"
          style={{ color: '#5CC882', letterSpacing: '-0.02em' }}
        >
          Observer
        </h1>

        <p
          className="text-sm text-center mb-10 leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.50)' }}
        >
          Learn Hawaiian plants by scanning, identifying, collecting, and exploring your ahupuaʻa
        </p>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onStart}
          className="w-full py-4 rounded-2xl text-base font-extrabold tracking-wide"
          style={{
            background: 'linear-gradient(135deg, #5CC882 0%, #3AAD66 100%)',
            color: '#0F2318',
            boxShadow: '0 4px 24px rgba(92,200,130,0.35)',
          }}
        >
          Start Planting
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

function MainApp() {
  const { currentView, darkMode } = useGame();

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
    <div
      className="w-full h-[100dvh] max-w-[430px] mx-auto relative overflow-hidden flex flex-col font-sans"
      style={{ background: darkMode ? '#245238' : '#F6F1E7' }}
    >
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

  useEffect(() => {
    if (!currentUser) setShowAuth(true);
  }, [currentUser]);

  return (
    <>
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
  const [splashDone, setSplashDone] = useState(false);

  return (
    <AuthProvider>
      <AnimatePresence>
        {!splashDone && (
          <SplashScreen onStart={() => setSplashDone(true)} />
        )}
      </AnimatePresence>

      {splashDone && <AuthGatedApp />}
    </AuthProvider>
  );
}

export default App;
