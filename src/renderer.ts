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

const HANG_DURATION      = 10;
const REST_DURATION      = 20;
const COUNTDOWN_DURATION = 5;
const HANGS_PER_SET      = 5;
const TOTAL_SETS         = 4;

// Ring: r=130, viewBox 300x300 → circumference = 2π×130 ≈ 816.8
const RING_CIRCUMFERENCE = 2 * Math.PI * 130;

// Grip info per position (level + depth labels)
const GRIP_LEVEL = "LEVEL 3 EDGE";
const GRIP_DEPTH = "20MM DEPTH";

class HangboardTimer {
  private intervalIdx      = 0;      // 0-based index into PROTOCOL
  private hangsCompleted   = 0;
  private secsRemaining    = 0;
  private isRunning        = false;
  private isHang           = false;
  private isCountdown      = false;
  private jobId: ReturnType<typeof setTimeout> | null = null;

  // Metrics tracking
  private hangStartTime    = 0;
  private totalHangTime    = 0;
  private completedHangs   = 0;

  // Elements
  private phaseLabel!:    HTMLElement;
  private timerDisplay!:  HTMLElement;
  private gripName!:      HTMLElement;
  private levelBadge!:    HTMLElement;
  private depthBadge!:    HTMLElement;
  private currentHangEl!: HTMLElement;
  private setStatus!:     HTMLElement;
  private ringProgress!:  SVGCircleElement;
  private startBtn!:      HTMLButtonElement;
  private startLabel!:    HTMLElement;
  private playIcon!:      HTMLElement;
  private pauseIcon!:     HTMLElement;
  // private avgTension!:    HTMLElement;
  // private powerIndex!:    HTMLElement;

  constructor() {
    this.query();
    this.buildDots();
    this.bindButtons();
    this.renderIdle();
  }

  private query() {
    this.phaseLabel    = document.getElementById('phase-label')!;
    this.timerDisplay  = document.getElementById('timer-display')!;
    this.gripName      = document.getElementById('grip-name')!;
    this.levelBadge    = document.getElementById('level-badge')!;
    this.depthBadge    = document.getElementById('depth-badge')!;
    this.currentHangEl = document.getElementById('current-hang')!;
    this.setStatus     = document.getElementById('set-status')!;
    this.ringProgress  = document.getElementById('ring-progress') as unknown as SVGCircleElement;
    this.startBtn      = document.getElementById('start-btn') as HTMLButtonElement;
    this.startLabel    = document.getElementById('start-label')!;
    this.playIcon      = document.getElementById('play-icon')!;
    this.pauseIcon     = document.getElementById('pause-icon')!;
    // this.avgTension    = document.getElementById('avg-tension')!;
    // this.powerIndex    = document.getElementById('power-index')!;
  }

  private buildDots() {
    const track = document.getElementById('grip-track')!;
    for (let i = 0; i < PROTOCOL.length; i++) {
      const dot = document.createElement('div');
      dot.className = 'grip-dot';
      dot.id = `dot-${i}`;
      track.appendChild(dot);
    }
  }

  private bindButtons() {
    this.startBtn.addEventListener('click', () => this.togglePlay());
    document.getElementById('reset-btn')!.addEventListener('click', () => this.reset());
  }

  // ─── State machine ──────────────────────────────────────────

