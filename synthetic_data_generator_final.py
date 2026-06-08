#!/usr/bin/env python3
"""
GVAS Synthetic Data Generator - Final Simple Format
=================================================
Generates synthetic well log data in simple 3-column format:
Depth_Start_m, Depth_End_m, Lithology

Each row represents a depth interval with its lithology.
Depth ranges are continuous (each Depth_Start_m = previous Depth_End_m).

Usage:
    python synthetic_data_generator_final.py

Requirements:
    Python 3.11.9+
"""

import csv
import random
import os
from datetime import datetime
from typing import List, Dict

# ============================================================================
# CONFIGURATION
# ============================================================================

OUTPUT_DIR = "synthetic_test_data_final"
NUM_WELLS_PER_REGION = 5
NUM_REGIONS = 4
NUM_LAYERS_PER_WELL = 20  # Number of depth intervals per well

# ============================================================================
# LITHOLOGY TYPES - Realistic volcanic lithologies
# ============================================================================

LITHOLOGIES = {
    "Surface": ["Top soil", "Alluvium", "Paleosoil", "Sand", "Gravel", "Clay"],
    "Mafic": ["Basalt", "Tholeiitic Basalt", "Alkali Basalt", "Flood Basalt", "Vesicular Basalt", "Scoriaceous Basalt"],
    "Felsic": ["Rhyolite", "Trachyte", "Dacite", "Obsidian"],
    "Pyroclastic": ["Tuff", "Ignimbrite", "Welded Tuff", "Volcanic Ash", "Pumice", "Scoria", "Pyroclastic Breccia", "Tephra"],
    "Sedimentary": ["Clay", "Volcanic Clay", "Sand", "Gravel", "Silt"],
    "Weathered": ["Weathered basalt", "Highly weathered basalt", "Slightly weathered basalt", 
                 "Deeply weathered basalt", "Weathered and fractured basalt"],
    "Fractured": ["Slightly fractured basalt", "Moderately fractured basalt", 
                  "Highly fractured basalt", "Heavily fractured basalt", "Fractured basalt"],
    "Massive": ["Massive basalt", "Massive rhyolite", "Massive andesite"],
    "Mixed": ["Clay mixed with boulders", "Basalt with Clay Interbeds", "Tuff with Ash Interbeds",
             "Ignimbrite with Volcanic Ash", "Weathered basalt with clay", "Fractured basalt with clay"],
    "Special": ["Pillow Basalt", "Hyaloclastite", "Aa Basalt", "Pahoehoe Basalt", "Columnar basalt"],
}

# ============================================================================
# REGION CONFIGURATIONS - For realistic depth ranges
# ============================================================================

REGIONS = {
    "Ethiopia_Rift_Valley": {
        "description": "Main Ethiopian Rift - Volcanic Aquifers",
        "depth_range": (0, 150),
    },
    "Canary_Islands": {
        "description": "Tenerife and Gran Canaria - Oceanic Island Volcanism",
        "depth_range": (0, 120),
    },
    "Hawaii_Big_Island": {
        "description": "Hawaiian Shield Volcanoes",
        "depth_range": (0, 200),
    },
    "Iceland": {
        "description": "Icelandic Volcanic Zones",
        "depth_range": (0, 100),
    },
}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def generate_well_id(region: str, well_number: int) -> str:
    """Generate unique well ID based on region and number."""
    region_abbrev = region.split("_")[0].upper()
    return f"{region_abbrev}-WELL-{well_number:03d}"


