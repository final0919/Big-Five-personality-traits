/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardList, 
  Lock, 
  ArrowRight, 
  ArrowLeft, 
  User, 
  Calendar, 
  Users, 
  CheckCircle2, 
  RotateCcw,
  Info,
  MessageSquare,
  ShieldCheck,
  Zap,
  Heart,
  Brain,
  Compass,
  Activity,
  Briefcase,
  Lightbulb
} from 'lucide-react';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { QUESTIONS_15, QUESTIONS_118 } from './data';
import { DIMENSION_CONFIG, DIMENSION_INTERPRETATIONS, SUB_DIMENSION_INTERPRETATIONS, REPORT_TEXTS } from './constants';
import { Dimension, UserInfo, QuizResult, Question } from './types';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

import html2pdf from 'html2pdf.js';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ACTIVATION_CODE = "BIG5-118";

export default function App() {
  const [page, setPage] = useState<'home' | 'activation' | 'quiz' | 'report'>('home');
  const [quizType, setQuizType] = useState<'15' | '118'>('15');
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: '造物主', gender: '保密', age: '未知' });
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [activationInput, setActivationInput] = useState('');
  const [activationError, setActivationError] = useState(false);

  const questions = useMemo(() => quizType === '15' ? QUESTIONS_15 : QUESTIONS_118, [quizType]);

  const handleStart = (type: '15' | '118') => {
    setQuizType(type);
    if (type === '118') {
      setPage('activation');
    } else {
      setPage('quiz');
    }
  };

  const handleActivation = () => {
    if (activationInput.trim().toUpperCase() === ACTIVATION_CODE) {
      setPage('quiz');
      setActivationError(false);
    } else {
      setActivationError(true);
    }
  };

  const handleAnswer = (value: number) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
    
    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(prev => {
          if (prev < questions.length - 1) return prev + 1;
          return prev;
        });
      }, 200);
    } else {
      setPage('report');
    }
  };

  const reset = () => {
    setPage('home');
    setAnswers({});
    setCurrentQuestionIndex(0);
    setActivationInput('');
    setActivationError(false);
  };

  const calculateResults = (): QuizResult => {
    const dimensionScores: Record<Dimension, number[]> = {
      openness: [],
      conscientiousness: [],
      extraversion: [],
      agreeableness: [],
      neuroticism: []
    };

    const subDimensionScores: Record<string, number[]> = {};

    questions.forEach(q => {
      const ans = answers[q.id];
      if (ans !== undefined) {
        q.scorings.forEach(s => {
          let score = ans;
          if (quizType === '118') {
            // 1-5 scale (计分方式1: forward, 计分方式2: reverse)
            // 计分方式1: 1,2,3,4,5 -> 1,2,3,4,5
            // 计分方式2: 1,2,3,4,5 -> 5,4,3,2,1 (reverse)
            if (s.reverse) score = 6 - ans;
          } else {
            // 0-5 scale for 15-question version
            if (s.reverse) score = 5 - ans;
          }
          
          dimensionScores[s.dimension].push(score);

          if (s.subDimension) {
            if (!subDimensionScores[s.subDimension]) {
              subDimensionScores[s.subDimension] = [];
            }
            subDimensionScores[s.subDimension].push(score);
          }
        });
      }
    });

    const scores = {} as Record<Dimension, number>;
    Object.entries(dimensionScores).forEach(([dim, values]) => {
      scores[dim as Dimension] = values.length > 0 
        ? values.reduce((a, b) => a + b, 0) / values.length 
        : 0;
    });

    const subScores: Record<string, number> = {};
    Object.entries(subDimensionScores).forEach(([subDim, values]) => {
      subScores[subDim] = values.length > 0
        ? values.reduce((a, b) => a + b, 0) / values.length
        : 0;
    });

    return { scores, subScores, userInfo, type: quizType };
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-yellow-200">
      <main className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <AnimatePresence mode="wait">
          {page === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12 text-center"
            >
              <div className="space-y-4">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold tracking-wide uppercase"
                >
                  <Zap className="w-4 h-4" />
                  专业心理测评
                </motion.div>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-gray-900">
                  大五人格 · <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-600">性格测试</span>
                </h1>
                <p className="text-xl text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">
                  基于国际权威 NEO-PI-R 框架，深度解析你的性格特质，探索未知的自我。
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                <button
                  onClick={() => handleStart('15')}
                  className="group relative p-8 bg-white rounded-3xl shadow-sm border-2 border-transparent hover:border-yellow-400 transition-all duration-300 text-left overflow-hidden"
                >
                  <div className="relative z-10 space-y-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">15题 DEMO版</h3>
                      <p className="text-gray-500 mt-2">快速了解核心特质，免费体验。</p>
                    </div>
                    <div className="flex items-center text-blue-600 font-bold gap-2 group-hover:gap-4 transition-all">
                      立即开始 <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="absolute -right-4 -bottom-4 text-gray-50 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Zap className="w-32 h-32" />
                  </div>
                </button>

                <button
                  onClick={() => handleStart('118')}
                  className="group relative p-8 bg-gray-900 rounded-3xl shadow-xl border-2 border-transparent hover:border-yellow-400 transition-all duration-300 text-left overflow-hidden"
                >
                  <div className="relative z-10 space-y-4">
                    <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center text-gray-900 group-hover:scale-110 transition-transform">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">118题 完整版</h3>
                      <p className="text-gray-400 mt-2">全维度深度解析，包含30个子维度。</p>
                    </div>
                    <div className="flex items-center text-yellow-400 font-bold gap-2 group-hover:gap-4 transition-all">
                      专业测评 <Lock className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="absolute -right-4 -bottom-4 text-white opacity-5 group-hover:opacity-10 transition-opacity">
                    <ShieldCheck className="w-32 h-32" />
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {page === 'activation' && (
            <motion.div
              key="activation"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md mx-auto"
            >
              <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 space-y-8">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-yellow-100 rounded-3xl flex items-center justify-center text-yellow-600 mx-auto">
                    <Lock className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-black tracking-tight">输入激活码</h2>
                  <p className="text-gray-500 font-medium">验证通过后即可开启 118 题专业版测评</p>
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    value={activationInput}
                    onChange={(e) => setActivationInput(e.target.value)}
                    placeholder="请输入激活码"
                    className={cn(
                      "w-full px-6 py-4 bg-gray-50 border-2 rounded-2xl text-lg font-bold text-center focus:ring-4 focus:ring-yellow-100 transition-all outline-none",
                      activationError ? "border-red-400" : "border-gray-100 focus:border-yellow-400"
                    )}
                  />
                  {activationError && (
                    <p className="text-red-500 text-sm font-bold text-center">❌ 激活码错误，请重试</p>
                  )}
                  <button
                    onClick={handleActivation}
                    className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-lg hover:bg-black transition-all shadow-lg active:scale-[0.98]"
                  >
                    验证并继续
                  </button>
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-2xl text-blue-800">
                    <MessageSquare className="w-6 h-6 shrink-0 mt-1" />
                    <p className="text-sm font-bold leading-relaxed">
                      如需测试完整版请联系客服购买激活码。
                    </p>
                  </div>
                </div>

                <button onClick={reset} className="w-full text-gray-400 font-bold hover:text-gray-600 transition-colors">
                  返回首页
                </button>
              </div>
            </motion.div>
          )}

          {page === 'quiz' && questions[currentQuestionIndex] && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto relative"
            >
              {/* Return Home Button */}
              <button 
                onClick={reset}
                className="absolute -top-12 right-0 flex items-center gap-1 text-gray-400 hover:text-gray-600 font-bold transition-colors z-20"
              >
                <RotateCcw className="w-4 h-4" /> 返回首页
              </button>

              <div className="bg-white p-5 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-xl border border-gray-100 space-y-4 md:space-y-10">
                <div className="space-y-2 md:space-y-3">
                  <div className="flex justify-between items-end">
                    <div className="space-y-0">
                      <p className="text-[10px] font-black text-yellow-600 uppercase tracking-[0.2em]">答题进度</p>
                      <p className="text-xl md:text-3xl font-black tracking-tighter">
                        {currentQuestionIndex + 1} <span className="text-gray-200 font-medium">/ {questions.length}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {quizType === '15' ? 'DEMO版' : '专业版'}
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 h-1 md:h-2 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                      className="bg-yellow-400 h-full rounded-full"
                    />
                  </div>
                </div>

                <div className="min-h-[60px] md:min-h-[120px] flex items-center justify-center text-center">
                  <motion.p 
                    key={currentQuestionIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-lg md:text-2xl font-bold leading-tight text-gray-800"
                  >
                    {questions[currentQuestionIndex].text}
                  </motion.p>
                </div>

                <div className="grid gap-1.5 md:gap-3">
                  {(quizType === '15' ? [
                    { label: '完全不符合', value: 0 },
                    { label: '基本不符合', value: 1 },
                    { label: '一般符合', value: 2 },
                    { label: '比较符合', value: 3 },
                    { label: '基本符合', value: 4 },
                    { label: '完全符合', value: 5 }
                  ] : [
                    { label: '完全不符合', value: 1 },
                    { label: '基本不符合', value: 2 },
                    { label: '一般符合', value: 3 },
                    { label: '基本符合', value: 4 },
                    { label: '完全符合', value: 5 }
                  ]).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleAnswer(opt.value)}
                      className={cn(
                        "w-full p-3.5 md:p-5 rounded-xl md:rounded-2xl text-left font-bold transition-all border-2 flex items-center justify-between active:scale-[0.99]",
                        answers[questions[currentQuestionIndex].id] === opt.value
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-gray-50 text-gray-600 border-gray-100"
                      )}
                    >
                      <span className="text-xs md:text-base">{opt.label}</span>
                      <div className={cn(
                        "w-4 h-4 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center transition-all",
                        answers[questions[currentQuestionIndex].id] === opt.value
                          ? "bg-yellow-400 border-yellow-400"
                          : "border-gray-200"
                      )}>
                        {answers[questions[currentQuestionIndex].id] === opt.value && <CheckCircle2 className="w-2.5 h-2.5 md:w-4 md:h-4 text-gray-900" />}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                    className="flex items-center gap-2 text-gray-400 font-black hover:text-gray-600 disabled:opacity-0 transition-all text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" /> 上一题
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {page === 'report' && (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 relative"
            >
              {/* Return Home Button */}
              <button 
                onClick={reset}
                className="absolute -top-12 right-0 flex items-center gap-1 text-gray-400 hover:text-gray-600 font-bold transition-colors z-20 no-print"
              >
                <RotateCcw className="w-4 h-4" /> 返回首页
              </button>
              <ReportView result={calculateResults()} onRestart={reset} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

const DIMENSION_ICONS: Record<Dimension, React.ReactNode> = {
  conscientiousness: <Briefcase className="w-6 h-6" />,
  agreeableness: <Heart className="w-6 h-6" />,
  neuroticism: <Activity className="w-6 h-6" />,
  extraversion: <Zap className="w-6 h-6" />,
  openness: <Compass className="w-6 h-6" />
};

function ReportView({ result, onRestart }: { result: QuizResult; onRestart: () => void }) {
  const sortedDimensions = useMemo(() => 
    Object.entries(result.scores).sort((a, b) => b[1] - a[1]),
    [result.scores]
  );

  const handleExportPDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;

    // Add a temporary class to the element to optimize for PDF
    element.classList.add('pdf-export-mode');

    // Wait a bit for any layout shifts or animations to settle
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const opt = {
        margin: [10, 10] as [number, number],
        filename: `角色灵魂光谱测评报告_${new Date().toLocaleDateString()}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          logging: false,
          letterRendering: true,
          scrollY: 0,
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight
        },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };

      await html2pdf().from(element).set(opt).save();
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('导出 PDF 失败，请稍后重试。');
    } finally {
      element.classList.remove('pdf-export-mode');
    }
  };

  const chartData = {
    labels: Object.values(DIMENSION_CONFIG).map(d => d.title),
    datasets: [
      {
        label: '得分',
        data: [
          result.scores.openness,
          result.scores.conscientiousness,
          result.scores.extraversion,
          result.scores.agreeableness,
          result.scores.neuroticism,
        ],
        backgroundColor: 'rgba(234, 179, 8, 0.2)',
        borderColor: 'rgba(234, 179, 8, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(234, 179, 8, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(234, 179, 8, 1)',
      },
    ],
  };

  const chartOptions = {
    scales: {
      r: {
        angleLines: { display: true },
        suggestedMin: 0,
        suggestedMax: 5,
        ticks: { stepSize: 1, display: false },
        pointLabels: {
          font: { size: 14, weight: 'bold' as const },
          color: '#1f2937'
        }
      },
    },
    plugins: {
      legend: { display: false },
    },
    maintainAspectRatio: false,
  };

  if (result.type === '15') {
    return (
      <div className="space-y-8" id="report-content">
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-gray-100 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-black tracking-tight text-gray-900">测评结果 <span className="text-blue-600">(DEMO版)</span></h2>
            <p className="text-gray-400 font-bold tracking-widest uppercase text-sm">Character Soul Spectrum Preliminary Analysis</p>
          </div>

          <div className="h-[300px] md:h-[400px] relative bg-gray-50 rounded-3xl p-4">
            <Radar data={chartData} options={chartOptions} />
          </div>

          <div className="grid gap-6">
            {sortedDimensions.map(([dim, score]) => {
              const cfg = DIMENSION_CONFIG[dim as Dimension];
              const level = score >= 4 ? 'high' : (score >= 2.5 ? 'mid' : 'low');
              const interpretation = DIMENSION_INTERPRETATIONS[dim as Dimension][level];
              
              return (
                <div key={dim} className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-yellow-600">
                        {DIMENSION_ICONS[dim as Dimension]}
                      </div>
                      <span className="font-bold text-xl text-gray-800">{cfg.title}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-24 bg-gray-200 h-1.5 rounded-full hidden sm:block overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(score / 5) * 100}%` }}
                          className="bg-yellow-400 h-full rounded-full"
                        />
                      </div>
                      <span className="font-black text-2xl text-yellow-600 w-12 text-right">{score.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">维度介绍</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{cfg.description}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">深度解读</p>
                    <p className="text-sm text-gray-700 font-bold leading-relaxed">{interpretation.characterTraits}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 pt-8 pb-12 no-print">
          <button
            onClick={onRestart}
            className="w-full max-w-md py-5 bg-gray-900 text-white rounded-2xl font-black text-xl hover:bg-black transition-all shadow-xl active:scale-[0.98]"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12" id="report-content">
      {/* Intro Text / Theory Background */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-lg border border-gray-100"
      >
        <div className="max-w-none text-gray-500 font-medium leading-relaxed whitespace-pre-line text-[11px] md:text-xs opacity-80">
          {REPORT_TEXTS.intro}
        </div>
      </motion.div>

      {/* Radar Chart Section / Scores */}
      <section className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-lg border border-gray-100 space-y-8">
        <h3 className="text-3xl font-black tracking-tight flex items-center gap-3">
          <Zap className="w-8 h-8 text-yellow-500" /> 灵魂光谱概览
        </h3>
        <div className="h-[350px] md:h-[500px] relative">
          <Radar data={chartData} options={chartOptions} />
        </div>

        {/* Dimension Scores List */}
        <div className="grid gap-4 pt-8 border-t border-gray-100">
          {sortedDimensions.map(([dim, score]) => (
            <div key={dim} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-yellow-600">
                  {DIMENSION_ICONS[dim as Dimension]}
                </div>
                <span className="font-bold text-gray-800">{DIMENSION_CONFIG[dim as Dimension].title}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-24 bg-gray-200 h-1.5 rounded-full hidden sm:block overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(score / 5) * 100}%` }}
                    className="bg-yellow-400 h-full rounded-full"
                  />
                </div>
                <span className="font-black text-lg text-yellow-600 w-10 text-right">{score.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Module 1: Personality Analysis / Dimension Intro & Interpretation */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Info className="w-8 h-8 text-yellow-500" /> 人格解析
          </h3>
        </div>
        <p className="text-gray-500 font-bold px-2 text-sm">{REPORT_TEXTS.analysisIntro}</p>
        <div className="grid gap-6">
          {sortedDimensions.map(([dim, score]) => {
            const cfg = DIMENSION_CONFIG[dim as Dimension];
            const level = score >= 4 ? 'high' : (score >= 2.5 ? 'mid' : 'low');
            const interpretation = DIMENSION_INTERPRETATIONS[dim as Dimension][level];
            
            return (
              <motion.div 
                key={dim}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-lg border border-gray-100 space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-yellow-600">
                      {DIMENSION_ICONS[dim as Dimension]}
                    </div>
                    <div>
                      <h4 className="text-xl md:text-2xl font-black text-gray-900">{cfg.title}</h4>
                      <p className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest">
                        得分: {score.toFixed(1)} / 5.0
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">角色特点</p>
                      <p className="text-sm md:text-base text-gray-700 font-bold leading-relaxed">{interpretation.characterTraits}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">故事性优势</p>
                      <p className="text-sm md:text-base text-gray-700 font-bold leading-relaxed">{interpretation.storyAdvantages}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">值得挖掘的亮点</p>
                      <p className="text-sm md:text-base text-gray-700 font-bold leading-relaxed">{interpretation.highlights}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">创作可能遇到的困难</p>
                      <p className="text-sm md:text-base text-gray-700 font-bold leading-relaxed">{interpretation.difficulties}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Module 2: Trait Interpretation / Deep Interpretation */}
      <section className="space-y-6">
        <h3 className="text-3xl font-black tracking-tight flex items-center gap-3">
          <Zap className="w-8 h-8 text-yellow-500" /> 特质解读
        </h3>
        <p className="text-gray-500 font-bold px-2 text-sm">{REPORT_TEXTS.traitsIntro}</p>
        
        <div className="grid gap-8">
          {Object.entries(DIMENSION_CONFIG).map(([dim, dimCfg]) => {
            const subInterps = Object.entries(SUB_DIMENSION_INTERPRETATIONS)
              .filter(([key]) => key.startsWith(dim.charAt(0).toUpperCase()))
              .filter(([subKey]) => {
                const score = result.subScores![subKey];
                return score !== undefined && (score < 2.5 || score > 4);
              });

            if (subInterps.length === 0) return null;

            return (
              <div key={dim} className="space-y-4">
                <div className="flex items-center gap-3 px-6 py-3 bg-gray-900 text-white rounded-2xl w-fit">
                  <span className="text-yellow-400">{DIMENSION_ICONS[dim as Dimension]}</span>
                  <span className="text-lg font-black">{dimCfg.title} 细分维度</span>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {subInterps.map(([subKey, subInterp]) => {
                    const score = result.subScores![subKey] || 0;
                    const level = score >= 3.5 ? 'high' : 'low';
                    const text = subInterp[level];
                    
                    return (
                      <motion.div
                        key={subKey}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="bg-white p-6 rounded-3xl shadow-md border border-gray-100 space-y-3"
                      >
                        <div className="flex justify-between items-center">
                          <h5 className="text-lg font-black text-gray-900">{subInterp.title}</h5>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full rounded-full", level === 'high' ? "bg-green-400" : "bg-orange-400")}
                            style={{ width: `${(score / 5) * 100}%` }}
                          />
                        </div>
                        <p className="text-gray-600 text-sm font-bold leading-relaxed">
                          {text}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Outro Text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-gray-900 p-8 md:p-10 rounded-[2.5rem] shadow-xl text-white"
      >
        <div className="max-w-none text-gray-400 font-medium leading-relaxed whitespace-pre-line text-[11px] md:text-xs opacity-80">
          {REPORT_TEXTS.outro}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div className="flex flex-col items-center gap-4 pt-8 pb-12 no-print">
        <button
          onClick={handleExportPDF}
          className="w-full max-w-md py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl font-black text-xl hover:shadow-lg hover:scale-[1.02] transition-all active:scale-[0.98] shadow-xl"
        >
          导出 PDF 报告
        </button>
        <button
          onClick={onRestart}
          className="w-full max-w-md py-5 bg-gray-900 text-white rounded-2xl font-black text-xl hover:bg-black transition-all shadow-xl active:scale-[0.98]"
        >
          返回首页
        </button>
      </div>
    </div>
  );
}
