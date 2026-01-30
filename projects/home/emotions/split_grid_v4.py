#!/usr/bin/env python3
"""Split character emotion sheet - tighter bounds to minimize overlap."""

from PIL import Image
import os

INPUT_FILE = "tt5.png"
OUTPUT_DIR = "tt5_emotions"

# Image is 1200x800
# Using much tighter bounds focused on each character's core area
# (left, top, right, bottom, label)

CHARACTERS = [
    # Row 1 - top characters
    (25, 5, 365, 240, "angry"),
    (365, 5, 700, 240, "wave_hi"),  
    (735, 5, 1100, 245, "excited"),
    
    # Row 2 - middle characters  
    (25, 275, 365, 510, "shouting"),
    (365, 275, 700, 505, "nervous"),
    (735, 270, 1100, 510, "laughing"),
    
    # Row 3 - bottom characters
    (25, 540, 365, 795, "thinking"),
    (355, 545, 700, 795, "thumbs_up"),
    (735, 535, 1100, 795, "celebrating"),
]

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_path = os.path.join(script_dir, INPUT_FILE)
    output_dir = os.path.join(script_dir, OUTPUT_DIR)
    
    os.makedirs(output_dir, exist_ok=True)
    
    img = Image.open(input_path)
    print(f"Image size: {img.size[0]}x{img.size[1]}")
    print(f"Extracting {len(CHARACTERS)} characters with tight bounds...\n")
    
    for left, top, right, bottom, label in CHARACTERS:
        cropped = img.crop((left, top, right, bottom))
        output_path = os.path.join(output_dir, f"{label}.png")
        cropped.save(output_path)
        print(f"  {label}: ({left}, {top}) to ({right}, {bottom}) [{right-left}x{bottom-top}]")
    
    print(f"\nDone! {len(CHARACTERS)} images saved to '{OUTPUT_DIR}/'")

if __name__ == "__main__":
    main()
