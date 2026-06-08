#!/usr/bin/env python3
"""
GVAS Format Synthetic Data Generator
Generates well data in the EXACT GVAS format:
Well_ID, X_Coordinate, Y_Coordinate, Elevation_m, Depth_Start_m, Depth_End_m, Raw_Lithology_Description
"""

import csv
import os
import random
from datetime import datetime

# Configuration
OUTPUT_DIR = "gvas_format_synthetic_data"
NUM_WELLS = 10
DEPTH_INTERVALS = 20  # Depth intervals per well
MAX_DEPTH = 50  # meters

# Study area: Ethiopian Rift Valley
STUDY_AREA = {
    "min_lon": 38.7,
    "max_lon": 39.1,
    "min_lat": 8.9,
    "max_lat": 9.1,
    "min_elevation": 1500,
    "max_elevation": 2000
}

# Lithology types from GVAS ontology
LITHOLOGIES = [
    "Top soil", "Alluvium", "Paleosoil", "Sand", "Gravel", "Clay",
    "Basalt", "Tholeiitic Basalt", "Alkali Basalt", "Flood Basalt", 
    "Vesicular Basalt", "Scoriaceous Basalt", "Weathered basalt",
    "Highly weathered basalt", "Slightly weathered basalt",
    "Deeply weathered basalt", "Slightly fractured basalt",
    "Moderately fractured basalt", "Highly fractured basalt",
    "Heavily fractured basalt", "Fractured basalt", "Massive basalt",
    "Rhyolite", "Trachyte", "Dacite", "Obsidian", "Andesite",
    "Tuff", "Ignimbrite", "Welded Tuff", "Volcanic Ash", "Pumice", 
    "Scoria", "Pyroclastic Breccia", "Tephra", "Volcanic Clay",
    "Clay mixed with boulders", "Basalt with Clay Interbeds",
    "Tuff with Ash Interbeds", "Ignimbrite with Volcanic Ash",
    "Weathered basalt with clay", "Fractured basalt with clay",
    "Pillow Basalt", "Hyaloclastite", "Aa Basalt", "Pahoehoe Basalt",
    "Columnar basalt", "Silt"
]

def generate_well_id(num):
    return f"GVAS-WELL-{num:03d}"

def generate_depth_intervals(num_intervals=DEPTH_INTERVALS, max_depth=MAX_DEPTH):
    """Generate continuous depth intervals"""
    intervals = []
    current_depth = 0.0
    
    for i in range(num_intervals):
        if i == num_intervals - 1:
            thickness = max_depth - current_depth
        else:
            thickness = random.uniform(1.0, 4.0)
            remaining = max_depth - current_depth
            if thickness > remaining - (num_intervals - i - 1) * 1.0:
                thickness = remaining - (num_intervals - i - 1) * 1.0
        
        depth_start = round(current_depth, 2)
        depth_end = round(current_depth + thickness, 2)
        
        intervals.append((depth_start, depth_end))
        current_depth = depth_end
    
    # Adjust last interval
    if intervals:
        intervals[-1] = (intervals[-1][0], round(max_depth, 2))
    
    return intervals

def generate_lithology(depth):
    """Generate realistic lithology based on depth"""
    if depth < 5:
        shallow_liths = ["Top soil", "Alluvium", "Sand", "Gravel", "Clay", 
                        "Weathered basalt", "Volcanic Clay"]
        if random.random() < 0.7:
            return random.choice(shallow_liths)
    
    if depth < 20:
        mid_liths = ["Basalt", "Scoriaceous Basalt", "Vesicular Basalt",
                    "Fractured basalt", "Slightly fractured basalt",
                    "Weathered basalt", "Volcanic Clay", "Tuff"]
        if random.random() < 0.6:
            return random.choice(mid_liths)
    
    deep_liths = ["Massive basalt", "Pillow Basalt", "Hyaloclastite",
                 "Fractured basalt", "Highly fractured basalt",
                 "Columnar basalt", "Aa Basalt", "Pahoehoe Basalt",
                 "Rhyolite", "Obsidian", "Dacite", "Andesite"]
    return random.choice(deep_liths)

