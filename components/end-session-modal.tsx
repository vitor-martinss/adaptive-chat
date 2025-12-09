"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function EndSessionModal({
  isOpen,
  onSolved,
  onNotSolved,
}: {
  isOpen: boolean;
  onSolved: () => void;
  onNotSolved: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="text-center">Consegui solucionar o seu problema?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3">
            <Button onClick={onSolved} className="w-full" size="lg">
              ✅ Sim, já me ajudou
            </Button>
            <Button onClick={onNotSolved} variant="outline" className="w-full" size="lg">
              ❌ Ainda tenho dúvidas
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
