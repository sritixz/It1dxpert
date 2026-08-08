import { useState, useEffect, useRef } from "react";
import { 
  Camera, Upload, Sparkles, Check, Loader2, Info, 
  Utensils, AlertCircle, ChevronRight, Apple, Trash2 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { analyzeMealImage, analyzeMealText } from "../../api/ai.api.js";
import { logMeal } from "../../api/patient.api.js";

const FOOD_FACTS = [
  "Did you know? Fiber in vegetables slows down the rate at which glucose enters your bloodstream, smoothing out spikes.",
  "Type 1 Tip: Matching your insulin dose to carbohydrate intake is key to maintaining a stable blood glucose range.",
  "Protein and fats do not raise blood sugar immediately, but they delay digestion, causing delayed post-meal glucose rises.",
  "Complex carbohydrates like brown rice, oats, and beans have a lower glycemic index, preventing sudden blood sugar spikes.",
  "High-fat meals (like pizza or burgers) can delay carbohydrate absorption, causing hyperglycemia 3-5 hours after eating.",
];

export function CarbCalorieFinderPage() {
  const [activeTab, setActiveTab] = useState("photo"); // "photo" | "text"
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [textDescription, setTextDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentFactIdx, setCurrentFactIdx] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState("");
  
  // Logging state
  const [mealType, setMealType] = useState("Lunch");
  const [notes, setNotes] = useState("");
  const [isLogging, setIsLogging] = useState(false);
  const [logSuccess, setLogSuccess] = useState(false);

  const fileInputRef = useRef(null);

  // Cycle through food facts during loading state
  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(() => {
        setCurrentFactIdx((prev) => (prev + 1) % FOOD_FACTS.length);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Handle Drag & Drop Events
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    setError("");
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      processFile(file);
    } else {
      setError("Please drop a valid image file.");
    }
  };

  const handleFileChange = (e) => {
    setError("");
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
    setAnalysisResult(null);
    setLogSuccess(false);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setAnalysisResult(null);
    setLogSuccess(false);
    setError("");
  };

  const handleAnalyze = async () => {
    setError("");
    setAnalysisResult(null);
    setLogSuccess(false);
    setIsLoading(true);

    try {
      let result;
      if (activeTab === "photo") {
        if (!imageFile) throw new Error("Please upload or snap a photo of your meal first.");
        result = await analyzeMealImage(imageFile);
      } else {
        if (!textDescription.trim()) throw new Error("Please describe what you ate first.");
        result = await analyzeMealText(textDescription);
      }

      setAnalysisResult(result);
      setNotes(result.mealName);
    } catch (err) {
      console.error("Meal analysis error:", err);
      setError(err.message || "Failed to analyze meal. Please check your internet connection or Gemini API settings.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogMeal = async () => {
    if (!analysisResult) return;
    setIsLogging(true);
    setLogSuccess(false);
    setError("");

    try {
      await logMeal({
        carbs: Number(analysisResult.carbs),
        mealType: mealType,
        notes: `${notes} (${analysisResult.portionEstimate}, Cal: ${analysisResult.calories}kcal, P: ${analysisResult.protein}g, F: ${analysisResult.fat}g)`
      });
      setLogSuccess(true);
    } catch (err) {
      console.error("Logging meal error:", err);
      setError("Failed to save meal log to database.");
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink flex items-center gap-2">
          <Utensils className="text-primary animate-pulse" /> Carb & Calorie Finder
        </h2>
        <p className="font-body text-sm text-muted">
          Snap a photo of your plate or describe your diet to identify calories, carbohydrates, and manage your insulin doses accurately.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Input Controls Card */}
        <Card className="lg:col-span-6 flex flex-col gap-4 border-border/80 shadow-sm">
          {/* Tab Selector */}
          <div className="flex bg-bg rounded-xl p-1 border border-border">
            <button
              onClick={() => { setActiveTab("photo"); setAnalysisResult(null); setError(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-display text-xs font-semibold transition-all ${
                activeTab === "photo" ? "bg-surface text-primary shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              <Camera size={14} /> Analyze Photo
            </button>
            <button
              onClick={() => { setActiveTab("text"); setAnalysisResult(null); setError(""); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-display text-xs font-semibold transition-all ${
                activeTab === "text" ? "bg-surface text-primary shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              <Apple size={14} /> Describe Meal
            </button>
          </div>

          {/* Photo Tab Content */}
          {activeTab === "photo" && (
            <div className="flex flex-col gap-4">
              {!imagePreview ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-12 px-6 text-center cursor-pointer transition-all duration-200 ${
                    isDragging 
                      ? "border-primary bg-primary-light/30 scale-[1.01]" 
                      : "border-border hover:border-primary/50 hover:bg-bg/50"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="p-3 bg-primary-light text-primary rounded-full mb-3 shadow-inner">
                    <Camera size={28} />
                  </div>
                  <p className="font-display text-xs font-bold text-ink">Upload Plate Photo</p>
                  <p className="font-body text-[10px] text-muted mt-1 leading-snug">
                    Drag and drop your image here, or click to browse.<br/>Works on phone cameras to snap direct photos!
                  </p>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-border shadow-xs bg-bg flex flex-col items-center p-3">
                  <img
                    src={imagePreview}
                    alt="Meal Preview"
                    className="max-h-60 max-w-full rounded-lg object-contain shadow-xs"
                  />
                  <button
                    onClick={clearImage}
                    className="absolute top-5 right-5 p-2 bg-critical text-white rounded-lg hover:bg-critical-dark shadow-sm transition-all scale-95 hover:scale-100"
                    title="Remove Photo"
                  >
                    <Trash2 size={14} />
                  </button>
                  <span className="text-[10px] text-muted mt-2 font-body font-semibold">
                    File selected: {imageFile?.name} ({(imageFile?.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Text Description Tab Content */}
          {activeTab === "text" && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-ink">What is on your plate?</label>
              <textarea
                value={textDescription}
                onChange={(e) => setTextDescription(e.target.value)}
                placeholder="Describe your meal (e.g. 'I had 2 medium bananas, a cup of curd, and 50g almonds')"
                rows={5}
                className="w-full rounded-xl border border-border bg-bg px-4 py-3 font-body text-sm text-ink outline-none focus:border-primary shadow-xs transition-colors resize-none"
              />
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-1.5 p-3 rounded-lg border border-critical/30 bg-critical-light text-critical text-xs font-body shadow-xs">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* Analyze Button */}
          <Button
            onClick={handleAnalyze}
            disabled={isLoading || (activeTab === "photo" ? !imageFile : !textDescription.trim())}
            className="w-full py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Sparkles size={16} /> Analyze Food
          </Button>
        </Card>

        {/* Results / Processing Area */}
        <Card className="lg:col-span-6 min-h-[300px] flex flex-col justify-center border-border/80 shadow-sm relative overflow-hidden">
          
          <AnimatePresence mode="wait">
            
            {/* 1. Loading Animation & Facts */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center text-center p-6 gap-5 h-full justify-center"
              >
                <div className="relative flex items-center justify-center">
                  <div className="h-14 w-14 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                  <Utensils size={20} className="absolute text-primary animate-pulse" />
                </div>
                
                <div>
                  <h4 className="font-display text-sm font-bold text-ink">Scanning Food Metrics...</h4>
                  <p className="text-[10px] text-success font-semibold mt-1 uppercase tracking-wider animate-pulse">CareAI is estimating nutrition</p>
                </div>

                {/* Rotating educational food facts */}
                <div className="max-w-xs p-4 bg-bg border border-border rounded-xl shadow-xs mt-2 relative">
                  <div className="absolute -top-2.5 left-4 px-2 py-0.5 rounded bg-primary text-white text-[8px] font-bold uppercase">Diabetes Trivia</div>
                  <p className="font-body text-xs text-ink leading-relaxed">
                    {FOOD_FACTS[currentFactIdx]}
                  </p>
                </div>
              </motion.div>
            )}

            {/* 2. Analysis Result Display */}
            {!isLoading && analysisResult && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-5 p-2 h-full justify-between"
              >
                <div>
                  <div className="flex justify-between items-start border-b border-border/60 pb-3">
                    <div>
                      <h3 className="font-display text-lg font-bold text-ink capitalize">
                        {analysisResult.mealName}
                      </h3>
                      <p className="font-body text-xs text-muted flex items-center gap-1 mt-0.5">
                        Portion size: <strong className="text-ink font-semibold">{analysisResult.portionEstimate}</strong>
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-primary-light text-primary text-[10px] font-bold border border-primary/10">
                      Identified Plate
                    </span>
                  </div>

                  {/* Macronutrient Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-5">
                    <MetricValue label="Calories" value={analysisResult.calories} unit="kcal" color="border-primary bg-primary-light/20 text-primary" />
                    <MetricValue label="Carbs" value={analysisResult.carbs} unit="g" color="border-warning bg-warning-light/20 text-warning" />
                    <MetricValue label="Protein" value={analysisResult.protein} unit="g" color="border-success bg-success-light/20 text-success" />
                    <MetricValue label="Fat" value={analysisResult.fat} unit="g" color="border-critical bg-critical-light/20 text-critical" />
                  </div>

                  {/* Glycemic Impact Insight */}
                  <div className="mt-5 p-3.5 bg-bg/50 border border-border/70 rounded-xl shadow-xs">
                    <p className="text-xs font-bold text-ink flex items-center gap-1.5 mb-1">
                      <Info size={14} className="text-primary" /> Blood Glucose Impact
                    </p>
                    <p className="font-body text-xs text-muted leading-relaxed">
                      {analysisResult.glycemicImpact}
                    </p>
                  </div>
                </div>

                {/* Log meal to daily log interface */}
                <div className="border-t border-border/60 pt-4 mt-6 flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-muted mb-1 uppercase tracking-wider">Meal Category</label>
                      <select
                        value={mealType}
                        onChange={(e) => setMealType(e.target.value)}
                        className="w-full rounded-lg border border-border bg-bg px-2.5 py-1.5 font-body text-xs text-ink outline-none"
                      >
                        <option value="Breakfast">Breakfast</option>
                        <option value="Lunch">Lunch</option>
                        <option value="Dinner">Dinner</option>
                        <option value="Snack">Snack</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-muted mb-1 uppercase tracking-wider">Logging Notes</label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full rounded-lg border border-border bg-bg px-2.5 py-1.5 font-body text-xs text-ink outline-none"
                      />
                    </div>
                  </div>

                  {/* Success banner */}
                  {logSuccess && (
                    <div className="flex items-center gap-1.5 p-2 rounded-lg border border-success/30 bg-success-light text-success text-[11px] font-semibold font-body animate-pulse">
                      <Check size={14} strokeWidth={3} />
                      <span>Meal logged to database diary successfully!</span>
                    </div>
                  )}

                  <Button
                    onClick={handleLogMeal}
                    disabled={isLogging || logSuccess}
                    className="w-full py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm text-xs font-bold bg-gradient-to-r from-primary to-blue-500 hover:from-primary-dark hover:to-blue-600 transition-all text-white border-0"
                  >
                    {isLogging ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : logSuccess ? (
                      <>Logged in Diary <Check size={14} /></>
                    ) : (
                      <>Log {analysisResult.carbs}g Carbs to Diary <ChevronRight size={14} /></>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* 3. Empty State (Waiting for action) */}
            {!isLoading && !analysisResult && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center text-center p-8 gap-3 justify-center text-muted"
              >
                <div className="h-12 w-12 rounded-2xl bg-bg border border-border flex items-center justify-center text-muted shadow-inner mb-2">
                  <Apple size={24} />
                </div>
                <h4 className="font-display text-xs font-bold text-ink">Analysis Awaiting Input</h4>
                <p className="font-body text-[11px] text-muted max-w-xs leading-relaxed">
                  Supply a food photograph or text description on the left, then click <strong>Analyze Food</strong> to query nutritional details.
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
}

function MetricValue({ label, value, unit, color }) {
  return (
    <div className={`p-3 rounded-xl border flex flex-col items-center justify-center shadow-inner ${color}`}>
      <span className="text-[10px] font-bold font-body uppercase opacity-75">{label}</span>
      <span className="numeral text-base font-extrabold mt-1">
        {value} <span className="text-[10px] font-medium font-body opacity-90">{unit}</span>
      </span>
    </div>
  );
}
