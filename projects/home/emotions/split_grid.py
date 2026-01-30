#!/usr/bin/env python3
"""Split a 3x3 grid image into 9 individual emotion images."""

from PIL import Image
import os

# Configuration
INPUT_FILE = "tt5.png"
OUTPUT_DIR = "tt5_emotions"
GRID_SIZE = 3  # 3x3 grid

# Emotion labels for each cell (row by row, left to right)
EMOTION_LABELS = [
    "angry",      "wave_hi",    "excited",
    "shouting",   "nervous",    "laughing", 
    "thinking",   "thumbs_up",  "celebrating"
]

def split_grid(input_path, output_dir, grid_size=3):
    """Split a grid image into individual cells."""
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Open the image
    img = Image.open(input_path)
    width, height = img.size
    
    # Calculate cell dimensions
    cell_width = width // grid_size
    cell_height = height // grid_size
    
    print(f"Image size: {width}x{height}")
    print(f"Cell size: {cell_width}x{cell_height}")
    print(f"Splitting into {grid_size * grid_size} images...")
    
    # Split into individual cells
    for row in range(grid_size):
        for col in range(grid_size):
            # Calculate crop box (left, upper, right, lower)
            left = col * cell_width
            upper = row * cell_height
            right = left + cell_width
            lower = upper + cell_height
            
            # Crop the cell
            cell = img.crop((left, upper, right, lower))
            
            # Get the label for this cell
            idx = row * grid_size + col
            label = EMOTION_LABELS[idx] if idx < len(EMOTION_LABELS) else f"cell_{idx+1}"
            
            # Save the cell
            output_path = os.path.join(output_dir, f"{label}.png")
            cell.save(output_path)
            print(f"  Saved: {output_path}")
    
    print(f"\nDone! {grid_size * grid_size} images saved to '{output_dir}/'")

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_path = os.path.join(script_dir, INPUT_FILE)
    output_dir = os.path.join(script_dir, OUTPUT_DIR)
    
    split_grid(input_path, output_dir, GRID_SIZE)
