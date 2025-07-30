import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, arrayUnion } from "firebase/firestore";
import { toast } from "sonner";
import { fetchWithFallback } from "@/lib/utils";
import { Bot, Wand2 } from "lucide-react";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_KEY_2 = import.meta.env.VITE_GEMINI_API_KEY_2;
const API_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

const getLocalDateString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const FeelingTracker: React.FC = () => {
  const { user } = useAuth();
  const [feeling, setFeeling] = useState("");
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const handleLogAndAnalyze = async () => {
    if (!user || !feeling.trim()) return;

    setLoadingAnalysis(true);
    setAnalysis(null);

    const feelingToLog = feeling.trim();
    const newFeelingEntry = { text: feelingToLog, timestamp: new Date() };
    const todayDateString = getLocalDateString();

    try {
      // Step 1: Save the feeling to the CORRECT 'journal' document.
      const docRef = doc(db, "users", user.uid, "journal", todayDateString);
      await setDoc(
        docRef,
        {
          feelings: arrayUnion(newFeelingEntry),
          date: todayDateString, // Also set the date for querying
        },
        { merge: true }
      );

      toast.success("Quick note logged.");
      const feelingToAnalyze = feeling;
      setFeeling("");

      // Step 2: Attempt the AI analysis.
      const prompt = `
                You are an empathetic wellness analyst named Sally.
                A user just logged a new feeling: "${feelingToAnalyze}".
                Analyze this feeling. Provide a short, gentle, and insightful summary (1-2 sentences).
                Do not give advice, just a compassionate observation.
                Respond ONLY with the summary text.
            `;

      const response = await fetchWithFallback(
        API_BASE_URL,
        GEMINI_API_KEY,
        GEMINI_API_KEY_2,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        },
        (message) => toast.info(message)
      );

      if (!response.ok) throw new Error("AI server responded with an error.");

      const data = await response.json();
      const modelResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (modelResponse) {
        setAnalysis(modelResponse);
      } else {
        throw new Error("Analysis failed to generate a response.");
      }
    } catch (error: any) {
      toast.error(`Analysis failed: ${error.message}`, {
        description: "Your note was still saved successfully.",
      });
    } finally {
      setLoadingAnalysis(false);
    }
  };

  return (
    <Card className="neon-border-secondary">
      <CardHeader>
        <CardTitle style={{ textAlign: "center" }}>
          🧠 State of Mind 🧠
        </CardTitle>{" "}
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            placeholder="Log a quick feeling or thought..."
            value={feeling}
            onChange={(e) => setFeeling(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogAndAnalyze()}
            disabled={loadingAnalysis}
          />
          <Button
            onClick={handleLogAndAnalyze}
            disabled={loadingAnalysis || !feeling.trim()}
          >
            {loadingAnalysis ? (
              "Saving..."
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" /> Log & Analyze
              </>
            )}
          </Button>
        </div>

        {analysis && !loadingAnalysis && (
          <div className="mt-4 p-4 bg-muted rounded-lg text-sm">
            <p className="flex items-start gap-2">
              <Bot className="h-5 w-5 text-secondary flex-shrink-0 mt-1" />
              <span>{analysis}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
