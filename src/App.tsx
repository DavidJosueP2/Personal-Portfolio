import { Button } from "@/components/ui/shadcn/button";

export default function App() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
            <div className="space-y-4 text-center">
                <h1 className="text-2xl font-semibold">
                    Shadcn UI funcionando
                </h1>

                <Button
                    onClick={() => console.log("Botón shadcn OK")}
                >
                    Click me
                </Button>
            </div>
        </div>
    );
}
