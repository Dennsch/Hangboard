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
  "Index/Middle Finger Drag",
  "Index/Middle Finger Drag",
  "Ring/Middle Finger Drag",
  "Ring/Middle Finger Drag",
  "Index/Middle Half Crimp",
  "Index/Middle Half Crimp",
  "Ring/Middle Half Crimp",
  "Ring/Middle Half Crimp",
];

const HANG_DURATION = 10;
const REST_DURATION = 20;
const COUNTDOWN_DURATION = 5;
const RING_CIRCUMFERENCE = 2 * Math.PI * 108; // ~678.6

class HangboardTimer {
  private intervalIdx = 0;        // 0-based into PROTOCOL
  private hangsCompleted = 0;
  private secsRemaining = 0;
  private isRunning = false;
  private isHang = false;
  private isCountdown = false;
  private jobId: ReturnType<typeof setTimeout> | null = null;

  // Elements
  private phaseLabel!: HTMLElement;
  private timerDisplay!: HTMLElement;
  private gripName!: HTMLElement;
  private currentHangEl!: HTMLElement;
  private nextUp!: HTMLElement;
  private nextGrip!: HTMLElement;
  private ringProgress!: SVGCircleElement;
  private startBtn!: HTMLButtonElement;
  private playIcon!: HTMLElement;
  private pauseIcon!: HTMLElement;

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
    this.currentHangEl = document.getElementById('current-hang')!;
    this.nextUp        = document.getElementById('next-up')!;
    this.nextGrip      = document.getElementById('next-grip')!;
    this.ringProgress  = document.getElementById('ring-progress') as unknown as SVGCircleElement;
    this.startBtn      = document.getElementById('start-btn') as HTMLButtonElement;
    this.playIcon      = document.getElementById('play-icon')!;
    this.pauseIcon     = document.getElementById('pause-icon')!;
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

  // ─── State machine ─────────────────────────────────────────

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

    // First start
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
    this.intervalIdx = 0;
    this.hangsCompleted = 0;
    this.secsRemaining = 0;
    this.isHang = false;
    this.isCountdown = false;
    document.body.className = '';
    this.renderIdle();
    this.resetDots();
  }

  private beginCountdown() {
    this.isCountdown = true;
    this.isHang = false;
    this.secsRemaining = COUNTDOWN_DURATION;
    document.body.className = 'countdown-phase';
    this.phaseLabel.textContent = 'GET READY';
    this.phaseLabel.className = 'phase-label countdown';
    this.gripName.textContent = PROTOCOL[0];
    this.nextGrip.textContent = PROTOCOL[0];
    this.nextUp.classList.add('visible');
    this.ringProgress.classList.remove('rest-phase');
    this.tick();
  }

  private beginHang() {
    this.isHang = true;
    this.secsRemaining = HANG_DURATION;
    document.body.className = 'hang-phase';
    this.updateDot('active');
    this.renderPhase();
    this.tick();
  }

  private beginRest() {
    this.isHang = false;
    this.secsRemaining = REST_DURATION;
    document.body.className = 'rest-phase';
    this.updateDot('done');
    this.renderPhase();
    this.tick();
  }

  private tick() {
    if (!this.isRunning) return;

    this.updateTimer();

    if (this.secsRemaining <= 0) {
      this.transition();
      return;
    }

    this.secsRemaining--;
    this.jobId = setTimeout(() => this.tick(), 1000);
  }

  private transition() {
    if (this.isCountdown) {
      this.isCountdown = false;
      this.beginHang();
    } else if (this.isHang) {
      this.hangsCompleted++;
      this.currentHangEl.textContent = String(this.hangsCompleted);

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
    this.isHang = false;
    document.body.className = 'done-state';
    this.phaseLabel.textContent = 'COMPLETE';
    this.phaseLabel.className = 'phase-label hang';
    this.timerDisplay.textContent = '00:00';
    this.gripName.textContent = 'Session done!';
    this.nextUp.classList.remove('visible');
    this.setRingProgress(1);
    this.showPlayIcon();
    this.startBtn.disabled = true;
  }

  // ─── Render helpers ─────────────────────────────────────────

  private renderIdle() {
    this.phaseLabel.textContent = 'READY';
    this.phaseLabel.className = 'phase-label';
    this.timerDisplay.textContent = '00:00';
    this.gripName.textContent = '—';
    this.currentHangEl.textContent = '0';
    this.nextUp.classList.remove('visible');
    this.setRingProgress(0);
    this.showPlayIcon();
    this.startBtn.disabled = false;
  }

  private renderPhase() {
    const totalSecs = this.isHang ? HANG_DURATION : REST_DURATION;
    const progress = (totalSecs - this.secsRemaining) / totalSecs;
    this.setRingProgress(progress);

    if (this.isHang) {
      this.phaseLabel.textContent = 'HANG';
      this.phaseLabel.className = 'phase-label hang';
      this.gripName.textContent = PROTOCOL[this.intervalIdx];
      this.ringProgress.classList.remove('rest-phase');

      const nextIdx = this.intervalIdx + 1;
      if (nextIdx < PROTOCOL.length) {
        this.nextGrip.textContent = PROTOCOL[nextIdx];
        this.nextUp.classList.add('visible');
      } else {
        this.nextUp.classList.remove('visible');
      }
    } else {
      this.phaseLabel.textContent = 'REST';
      this.phaseLabel.className = 'phase-label rest';
      const nextIdx = this.intervalIdx + 1;
      this.gripName.textContent = nextIdx < PROTOCOL.length
        ? `Next: ${PROTOCOL[nextIdx]}`
        : 'Last one!';
      this.ringProgress.classList.add('rest-phase');

      if (nextIdx < PROTOCOL.length) {
        this.nextGrip.textContent = PROTOCOL[nextIdx];
        this.nextUp.classList.add('visible');
      }
    }
  }

  private updateTimer() {
    const totalSecs = this.isCountdown ? COUNTDOWN_DURATION
                    : this.isHang      ? HANG_DURATION
                    :                    REST_DURATION;
    const progress = 1 - this.secsRemaining / totalSecs;
    this.setRingProgress(progress);
    this.timerDisplay.textContent = this.fmt(this.secsRemaining);

    if (this.isCountdown) {
      this.phaseLabel.textContent = 'GET READY';
    }
  }

  private setRingProgress(pct: number) {
    // pct 0 = empty ring, 1 = full ring
    const offset = RING_CIRCUMFERENCE * (1 - pct);
    this.ringProgress.style.strokeDashoffset = String(offset);
  }

  private updateDot(state: 'active' | 'done') {
    // Clear previous active
    document.querySelectorAll('.grip-dot.active').forEach(d => d.classList.remove('active', 'rest-active'));
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
    this.playIcon.style.display = '';
    this.pauseIcon.style.display = 'none';
  }

  private showPauseIcon() {
    this.playIcon.style.display = 'none';
    this.pauseIcon.style.display = '';
  }

  private fmt(secs: number): string {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
}

document.addEventListener('DOMContentLoaded', () => new HangboardTimer());