  private togglePlay() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.play();
    }
  }

  private play() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.showPauseIcon();

    if (this.hangsCompleted === 0 && !this.isHang && !this.isCountdown) {
      this.beginCountdown();
    } else {
      this.tick();
    }
  }

  private pause() {
    this.isRunning = false;
    this.showPlayIcon();
    if (this.jobId) clearTimeout(this.jobId);
  }

  private reset() {
    this.pause();
    this.intervalIdx    = 0;
    this.hangsCompleted = 0;
    this.secsRemaining  = 0;
    this.isHang         = false;
    this.isCountdown    = false;
    this.totalHangTime  = 0;
    this.completedHangs = 0;
    document.body.className = '';
    this.renderIdle();
    this.resetDots();
  }

  private beginCountdown() {
    this.isCountdown  = true;
    this.isHang       = false;
    this.secsRemaining = COUNTDOWN_DURATION;
    document.body.className = 'countdown-phase';
    this.phaseLabel.textContent = 'GET READY';
    this.phaseLabel.className   = 'phase-label danger';
    this.updateGripDisplay(0);
    this.snapRingToZero();
    this.tick();
  }

  private beginHang() {
    this.isHang        = true;
    this.isCountdown   = false;
    this.secsRemaining = HANG_DURATION;
    this.hangStartTime = Date.now();
    document.body.className = 'hang-phase';
    this.updateDot('active');
    this.renderPhase();
    this.tick();
  }

  private beginRest() {
    this.isHang        = false;
    this.secsRemaining = REST_DURATION;
    document.body.className = 'rest-phase';
    this.updateDot('done');
    this.renderPhase();
    this.tick();
  }

  private tick() {
    if (!this.isRunning) return;

    if (this.secsRemaining <= 0) {
      this.setRingProgress(1);
      this.timerDisplay.textContent = '00';
      this.jobId = setTimeout(() => this.transition(), 150);
      return;
    }

    this.updateTimer();
    this.secsRemaining--;
    this.jobId = setTimeout(() => this.tick(), 1000);
  }

  private transition() {
    if (this.isCountdown) {
      this.isCountdown = false;
      this.beginHang();
    } else if (this.isHang) {
      // Record actual hang time
      const elapsed = (Date.now() - this.hangStartTime) / 1000;
      this.totalHangTime += elapsed;
      this.completedHangs++;

      this.hangsCompleted++;
      this.currentHangEl.textContent = String(this.hangsCompleted);
      this.updateMetrics();

      if (this.intervalIdx >= PROTOCOL.length - 1) {
        this.complete();
        return;
      }
      this.beginRest();
    } else {
      this.intervalIdx++;
      this.beginHang();
    }
  }

  private complete() {
    this.isRunning = false;
    this.isHang    = false;
    document.body.className = 'done-state';
    this.phaseLabel.textContent = 'COMPLETE';
    this.phaseLabel.className   = 'phase-label';
    this.timerDisplay.textContent = '00';
    this.setStatus.textContent  = 'DONE!';
    this.snapRingToZero();
    this.showPlayIcon();
    this.startBtn.disabled = true;
    this.updateMetrics();
  }

  // ─── Render helpers ─────────────────────────────────────────

  private renderIdle() {
    this.phaseLabel.textContent = 'READY';
    this.phaseLabel.className   = 'phase-label muted';
    this.timerDisplay.textContent = String(HANG_DURATION).padStart(2, '0');
    this.currentHangEl.textContent = '0';
    this.setStatus.textContent  = 'SET 1 OF 4';
    this.updateGripDisplay(0);
    this.snapRingToZero();
    this.showPlayIcon();
    this.startBtn.disabled = false;
    // this.avgTension.textContent = '—';
    // this.powerIndex.textContent = '—';
  }

  private renderPhase() {
    this.snapRingToZero();
    const setNum = Math.floor(this.intervalIdx / HANGS_PER_SET) + 1;
    this.setStatus.textContent = `SET ${setNum} OF ${TOTAL_SETS}`;

    if (this.isHang) {
      this.phaseLabel.textContent = 'HANGING';
      this.phaseLabel.className   = 'phase-label';
      this.updateGripDisplay(this.intervalIdx);
      this.ringProgress.classList.remove('rest-phase', 'danger-phase');
    } else {
      this.phaseLabel.textContent = 'REST';
      this.phaseLabel.className   = 'phase-label rest';
      const nextIdx = this.intervalIdx + 1;
      if (nextIdx < PROTOCOL.length) {
        this.updateGripDisplay(nextIdx);
      }
      this.ringProgress.classList.add('rest-phase');
      this.ringProgress.classList.remove('danger-phase');
    }
  }

  private updateGripDisplay(idx: number) {
    this.gripName.textContent    = PROTOCOL[idx] || '—';
    this.levelBadge.textContent  = GRIP_LEVEL;
    this.depthBadge.textContent  = GRIP_DEPTH;
  }

  private updateTimer() {
    const totalSecs = this.isCountdown ? COUNTDOWN_DURATION
                    : this.isHang      ? HANG_DURATION
                    :                    REST_DURATION;
    const elapsed  = totalSecs - this.secsRemaining;
    const progress = elapsed / totalSecs;
    this.setRingProgress(progress);
    this.timerDisplay.textContent = String(this.secsRemaining).padStart(2, '0');

    if (this.isCountdown) {
      this.phaseLabel.textContent = 'GET READY';
      this.ringProgress.classList.add('danger-phase');
      this.ringProgress.classList.remove('rest-phase');
    }
  }

  private updateMetrics() {
    if (this.completedHangs === 0) return;

    // // const avg = this.totalHangTime / this.completedHangs;
    // // this.avgTension.textContent = avg.toFixed(1) + 's';

    // // Power index: ratio of actual hang time to total possible hang time (0–100%)
    // const maxHangTime = this.completedHangs * HANG_DURATION;
    // const pwr = Math.round((this.totalHangTime / maxHangTime) * 100);
    // this.powerIndex.textContent = pwr + '%';
  }

  private setRingProgress(pct: number) {
    const offset = RING_CIRCUMFERENCE * (1 - pct);
    this.ringProgress.style.strokeDashoffset = String(offset);
  }

  private snapRingToZero() {
    this.ringProgress.style.transition = 'none';
    this.setRingProgress(0);
    void (this.ringProgress as unknown as SVGCircleElement & { getBoundingClientRect: () => void }).getBoundingClientRect();
    this.ringProgress.style.transition = '';
  }

  private updateDot(state: 'active' | 'done') {
    document.querySelectorAll('.grip-dot.active').forEach(d => {
      d.classList.remove('active', 'rest-active');
    });
    const dot = document.getElementById(`dot-${this.intervalIdx}`);
    if (!dot) return;
    if (state === 'active') {
      dot.classList.add('active');
    } else {
      dot.classList.add('done');
    }
  }

  private resetDots() {
    document.querySelectorAll('.grip-dot').forEach(d => {
      d.className = 'grip-dot';
    });
  }

  private showPlayIcon() {
    this.playIcon.style.display  = '';
    this.pauseIcon.style.display = 'none';
    this.startLabel.textContent  = 'START';
  }

  private showPauseIcon() {
    this.playIcon.style.display  = 'none';
    this.pauseIcon.style.display = '';
    this.startLabel.textContent  = 'PAUSE';
  }
}

document.addEventListener('DOMContentLoaded', () => new HangboardTimer());