def generate_lithology(region: str, depth: float, all_lithologies: List[str]) -> str:
    """Generate realistic lithology for a depth interval."""
    # Weight towards surface lithologies at shallow depths
    if depth < 5:
        surface_weight = 0.8
    elif depth < 20:
        surface_weight = 0.5
    elif depth < 50:
        surface_weight = 0.3
    else:
        surface_weight = 0.1
    
    # Get all lithologies
    all_liths = []
    for category, liths in LITHOLOGIES.items():
        all_liths.extend(liths)
    
    # Separate into surface and subsurface
    surface_liths = LITHOLOGIES["Surface"] + LITHOLOGIES["Sedimentary"]
    subsurface_liths = [l for l in all_liths if l not in surface_liths]
    
    # Choose based on depth
    if random.random() < surface_weight and depth < 30:
        lithology = random.choice(surface_liths)
    else:
        lithology = random.choice(subsurface_liths)
    
    # Add modifiers based on depth
    modifiers = []
    if depth > 60:
        if "basalt" in lithology.lower() and random.random() < 0.4:
            modifiers.append("Massive")
    if depth < 10:
        if random.random() < 0.3:
            modifiers.append("Weathered")
    
    # Random modifier
    if random.random() < 0.3:
        all_modifiers = ["Slightly fractured", "Moderately fractured", "Highly fractured", 
                       "Weathered", "Slightly weathered", "Deeply weathered", "Massive", "Vesicular", "Dense"]
        modifiers.append(random.choice(all_modifiers))
    
    # Add clay or other features
    if depth > 40 and "basalt" in lithology.lower() and random.random() < 0.2:
        modifiers.append("with clay")
    
    # Build final lithology string
    if modifiers:
        return f"{lithology} {' '.join(modifiers)}"
    return lithology


def generate_well_intervals(region: str, well_number: int, num_layers: int = NUM_LAYERS_PER_WELL) -> List[Dict]:
    """Generate depth intervals with lithologies for a single well."""
    config = REGIONS[region]
    depth_range = config["depth_range"]
    
    well_id = generate_well_id(region, well_number)
    max_depth = random.randint(*depth_range)
    
    # Get all lithologies for this region
    all_lithologies = []
    for liths in LITHOLOGIES.values():
        all_lithologies.extend(liths)
    
    # Generate random but logical depth intervals
    intervals = []
    current_depth = 0.0
    remaining_depth = float(max_depth)
    
    for i in range(num_layers):
        # Calculate thickness for this layer
        if i == num_layers - 1:
            thickness = remaining_depth
        else:
            # Random thickness, but ensure we have enough for remaining layers
            # Use smaller thicknesses for more intervals (like user's example)
            min_thickness = 2.0
            max_possible = remaining_depth - (num_layers - i - 1) * min_thickness
            # Weight towards smaller thicknesses for more frequent changes
            thickness = round(random.uniform(min_thickness, min(max_possible, min_thickness * 5)), 2)
        
        depth_start = round(current_depth, 2)
        depth_end = round(current_depth + thickness, 2)
        
        # Ensure depth_end > depth_start
        if depth_end <= depth_start:
            depth_end = depth_start + 0.01
        
        # Generate lithology for this interval
        lithology = generate_lithology(region, depth_start, all_lithologies)
        
        intervals.append({
            "Depth_Start_m": depth_start,
            "Depth_End_m": depth_end,
            "Lithology": lithology
        })
        
        current_depth = depth_end
        remaining_depth = max_depth - current_depth
    
    # Ensure the last interval reaches exactly max_depth
    if intervals:
        intervals[-1]["Depth_End_m"] = round(float(max_depth), 2)
        intervals[-1]["Lithology"] = generate_lithology(region, intervals[-1]["Depth_Start_m"], all_lithologies)
        
        # Ensure last interval has positive thickness
        if intervals[-1]["Depth_End_m"] <= intervals[-1]["Depth_Start_m"]:
            intervals[-1]["Depth_End_m"] = intervals[-1]["Depth_Start_m"] + 0.01
    
    # Remove any duplicate or zero-thickness intervals
    clean_intervals = []
    for interval in intervals:
        start = float(interval["Depth_Start_m"])
        end = float(interval["Depth_End_m"])
        if end > start:
            clean_intervals.append({
                "Depth_Start_m": round(start, 2),
                "Depth_End_m": round(end, 2),
                "Lithology": interval["Lithology"]
            })
    
    return clean_intervals


