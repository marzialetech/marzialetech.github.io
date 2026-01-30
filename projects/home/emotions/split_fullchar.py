#!/usr/bin/env python3
"""Split character emotion sheet - ensuring full character capture."""

from PIL import Image
import os

INPUT_FILE = "tt5.png"
OUTPUT_DIR = "tt5_emotions"

# Image is 1200x800
# Bounds tuned to capture FULL character including extended limbs
# (left, top, right, bottom, label)

CHARACTERS = [
    # Row 1
    (0, 0, 390, 270, "angry"),           # full head + fist
    (320, 0, 730, 270, "wave_hi"),       # full raised hand
    (700, 0, 1200, 275, "excited"),      # full extended arm
    
    # Row 2
    (0, 260, 390, 535, "shouting"),      # full head + fist
    (320, 265, 730, 535, "nervous"),     # hands near face
    (700, 260, 1200, 535, "laughing"),   # extended arm
    
    # Row 3
    (0, 520, 390, 800, "thinking"),      # hand on chin
    (310, 520, 730, 800, "thumbs_up"),   # both thumbs
    (700, 505, 1200, 800, "celebrating"),# RAISED FISTS - need higher top!
]

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_path = os.path.join(script_dir, INPUT_FILE)
    output_dir = os.path.join(script_dir, OUTPUT_DIR)
    
    os.makedirs(output_dir, exist_ok=True)
    
    img = Image.open(input_path)
    print(f"Image size: {img.size[0]}x{img.size[1]}")
    print(f"Extracting {len(CHARACTERS)} full characters...\n")
    
    for left, top, right, bottom, label in CHARACTERS:
        cropped = img.crop((left, top, right, bottom))
        output_path = os.path.join(output_dir, f"{label}.png")
        cropped.save(output_path)
        print(f"  {label}: [{right-left}x{bottom-top}]")
    
    print(f"\nDone! {len(CHARACTERS)} images saved to '{OUTPUT_DIR}/'")

if __name__ == "__main__":
    main()