def add_modifiers(lithology, depth):
    """Add realistic modifiers to lithology"""
    modifiers = []
    
    if "basalt" in lithology.lower():
        if depth > 30 and random.random() < 0.4:
            modifiers.append("Massive")
        if depth < 15 and random.random() < 0.3:
            modifiers.append("Weathered")
        if random.random() < 0.3:
            fracture_levels = ["Slightly fractured", "Moderately fractured", 
                              "Highly fractured"]
            modifiers.append(random.choice(fracture_levels))
        if depth > 20 and random.random() < 0.2:
            modifiers.append("with clay")
        if random.random() < 0.15:
            modifiers.append("Vesicular")
    
    if lithology in ["Rhyolite", "Obsidian", "Dacite"]:
        if random.random() < 0.3:
            modifiers.append("Highly fractured")
    
    if modifiers:
        return f"{lithology} {' '.join(modifiers)}"
    return lithology

def create_gvas_csv(all_well_data, output_dir, filename="ALL_WELLS_GVAS_FORMAT.csv"):
    """Create CSV in EXACT GVAS format"""
    filepath = os.path.join(output_dir, filename)
    
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        f.write(f"# GVAS Synthetic Well Data - Raw Format\n")
        f.write(f"# Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"# Format: Well_ID,X_Coordinate,Y_Coordinate,Elevation_m,Depth_Start_m,Depth_End_m,Raw_Lithology_Description\n")
        f.write(f"# Coordinate System: WGS84 (decimal degrees)\n")
        f.write(f"# Elevation: meters (WGS84)\n")
        f.write(f"# Depth: meters (below ground)\n\n")
        
        writer = csv.writer(f)
        writer.writerow(["Well_ID", "X_Coordinate", "Y_Coordinate", "Elevation_m", 
                         "Depth_Start_m", "Depth_End_m", "Raw_Lithology_Description"])
        
        for well_data in all_well_data:
            well_id, x_coord, y_coord, elevation, intervals = well_data
            for start, end, lith in intervals:
                writer.writerow([well_id, x_coord, y_coord, elevation, 
                                start, end, lith])
    
    return filepath

def create_individual_gvas_csv(well_data, output_dir):
    """Create individual well CSV in GVAS format"""
    well_id, x_coord, y_coord, elevation, intervals = well_data
    filename = f"{well_id}.csv"
    filepath = os.path.join(output_dir, filename)
    
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        f.write(f"# {well_id}\n")
        f.write(f"# Coordinates: {x_coord}, {y_coord}\n")
        f.write(f"# Elevation: {elevation}m\n")
        f.write(f"# Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"# Format: Well_ID,X_Coordinate,Y_Coordinate,Elevation_m,Depth_Start_m,Depth_End_m,Raw_Lithology_Description\n\n")
        
        writer = csv.writer(f)
        writer.writerow(["Well_ID", "X_Coordinate", "Y_Coordinate", "Elevation_m", 
                         "Depth_Start_m", "Depth_End_m", "Raw_Lithology_Description"])
        
        for start, end, lith in intervals:
            writer.writerow([well_id, x_coord, y_coord, elevation, 
                            start, end, lith])
    
    return filepath

def create_metadata(output_dir, num_wells, num_intervals):
    """Create metadata file"""
    filepath = os.path.join(output_dir, "METADATA.txt")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write("GVAS Synthetic Data - Raw Format\n")
        f.write("=" * 60 + "\n")
        f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Total Wells: {num_wells}\n")
        f.write(f"Intervals per Well: {num_intervals}\n")
        f.write(f"Max Depth: {MAX_DEPTH}m\n")
        f.write(f"\nStudy Area:\n")
        f.write(f"  Longitude: {STUDY_AREA['min_lon']} - {STUDY_AREA['max_lon']}°E\n")
        f.write(f"  Latitude: {STUDY_AREA['min_lat']} - {STUDY_AREA['max_lat']}°N\n")
        f.write(f"  Elevation: {STUDY_AREA['min_elevation']} - {STUDY_AREA['max_elevation']}m\n")
        f.write(f"\nGVAS Format Columns:\n")
        f.write(f"  1. Well_ID - Unique well identifier\n")
        f.write(f"  2. X_Coordinate - Longitude (WGS84 decimal degrees)\n")
        f.write(f"  3. Y_Coordinate - Latitude (WGS84 decimal degrees)\n")
        f.write(f"  4. Elevation_m - Elevation in meters (WGS84)\n")
        f.write(f"  5. Depth_Start_m - Start depth in meters (below ground)\n")
        f.write(f"  6. Depth_End_m - End depth in meters (below ground)\n")
        f.write(f"  7. Raw_Lithology_Description - Raw lithology description\n")
        f.write(f"\nFiles Generated:\n")
        f.write(f"  - Individual well CSVs in 'wells/' directory\n")
        f.write(f"  - ALL_WELLS_GVAS_FORMAT.csv\n")
        f.write(f"  - METADATA.txt\n")
    
    return filepath

def main():
    print("=" * 70)
    print("GVAS Format Synthetic Data Generator")
    print("=" * 70)
    print(f"Generating {NUM_WELLS} wells with {DEPTH_INTERVALS} intervals each")
    print(f"Max depth: {MAX_DEPTH}m")
    print(f"Format: Well_ID,X_Coordinate,Y_Coordinate,Elevation_m,Depth_Start_m,Depth_End_m,Raw_Lithology_Description")
    print()
    
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    wells_dir = os.path.join(OUTPUT_DIR, "wells")
    os.makedirs(wells_dir, exist_ok=True)
    
    all_well_data = []
    
    # Generate individual well files
    print(f"Generating {NUM_WELLS} individual well CSV files in GVAS format...")
    for i in range(1, NUM_WELLS + 1):
        well_id = generate_well_id(i)
        
        # Generate coordinates and elevation
        x_coord = round(random.uniform(STUDY_AREA["min_lon"], STUDY_AREA["max_lon"]), 6)
        y_coord = round(random.uniform(STUDY_AREA["min_lat"], STUDY_AREA["max_lat"]), 6)
        elevation = round(random.uniform(STUDY_AREA["min_elevation"], STUDY_AREA["max_elevation"]), 2)
        
        # Generate depth intervals
        intervals = generate_depth_intervals(DEPTH_INTERVALS, MAX_DEPTH)
        
        # Add lithology
        lith_intervals = []
        for start, end in intervals:
            lith = generate_lithology(start)
            lith = add_modifiers(lith, start)
            lith_intervals.append((start, end, lith))
        
        well_data = (well_id, x_coord, y_coord, elevation, lith_intervals)
        all_well_data.append(well_data)
        
        filepath = create_individual_gvas_csv(well_data, wells_dir)
        print(f"  Created: {os.path.basename(filepath)}")
        print(f"    Coordinates: ({x_coord}, {y_coord}), Elevation: {elevation}m")
    
    # Create combined CSV
    print("\nCreating combined CSV file in GVAS format...")
    combined_file = create_gvas_csv(all_well_data, OUTPUT_DIR)
    print(f"  Created: {os.path.basename(combined_file)}")
    
    # Create metadata
    print("\nCreating metadata file...")
    metadata_file = create_metadata(OUTPUT_DIR, NUM_WELLS, DEPTH_INTERVALS)
    print(f"  Created: {os.path.basename(metadata_file)}")
    
    print("\n" + "=" * 70)
    print("Data Generation Complete!")
    print("=" * 70)
    print(f"\nOutput directory: {os.path.abspath(OUTPUT_DIR)}")
    print(f"\nFiles created:")
    print(f"  - {NUM_WELLS} individual well CSV files in 'wells/'")
    print(f"  - ALL_WELLS_GVAS_FORMAT.csv")
    print(f"  - METADATA.txt")
    print(f"\nEXACT GVAS Format:")
    print(f"  Well_ID, X_Coordinate, Y_Coordinate, Elevation_m, Depth_Start_m, Depth_End_m, Raw_Lithology_Description")
    print(f"\nCoordinate System: WGS84 (decimal degrees)")
    print(f"Elevation: meters (WGS84)")
    print(f"Depth: meters (below ground)")

if __name__ == "__main__":
    main()
