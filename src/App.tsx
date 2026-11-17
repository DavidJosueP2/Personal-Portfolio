import { PillChoiceProvider } from "@/context/pill-choice";
import { AccentThemeProvider } from "@/context/accent-theme";
import { AmbientAudioProvider } from "@/context/ambient-audio";
import { LandingPage } from "@/components/landing/LandingPage";
import { InverseCursor } from "@/components/ui/InverseCursor";

export default function App() {
  return (
    <AccentThemeProvider>
      <PillChoiceProvider>
        <AmbientAudioProvider>
          <LandingPage />
          <InverseCursor />
        </AmbientAudioProvider>
      </PillChoiceProvider>
    </AccentThemeProvider>
  );
}
