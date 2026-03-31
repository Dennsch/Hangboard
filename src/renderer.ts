class TrainingTimer {
  // Fixed protocol
  private protocol: string[] = [
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
    "Ring/Middle Half Crimp"
  ];

  private hangDuration: number = 10;
  private restDuration: number = 20;
  private totalIntervals: number = 20;
  private intervalNum: number = 0; // 0-based index for protocol array
  private currentHangNum: number = 0; // 1-based display number
  private secsRemaining: number = 0;
  private activeFlag: boolean = false;
  private hangFlag: boolean = false;
  private jobId: NodeJS.Timeout | null = null;

  // UI Elements
  private phaseText!: HTMLElement;
  private timerText!: HTMLElement;
  private counterText!: HTMLElement;
  private startBtn!: HTMLButtonElement;
  private pauseBtn!: HTMLButtonElement;
  private resetBtn!: HTMLButtonElement;

  constructor() {
    this.initializeElements();
    this.setupEventListeners();
  }

  private initializeElements(): void {
    this.phaseText = document.getElementById('phase-text') as HTMLElement;
    this.timerText = document.getElementById('timer-text') as HTMLElement;
    this.counterText = document.getElementById('counter-text') as HTMLElement;
    this.startBtn = document.getElementById('start-btn') as HTMLButtonElement;
    this.pauseBtn = document.getElementById('pause-btn') as HTMLButtonElement;
    this.resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;
  }

  private setupEventListeners(): void {
    this.startBtn.addEventListener('click', () => this.begin());
    this.pauseBtn.addEventListener('click', () => this.stop());
    this.resetBtn.addEventListener('click', () => this.reset());
  }

  private begin(): void {
    if (!this.activeFlag) {
      this.activeFlag = true;
      this.startBtn.disabled = true;
      this.pauseBtn.disabled = false;

      if (this.currentHangNum === 0) {
        this.totalIntervals = this.protocol.length;
        this.intervalNum = 0;
        this.currentHangNum = 1;
        this.hangFlag = true;
        this.secsRemaining = this.hangDuration;
        this.updateCounter();
      }

      this.tick();
    }
  }

  private stop(): void {
    if (this.activeFlag) {
      this.activeFlag = false;
      this.startBtn.disabled = false;
      this.pauseBtn.disabled = true;
      if (this.jobId) {
        clearTimeout(this.jobId);
      }
    }
  }

  private reset(): void {
    this.activeFlag = false;
    this.intervalNum = 0;
    this.secsRemaining = 0;
    this.hangFlag = false;
    this.currentHangNum = 0;

    if (this.jobId) {
      clearTimeout(this.jobId);
    }

    this.phaseText.textContent = 'Ready';
    this.timerText.textContent = '00:00';
    this.counterText.textContent = 'Interval: 0 / 0';
    this.startBtn.disabled = false;
    this.pauseBtn.disabled = true;
  }

  private tick(): void {
    if (!this.activeFlag) {
      return;
    }

    if (this.secsRemaining > 0) {
      if (this.hangFlag) {
        // During hang, show current hang type
        const currentGrip = this.protocol[this.intervalNum];
        this.phaseText.textContent = `HANG: ${currentGrip}`;
      } else {
        // During rest, show upcoming hang type
        const nextIndex = this.intervalNum + 1;
        if (nextIndex < this.protocol.length) {
          const nextGrip = this.protocol[nextIndex];
          this.phaseText.textContent = `REST - Next: ${nextGrip}`;
        } else {
          this.phaseText.textContent = 'REST - Last one!';
        }
      }
      this.timerText.textContent = this.formatTime(this.secsRemaining);

      this.secsRemaining -= 1;
      this.jobId = setTimeout(() => this.tick(), 1000);
    } else {
      this.transition();
    }
  }

  private transition(): void {
    if (this.hangFlag) {
      this.hangFlag = false;
      this.secsRemaining = this.restDuration;
      this.tick();
    } else {
      if (this.intervalNum < this.totalIntervals - 1) {
        this.intervalNum++;
        this.currentHangNum++;
        this.hangFlag = true;
        this.secsRemaining = this.hangDuration;
        this.updateCounter();
        this.tick();
      } else {
        this.complete();
      }
    }
  }

  private complete(): void {
    this.activeFlag = false;
    this.phaseText.textContent = 'Done!';
    this.timerText.textContent = '00:00';
    this.startBtn.disabled = false;
    this.pauseBtn.disabled = true;
    alert('Session finished!');
  }

  private updateCounter(): void {
    this.counterText.textContent = `Hang: ${this.currentHangNum} / ${this.totalIntervals}`;
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

// Initialize the timer when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new TrainingTimer();
});
