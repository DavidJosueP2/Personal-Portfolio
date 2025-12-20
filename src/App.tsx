import { PillChoiceProvider } from "@/context/pill-choice";
import { AccentThemeProvider } from "@/context/accent-theme";
import { AmbientAudioProvider } from "@/context/ambient-audio";
import { LandingPage } from "@/components/landing/LandingPage";

export default function App() {
  return (
    <AccentThemeProvider>
      <PillChoiceProvider>
        <AmbientAudioProvider>
          <LandingPage />
        </AmbientAudioProvider>
      </PillChoiceProvider>
    </AccentThemeProvider>
  );
}
