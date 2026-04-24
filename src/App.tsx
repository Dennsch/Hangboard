import React, { useState, useEffect, useRef, useCallback } from 'react';

const PROTOCOL: string[] = [
  "Half Crimp",
  "Half Crimp",
  "Half Crimp",
  "Half Crimp",
  "Half Crimp",
  "Half Crimp",
  "3 Finger Drag",
  "3 Finger Drag",
  "3 Finger Drag",
  "3 Finger Drag",
  "3 Finger Drag",
  "3 Finger Drag",
  "Index/Middle Drag",
  "Index/Middle Drag",
  "Ring/Middle Drag",
  "Ring/Middle Drag",
  "I/M Half Crimp",
  "I/M Half Crimp",
  "R/M Half Crimp",
  "R/M Half Crimp",
];

const HANG_DURATION = 10;
const REST_DURATION = 20;
const COUNTDOWN_DURATION = 5;
const HANGS_PER_SET = 5;
const TOTAL_SETS = 4;
const RING_CIRCUMFERENCE = 2 * Math.PI * 130;
const GRIP_LEVEL = "LEVEL 3 EDGE";
const GRIP_DEPTH = "20MM DEPTH";

type Phase = 'idle' | 'countdown' | 'hang' | 'rest' | 'complete';

const App: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [isRunning, setIsRunning] = useState(false);
  const [intervalIdx, setIntervalIdx] = useState(0);
  const [hangsCompleted, setHangsCompleted] = useState(0);
  const [secsRemaining, setSecsRemaining] = useState(0);
  const [totalHangTime, setTotalHangTime] = useState(0);
  const [completedHangs, setCompletedHangs] = useState(0);
  const [ringProgress, setRingProgress] = useState(0);
  const [dotStates, setDotStates] = useState<string[]>(Array(PROTOCOL.length).fill(''));
  
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const jobIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hangStartTimeRef = useRef<number>(0);

  // Wake Lock Functions
  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        console.log('Wake Lock acquired');
        
        wakeLockRef.current.addEventListener('release', () => {
          console.log('Wake Lock released');
        });
      } catch (err: any) {
        console.log(`Wake Lock error: ${err.name}, ${err.message}`);
      }
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      } catch (err) {
        console.log('Error releasing wake lock:', err);
      }
    }
  }, []);

  // Visibility handler
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isRunning) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isRunning, requestWakeLock]);

  // Timer tick logic
  useEffect(() => {
    if (!isRunning) return;

    if (secsRemaining <= 0) {
      setRingProgress(1);
      jobIdRef.current = setTimeout(() => transition(), 150);
      return;
    }

    const totalSecs = phase === 'countdown' ? COUNTDOWN_DURATION
                    : phase === 'hang' ? HANG_DURATION
                    : REST_DURATION;
    const elapsed = totalSecs - secsRemaining;
    const progress = elapsed / totalSecs;
    setRingProgress(progress-1);

    jobIdRef.current = setTimeout(() => {
      setSecsRemaining(prev => prev - 1);
    }, 1000);

    return () => {
      if (jobIdRef.current) clearTimeout(jobIdRef.current);
    };
  }, [isRunning, secsRemaining, phase]);

  // Transition between phases
  const transition = useCallback(() => {
    if (phase === 'countdown') {
      setPhase('hang');
      setSecsRemaining(HANG_DURATION);
      hangStartTimeRef.current = Date.now();
      setDotStates(prev => {
        const newStates = [...prev];
        newStates[intervalIdx] = 'active';
        return newStates;
      });
    } else if (phase === 'hang') {
      const elapsed = (Date.now() - hangStartTimeRef.current) / 1000;
      setTotalHangTime(prev => prev + elapsed);
      setCompletedHangs(prev => prev + 1);
      setHangsCompleted(prev => prev + 1);
      
      setDotStates(prev => {
        const newStates = [...prev];
        newStates[intervalIdx] = 'done';
        return newStates;
      });

      if (intervalIdx >= PROTOCOL.length - 1) {
        setPhase('complete');
        setIsRunning(false);
        setRingProgress(0);
        releaseWakeLock();
        return;
      }
      
      setPhase('rest');
      setSecsRemaining(REST_DURATION);
    } else if (phase === 'rest') {
      setIntervalIdx(prev => prev + 1);
      setPhase('hang');
      setSecsRemaining(HANG_DURATION);
      hangStartTimeRef.current = Date.now();
      setDotStates(prev => {
        const newStates = [...prev];
        newStates[intervalIdx + 1] = 'active';
        return newStates;
      });
    }
  }, [phase, intervalIdx, releaseWakeLock]);

  // Play/Pause toggle
  const togglePlay = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);
      releaseWakeLock();
      if (jobIdRef.current) clearTimeout(jobIdRef.current);
    } else {
      setIsRunning(true);
      requestWakeLock();
      
      if (hangsCompleted === 0 && phase === 'idle') {
        setPhase('countdown');
        setSecsRemaining(COUNTDOWN_DURATION);
        setRingProgress(0);
      }
    }
  }, [isRunning, hangsCompleted, phase, requestWakeLock, releaseWakeLock]);

  // Reset
  const reset = useCallback(() => {
    setIsRunning(false);
    setPhase('idle');
    setIntervalIdx(0);
    setHangsCompleted(0);
    setSecsRemaining(0);
    setTotalHangTime(0);
    setCompletedHangs(0);
    setRingProgress(0);
    setDotStates(Array(PROTOCOL.length).fill(''));
    releaseWakeLock();
    if (jobIdRef.current) clearTimeout(jobIdRef.current);
  }, [releaseWakeLock]);

  // Calculate metrics
  const avgTension = completedHangs > 0 
    ? (totalHangTime / completedHangs).toFixed(1) + 's'
    : '—';
  
  const powerIndex = completedHangs > 0
    ? Math.round((totalHangTime / (completedHangs * HANG_DURATION)) * 100) + '%'
    : '—';

  // Display values
  const currentGripName = phase === 'rest' && intervalIdx + 1 < PROTOCOL.length
    ? PROTOCOL[intervalIdx + 1]
    : PROTOCOL[intervalIdx] || 'Half Crimp';
  
  const displayTime = phase === 'idle' 
    ? String(HANG_DURATION).padStart(2, '0')
    : String(secsRemaining).padStart(2, '0');

  const phaseLabel = phase === 'idle' ? 'READY'
                   : phase === 'countdown' ? 'GET READY'
                   : phase === 'hang' ? 'HANGING'
                   : phase === 'rest' ? 'REST'
                   : 'COMPLETE';

  const phaseLabelClass = phase === 'idle' ? 'phase-label muted'
                        : phase === 'countdown' ? 'phase-label danger'
                        : phase === 'rest' ? 'phase-label rest'
                        : 'phase-label';

  const setNum = Math.floor(intervalIdx / HANGS_PER_SET) + 1;
  const setStatus = phase === 'complete' ? 'DONE!' : `SET ${setNum} OF ${TOTAL_SETS}`;

  const ringProgressClass = phase === 'countdown' ? 'ring-progress danger-phase'
                          : phase === 'rest' ? 'ring-progress rest-phase'
                          : 'ring-progress';

  const offset = RING_CIRCUMFERENCE * (1 - ringProgress);

  const bodyClassName = phase === 'countdown' ? 'countdown-phase'
                      : phase === 'hang' ? 'hang-phase'
                      : phase === 'rest' ? 'rest-phase'
                      : phase === 'complete' ? 'done-state'
                      : '';

  // Apply body class
  useEffect(() => {
    document.body.className = bodyClassName;
  }, [bodyClassName]);

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="brand">VOLT CLIMB</div>
      </header>

      {/* Target Grip Info */}
      <section className="grip-section">
        <div className="grip-section-label">TARGET GRIP POSITION</div>
        <div className="grip-title">{currentGripName}</div>
        <div className="grip-badges">
          <span className="badge badge-accent">{GRIP_LEVEL}</span>
          <span className="badge badge-ghost">{GRIP_DEPTH}</span>
        </div>
      </section>

      {/* Timer Ring */}
      <div className="timer-ring-wrap">
        <svg className="timer-ring" viewBox="0 0 300 300">
          <circle className="ring-track" cx="150" cy="150" r="130"/>
          <circle 
            className={ringProgressClass}
            cx="150" 
            cy="150" 
            r="130"
            strokeDasharray="816.8"
            strokeDashoffset={offset}
            style={{ transition: secsRemaining === 0 ? 'none' : '' }}
          />
        </svg>
        <div className="timer-center">
          <div className={phaseLabelClass}>{phaseLabel}</div>
          <div className="timer-display">{displayTime}</div>
          <div className="timer-unit">SECONDS LEFT</div>
        </div>
      </div>

      {/* Progress Card */}
      <div className="progress-card">
        <div className="progress-top">
          <div className="progress-left">
            <div className="progress-card-label">PROGRESS</div>
            <div className="progress-count">
              <span className="progress-current">{hangsCompleted}</span>
              <span className="progress-sep">/20</span>
            </div>
          </div>
          <div className="progress-right">
            <div className="progress-card-label">STATUS</div>
            <div className="progress-status">{setStatus}</div>
          </div>
        </div>
        <div className="grip-track">
          {PROTOCOL.map((_, idx) => (
            <div 
              key={idx}
              className={`grip-dot ${dotStates[idx]}`}
            />
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.6"/>
              <path d="M9 5v4l2.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-label">AVG TENSION</div>
          <div className="stat-value">{avgTension}</div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M10 2L4 10h5l-1 6 7-9h-5l1-5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-label">POWER INDEX</div>
          <div className="stat-value">{powerIndex}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls">
        <button 
          className="ctrl-btn ctrl-ghost" 
          aria-label="Reset"
          onClick={reset}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3.5 10a6.5 6.5 0 1 1 1.6 4.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M3.5 14.5v-4.5h4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          RESET
        </button>
        <button 
          className="ctrl-btn ctrl-primary" 
          aria-label={isRunning ? "Pause" : "Start"}
          onClick={togglePlay}
          disabled={phase === 'complete'}
        >
          {isRunning ? (
            <>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect x="5" y="4" width="4" height="14" rx="1.5" fill="currentColor"/>
                <rect x="13" y="4" width="4" height="14" rx="1.5" fill="currentColor"/>
              </svg>
              <span>PAUSE</span>
            </>
          ) : (
            <>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M7.5 5L16.5 11 7.5 17V5z" fill="currentColor"/>
              </svg>
              <span>START</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default App;