def create_simple_csv(intervals: List[Dict], filename: str, title: str = "") -> str:
    """Create CSV file with simple 3-column format."""
    fieldnames = ["Depth_Start_m", "Depth_End_m", "Lithology"]
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    filepath = os.path.join(OUTPUT_DIR, filename)
    
    with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
        if title:
            csvfile.write(f"# {title}\n")
            csvfile.write(f"# Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            csvfile.write(f"# Total Intervals: {len(intervals)}\n")
            csvfile.write(f"# Format: {', '.join(fieldnames)}\n\n")
        
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        
        for interval in intervals:
            writer.writerow(interval)
    
    return filepath


def create_well_csv(intervals: List[Dict], filename: str, well_id: str) -> str:
    """Create CSV file for a single well with Well_ID prefix."""
    fieldnames = ["Well_ID", "Depth_Start_m", "Depth_End_m", "Lithology"]
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    filepath = os.path.join(OUTPUT_DIR, filename)
    
    with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
        csvfile.write(f"# {well_id}\n")
        csvfile.write(f"# Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        csvfile.write(f"# Total Intervals: {len(intervals)}\n")
        csvfile.write(f"# Format: {', '.join(fieldnames)}\n\n")
        
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        
        for interval in intervals:
            writer.writerow({
                "Well_ID": well_id,
                "Depth_Start_m": interval["Depth_Start_m"],
                "Depth_End_m": interval["Depth_End_m"],
                "Lithology": interval["Lithology"]
            })
    
    return filepath


def create_metadata_file(total_wells: int, total_intervals: int) -> str:
    """Create a metadata file describing all generated data."""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # Build regions section
    regions_section = "\n".join([f"- **{name}**: {REGIONS[name]['description']}" 
                                  for name in REGIONS.keys()])
    
    # Build lithology section
    lithology_section = ""
    for category, liths in LITHOLOGIES.items():
        lithology_section += f"\n- {category}:\n"
        for lith in liths:
            lithology_section += f"  - {lith}\n"
    
    metadata = f"""# GVAS Synthetic Test Data - Final Simple Format
# Generated: {timestamp}
# Python Version: 3.11.9+

## Format
Each CSV file uses the simple 3-column format matching your example:

```
Depth_Start_m,Depth_End_m,Lithology
0,4.62,Top soil
4.62,11.5,Weathered basalt
11.5,23.1,Clay mixed with boulders
23.1,34.65,Slightly fractured basalt
34.65,41.58,Massive basalt
...
```

## Features
- **Depth_Start_m**: Start depth of interval in meters
- **Depth_End_m**: End depth of interval in meters
- **Lithology**: Description of the lithology
- Depth ranges are **continuous** (each Depth_Start_m = previous Depth_End_m)
- Each well has {NUM_LAYERS_PER_WELL} intervals
- Uses realistic volcanic lithologies from GVAS ontology

## Files Generated

### Individual Well Files (in wells/ directory)
- **ETHIOPIA_WELL_001.csv, ETHIOPIA_WELL_002.csv, etc.**: Each well as a separate file
- Format: Well_ID, Depth_Start_m, Depth_End_m, Lithology

### Region Example Files
- **region_example.csv**: Example of a single well per region in simple format
- Format: Depth_Start_m, Depth_End_m, Lithology

### Combined File
- **all_wells_combined.csv**: All wells combined
- Format: Well_ID, Depth_Start_m, Depth_End_m, Lithology

## Regions Covered
{regions_section}

## Lithology Types
{lithology_section}

## Usage
1. Start GVAS using `auto_run.bat`
2. Upload individual well files from `wells/` directory
3. Or use `region_example.csv` for simple 3-column format
4. Or use `all_wells_combined.csv` for multi-well analysis

## Statistics
- Total Wells: {total_wells}
- Total Intervals: {total_intervals}
- Intervals per Well: {NUM_LAYERS_PER_WELL}
- Wells per Region: {NUM_WELLS_PER_REGION}
- Total Regions: {NUM_REGIONS}
"""
    
    filepath = os.path.join(OUTPUT_DIR, "METADATA.md")
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(metadata)
    
    return filepath


# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    """Generate all synthetic test data in simple format."""
    print("=" * 80)
    print("GVAS Synthetic Data Generator - Final Simple 3-Column Format")
    print("=" * 80)
    print(f"Generating {NUM_WELLS_PER_REGION} wells per region x {NUM_REGIONS} regions")
    print(f"Each well has {NUM_LAYERS_PER_WELL} depth intervals")
    print(f"Output directory: {OUTPUT_DIR}")
    print()
    
    generated_files = []
    total_wells = 0
    total_intervals = 0
    
    # Create subdirectories
    wells_dir = os.path.join(OUTPUT_DIR, "wells")
    os.makedirs(wells_dir, exist_ok=True)
    
    # Generate data for each region
    for region_name, region_config in REGIONS.items():
        print(f"Generating data for: {region_name}")
        
        for well_num in range(1, NUM_WELLS_PER_REGION + 1):
            well_id = generate_well_id(region_name, well_num)
            intervals = generate_well_intervals(region_name, well_num, NUM_LAYERS_PER_WELL)
            
            # Save individual well file (with Well_ID)
            well_filename = f"{well_id.replace('-', '_')}.csv"
            well_filepath = create_well_csv(intervals, os.path.join("wells", well_filename), well_id)
            generated_files.append(well_filepath)
            
            total_wells += 1
            total_intervals += len(intervals)
            print(f"  Created: {well_filename} ({len(intervals)} intervals)")
        
        # Create a region example file (first well, simple 3-column format)
        first_well_intervals = generate_well_intervals(region_name, 1, NUM_LAYERS_PER_WELL)
        region_filename = f"region_{region_name.lower().replace(' ', '_')}_example.csv"
        region_filepath = create_simple_csv(first_well_intervals, region_filename, 
                                             f"{region_config['description']} - Example Well")
        generated_files.append(region_filepath)
        print(f"  Created: {region_filename} (example)")
    
    # Create combined CSV
    print("\nCreating combined file...")
    combined_filename = "all_wells_combined.csv"
    combined_filepath = os.path.join(OUTPUT_DIR, combined_filename)
    
    with open(combined_filepath, 'w', newline='', encoding='utf-8') as csvfile:
        csvfile.write(f"# GVAS Synthetic Test Data - All Wells Combined\n")
        csvfile.write(f"# Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        csvfile.write(f"# Total Wells: {total_wells}\n")
        csvfile.write(f"# Total Intervals: {total_intervals}\n\n")
        
        writer = csv.DictWriter(csvfile, fieldnames=["Well_ID", "Depth_Start_m", "Depth_End_m", "Lithology"])
        writer.writeheader()
        
        # Regenerate and write all intervals with well IDs
        for region_name in REGIONS:
            for well_num in range(1, NUM_WELLS_PER_REGION + 1):
                well_id = generate_well_id(region_name, well_num)
                intervals = generate_well_intervals(region_name, well_num, NUM_LAYERS_PER_WELL)
                for interval in intervals:
                    writer.writerow({
                        "Well_ID": well_id,
                        "Depth_Start_m": interval["Depth_Start_m"],
                        "Depth_End_m": interval["Depth_End_m"],
                        "Lithology": interval["Lithology"]
                    })
    
    generated_files.append(combined_filepath)
    print(f"  Created: {combined_filename}")
    
    # Create metadata file
    metadata_filepath = create_metadata_file(total_wells, total_intervals)
    generated_files.append(metadata_filepath)
    print(f"  Created: METADATA.md")
    
    print()
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Total wells generated: {total_wells}")
    print(f"Total intervals: {total_intervals}")
    print(f"Intervals per well: {NUM_LAYERS_PER_WELL}")
    print(f"Files created: {len(generated_files)}")
    print(f"Output location: {os.path.abspath(OUTPUT_DIR)}")
    print()
    print("Generated files:")
    print(f"  - {total_wells} individual well files in wells/ directory")
    print(f"  - {NUM_REGIONS} region example files")
    print(f"  - {combined_filename}")
    print(f"  - METADATA.md")
    
    print()
    print("Data generation complete!")
    print("Format matches your example: Depth_Start_m, Depth_End_m, Lithology")


if __name__ == "__main__":
    main()
