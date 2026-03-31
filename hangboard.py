#!/usr/bin/env python3
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from PIL import Image, ImageTk
import os


class TrainingTimer:
    def __init__(self, wnd):
        self.wnd = wnd
        wnd.title("Hangboard Timer")
        wnd.geometry("600x700")
        
        self.hang_duration = 10
        self.rest_duration = 20
        self.total_intervals = 5
        self.interval_num = 0
        self.secs_remaining = 0
        self.active_flag = False
        self.hang_flag = False
        self.job_id = None
        self.grip_image_file = None
        self.grip_photo = None
        self.placeholder_photo = None
        
        self.build()
        self.create_placeholder()
    
    def build(self):
        s = ttk.LabelFrame(self.wnd, text="Settings", padding="10")
        s.pack(fill=tk.X, padx=10, pady=10)
        
        ttk.Label(s, text="Intervals:").grid(row=0, column=0, sticky=tk.W, pady=5)
        self.int_ctrl = tk.IntVar(value=self.total_intervals)
        ttk.Spinbox(s, from_=1, to=20, textvariable=self.int_ctrl, width=10).grid(row=0, column=1, pady=5, padx=5)
        
        ttk.Label(s, text="Image:").grid(row=1, column=0, sticky=tk.W, pady=5)
        ttk.Button(s, text="Select", command=self.select_img).grid(row=1, column=1, pady=5, padx=5)
        
        self.img_label_txt = tk.StringVar(value="none")
        ttk.Label(s, textvariable=self.img_label_txt, foreground="gray").grid(row=2, column=0, columnspan=2, sticky=tk.W)
        
        d = ttk.Frame(self.wnd, padding="10")
        d.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        self.phase_txt = tk.StringVar(value="Ready")
        ttk.Label(d, textvariable=self.phase_txt, font=("Arial", 24, "bold")).pack(pady=10)
        
        self.timer_txt = tk.StringVar(value="00:00")
        ttk.Label(d, textvariable=self.timer_txt, font=("Arial", 48, "bold")).pack(pady=10)
        
        self.counter_txt = tk.StringVar(value="Interval: 0 / 0")
        ttk.Label(d, textvariable=self.counter_txt, font=("Arial", 16)).pack(pady=5)
        
        ibox = ttk.LabelFrame(d, text="Finger Position", padding="10")
        ibox.pack(fill=tk.BOTH, expand=True, pady=10)
        
        self.pic = ttk.Label(ibox)
        self.pic.pack(expand=True)
        
        b = ttk.Frame(self.wnd, padding="10")
        b.pack(fill=tk.X, padx=10, pady=10)
        
        self.start_b = ttk.Button(b, text="Start", command=self.begin, width=15)
        self.start_b.pack(side=tk.LEFT, padx=5, expand=True)
        
        self.pause_b = ttk.Button(b, text="Pause", command=self.stop, width=15, state=tk.DISABLED)
        self.pause_b.pack(side=tk.LEFT, padx=5, expand=True)
        
        ttk.Button(b, text="Reset", command=self.reset, width=15).pack(side=tk.LEFT, padx=5, expand=True)
    
    def create_placeholder(self):
        ph = Image.new('RGB', (400, 300), color='lightgray')
        self.placeholder_photo = ImageTk.PhotoImage(ph)
    
    def select_img(self):
        f = filedialog.askopenfilename(filetypes=[("Images", "*.png *.jpg *.jpeg *.gif *.bmp"), ("All", "*.*")])
        if f:
            try:
                self.grip_image_file = f
                im = Image.open(f)
                im.thumbnail((400, 300), Image.Resampling.LANCZOS)
                self.grip_photo = ImageTk.PhotoImage(im)
                self.img_label_txt.set(os.path.basename(f))
            except Exception as e:
                messagebox.showerror("Error", str(e))
    
    def begin(self):
        if not self.active_flag:
            self.active_flag = True
            self.start_b.config(state=tk.DISABLED)
            self.pause_b.config(state=tk.NORMAL)
            
            if self.interval_num == 0:
                self.total_intervals = self.int_ctrl.get()
                self.interval_num = 1
                self.hang_flag = True
                self.secs_remaining = self.hang_duration
                self.update_counter()
            
            self.tick()
    
    def stop(self):
        if self.active_flag:
            self.active_flag = False
            self.start_b.config(state=tk.NORMAL)
            self.pause_b.config(state=tk.DISABLED)
            if self.job_id:
                self.wnd.after_cancel(self.job_id)
    
    def reset(self):
        self.active_flag = False
        self.interval_num = 0
        self.secs_remaining = 0
        self.hang_flag = False
        
        if self.job_id:
            self.wnd.after_cancel(self.job_id)
        
        self.phase_txt.set("Ready")
        self.timer_txt.set("00:00")
        self.counter_txt.set("Interval: 0 / 0")
        self.start_b.config(state=tk.NORMAL)
        self.pause_b.config(state=tk.DISABLED)
        self.pic.config(image=self.placeholder_photo)
        self.pic.image = self.placeholder_photo
    
    def tick(self):
        if not self.active_flag:
            return
        
        if self.secs_remaining > 0:
            self.phase_txt.set("HANG" if self.hang_flag else "REST")
            self.timer_txt.set(self.fmt(self.secs_remaining))
            
            shown = self.grip_photo if (self.hang_flag and self.grip_photo) else self.placeholder_photo
            self.pic.config(image=shown)
            self.pic.image = shown
            
            self.secs_remaining -= 1
            self.job_id = self.wnd.after(1000, self.tick)
        else:
            self.transition()
    
    def transition(self):
        if self.hang_flag:
            self.hang_flag = False
            self.secs_remaining = self.rest_duration
            self.tick()
        else:
            if self.interval_num < self.total_intervals:
                self.interval_num += 1
                self.hang_flag = True
                self.secs_remaining = self.hang_duration
                self.update_counter()
                self.tick()
            else:
                self.complete()
    
    def complete(self):
        self.active_flag = False
        self.phase_txt.set("Done!")
        self.timer_txt.set("00:00")
        self.start_b.config(state=tk.NORMAL)
        self.pause_b.config(state=tk.DISABLED)
        self.pic.config(image=self.placeholder_photo)
        self.pic.image = self.placeholder_photo
        messagebox.showinfo("Complete", "Session finished!")
    
    def update_counter(self):
        self.counter_txt.set(f"Interval: {self.interval_num} / {self.total_intervals}")
    
    def fmt(self, s):
        return f"{s//60:02d}:{s%60:02d}"


def launch():
    w = tk.Tk()
    TrainingTimer(w)
    w.mainloop()


if __name__ == "__main__":
    launch()
