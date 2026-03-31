# Hangboard
A timer application for hangboard training that alternates between hang and rest periods with visual feedback.

## Features

- **Configurable Intervals**: Set the number of hang/rest cycles (1-20)
- **10-second Hang Phase**: Training period with visual finger position image
- **20-second Rest Phase**: Recovery period between hangs
- **Image Display**: Show custom finger position images during hang phases
- **Visual Timer**: Large, easy-to-read countdown display
- **Progress Tracking**: Shows current interval number and total intervals
- **Pause/Resume**: Pause the session and resume where you left off
- **Reset Function**: Start over at any time

## Requirements

- Python 3.7+
- tkinter (usually included with Python)
- Pillow (PIL)

## Installation

Install the required dependencies:

```bash
pip install -r requirements.txt
```

## Usage

Run the application:

```bash
python hangboard.py
```

1. Set the number of intervals in the settings section
2. (Optional) Load a finger position image to display during hangs
3. Click "Start" to begin the training session
4. The timer will alternate between 10-second hangs and 20-second rests
5. Use "Pause" to temporarily stop, "Reset" to start over

## Configuration

- **Number of Intervals**: Configure how many hang/rest cycles to perform
- **Finger Position Image**: Load an image (PNG, JPG, GIF, BMP) to display during hang phases

## Timer Sequence

Each interval consists of:
1. **HANG** - 10 seconds (displays finger position image)
2. **REST** - 20 seconds (clears image)

This sequence repeats for the configured number of intervals.
