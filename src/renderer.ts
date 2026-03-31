class TrainingTimer {
  private hangDuration: number = 10;
  private restDuration: number = 20;
  private totalIntervals: number = 5;
  private intervalNum: number = 0;
  private secsRemaining: number = 0;
  private activeFlag: boolean = false;
  private hangFlag: boolean = false;
  private jobId: NodeJS.Timeout | null = null;
  private gripImageFile: string | null = null;
  private gripPhotoUrl: string | null = null;

  // UI Elements
  private intervalsInput!: HTMLInputElement;
  private imageSelectBtn!: HTMLButtonElement;
  private imageLabelSpan!: HTMLSpanElement;
  private imageFileInput!: HTMLInputElement;
  private phaseText!: HTMLElement;
  private timerText!: HTMLElement;
  private counterText!: HTMLElement;
  private gripImage!: HTMLImageElement;
  private startBtn!: HTMLButtonElement;
  private pauseBtn!: HTMLButtonElement;
  private resetBtn!: HTMLButtonElement;

  constructor() {
    this.initializeElements();
    this.setupEventListeners();
    this.createPlaceholder();
  }

  private initializeElements(): void {
    this.intervalsInput = document.getElementById('intervals') as HTMLInputElement;
    this.imageSelectBtn = document.getElementById('image-select') as HTMLButtonElement;
    this.imageLabelSpan = document.getElementById('image-label') as HTMLSpanElement;
    this.imageFileInput = document.getElementById('image-file-input') as HTMLInputElement;
    this.phaseText = document.getElementById('phase-text') as HTMLElement;
    this.timerText = document.getElementById('timer-text') as HTMLElement;
    this.counterText = document.getElementById('counter-text') as HTMLElement;
    this.gripImage = document.getElementById('grip-image') as HTMLImageElement;
    this.startBtn = document.getElementById('start-btn') as HTMLButtonElement;
    this.pauseBtn = document.getElementById('pause-btn') as HTMLButtonElement;
    this.resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;
  }

  private setupEventListeners(): void {
    this.imageSelectBtn.addEventListener('click', () => this.selectImage());
    this.imageFileInput.addEventListener('change', (e) => this.handleImageChange(e));
    this.startBtn.addEventListener('click', () => this.begin());
    this.pauseBtn.addEventListener('click', () => this.stop());
    this.resetBtn.addEventListener('click', () => this.reset());
  }

  private createPlaceholder(): void {
    // Create placeholder using a data URL
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'lightgray';
      ctx.fillRect(0, 0, 400, 300);
    }
    this.gripImage.src = canvas.toDataURL();
  }

  private selectImage(): void {
    // Trigger the hidden file input
    this.imageFileInput.click();
  }

  private handleImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.gripImageFile = file.name;
      const fileURL = URL.createObjectURL(file);
      this.gripPhotoUrl = fileURL;
      this.imageLabelSpan.textContent = file.name;
    }
  }

  private begin(): void {
    if (!this.activeFlag) {
      this.activeFlag = true;
      this.startBtn.disabled = true;
      this.pauseBtn.disabled = false;

      if (this.intervalNum === 0) {
        this.totalIntervals = parseInt(this.intervalsInput.value, 10);
        this.intervalNum = 1;
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

    if (this.jobId) {
      clearTimeout(this.jobId);
    }

    this.phaseText.textContent = 'Ready';
    this.timerText.textContent = '00:00';
    this.counterText.textContent = 'Interval: 0 / 0';
    this.startBtn.disabled = false;
    this.pauseBtn.disabled = true;
    this.createPlaceholder();
  }

  private tick(): void {
    if (!this.activeFlag) {
      return;
    }

    if (this.secsRemaining > 0) {
      this.phaseText.textContent = this.hangFlag ? 'HANG' : 'REST';
      this.timerText.textContent = this.formatTime(this.secsRemaining);

      if (this.hangFlag && this.gripPhotoUrl) {
        this.gripImage.src = this.gripPhotoUrl;
      } else {
        this.createPlaceholder();
      }

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
      if (this.intervalNum < this.totalIntervals) {
        this.intervalNum += 1;
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
    this.createPlaceholder();
    alert('Session finished!');
  }

  private updateCounter(): void {
    this.counterText.textContent = `Interval: ${this.intervalNum} / ${this.totalIntervals}`;
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
