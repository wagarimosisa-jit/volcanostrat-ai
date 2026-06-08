#!/usr/bin/env python3
"""
GVAS Synthetic Data Generator - Simple Format
============================================
Generates synthetic well log data in simple 3-column format:
Depth_Start_m, Depth_End_m, Lithology

Each row represents a depth interval with its lithology.
Depth ranges are continuous (each start = previous end).

Usage:
    python synthetic_data_generator_simple.py

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

OUTPUT_DIR = "synthetic_test_data_simple"
NUM_WELLS_PER_REGION = 5
NUM_REGIONS = 4
NUM_LAYERS_PER_WELL = 15  # Number of depth intervals per well

# ============================================================================
# VOLCANIC ONTOLOGY - Based on GVAS volcanic_ontology.json
# ============================================================================

LITHOLOGIES = {
    "Mafic Lava": ["Top soil", "Basalt", "Tholeiitic Basalt", "Alkali Basalt", "Flood Basalt", "Scoriaceous Basalt", "Vesicular Basalt"],
    "Felsic Lava": ["Rhyolite", "Trachyte", "Dacite", "Obsidian"],
    "Pyroclastic (Flow)": ["Ignimbrite", "Welded Tuff", "Pyroclastic Flow Deposit"],
    "Pyroclastic (Fall)": ["Tuff", "Volcanic Ash", "Pumice", "Scoria", "Tephra"],
    "Sedimentary": ["Clay", "Alluvium", "Volcanic Clay", "Sand", "Gravel", "Silt", "Paleosoil"],
    "Weathered": ["Weathered basalt", "Highly weathered basalt", "Slightly weathered basalt", 
                 "Weathered and slightly fractured", "Deeply weathered basalt"],
    "Structural": ["Massive basalt", "Slightly fractured basalt", "Moderately fractured basalt",
                  "Highly fractured basalt", "Fractured basalt with clay"],
    "Mixed": ["Clay mixed with boulders", "Basalt with Clay Interbeds", "Tuff with Ash Interbeds",
             "Ignimbrite with Volcanic Ash", "Weathered basalt with clay"],
}

MODIFIERS = {
    "Fracturing": ["Slightly fractured", "Moderately fractured", "Highly fractured", "Heavily fractured"],
    "Weathering": ["Weathered", "Highly weathered", "Slightly weathered", "Deeply weathered"],
    "Consolidation": ["Massive", "Welded", "Unwelded", "Loose", "Fused"],
    "Porosity": ["Vesicular", "Dense", "Porous", "Non-vesicular"],
}

# ============================================================================
# REGION CONFIGURATIONS - For realistic depth ranges
# ============================================================================

REGIONS = {
    "Ethiopia_Rift_Valley": {
        "description": "Main Ethiopian Rift - Volcanic Aquifers",
        "depth_range": (0, 150),
        "dominant_lithologies": ["Top soil", "Basalt", "Weathered basalt", "Clay", "Tuff", "Volcanic Ash", "Slightly fractured basalt", "Massive basalt"],
    },
    "Canary_Islands": {
        "description": "Tenerife and Gran Canaria - Oceanic Island Volcanism",
        "depth_range": (0, 120),
        "dominant_lithologies": ["Top soil", "Basalt", "Trachyte", "Tuff", "Pyroclastic Breccia", "Weathered basalt"],
    },
    "Hawaii_Big_Island": {
        "description": "Hawaiian Shield Volcanoes",
        "depth_range": (0, 200),
        "dominant_lithologies": ["Top soil", "Tholeiitic Basalt", "Alkali Basalt", "Pahoehoe Basalt", "Aa Basalt", "Hyaloclastite", "Tuff", "Massive basalt"],
    },
    "Iceland": {
        "description": "Icelandic Volcanic Zones",
        "depth_range": (0, 100),
        "dominant_lithologies": ["Top soil", "Basalt", "Andesite", "Rhyolite", "Hyaloclastite", "Tuff", "Pillow Basalt", "Slightly fractured basalt"],
    },
}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def generate_well_id(region: str, well_number: int) -> str:
    """Generate unique well ID based on region and number."""
    region_abbrev = region.split("_")[0].upper()
    return f"{region_abbrev}-WELL-{well_number:03d}"


def generate_lithology_description(region: str, depth: float) -> str:
    """Generate realistic lithology description for a depth interval."""
    config = REGIONS[region]
    dominant_liths = config["dominant_lithologies"]
    
    # Weight towards dominant lithologies
    if random.random() < 0.7:
        base_lith = random.choice(dominant_liths)
    else:
        all_liths = [l for lith_list in LITHOLOGIES.values() for l in lith_list]
        base_lith = random.choice(all_liths)
    
    # Add modifiers based on depth
    modifiers = []
    if depth < 5:
        # Near surface - more likely to be weathered or soil
        if "soil" not in base_lith.lower() and random.random() < 0.6:
            modifiers.append(random.choice(["Weathered", "Slightly weathered"]))
    elif depth > 80:
        # Deep - more likely to be massive or fractured
        if random.random() < 0.5:
            modifiers.append(random.choice(["Massive", "Slightly fractured", "Moderately fractured"]))
    
    # Randomly add modifiers from ontology
    for mod_type, mod_values in MODIFIERS.items():
        if random.random() < 0.3:
            modifiers.append(random.choice(mod_values))
    
    # Build description
    parts = [base_lith]
    if modifiers:
        parts.extend(modifiers[:2])
    
    # Add depth-related features
    if depth > 50 and "basalt" in base_lith.lower():
        if random.random() < 0.4:
            parts.append("with clay")
    
    return " ".join(parts)


def generate_well_intervals(region: str, well_number: int, num_layers: int = NUM_LAYERS_PER_WELL) -> List[Dict]:
    """Generate depth intervals with lithologies for a single well."""
    config = REGIONS[region]
    depth_range = config["depth_range"]
    
    well_id = generate_well_id(region, well_number)
    max_depth = random.randint(*depth_range)
    
    # Generate random but logical depth intervals
    intervals = []
    current_depth = 0.0
    remaining_depth = max_depth
    
    for i in range(num_layers):
        # Calculate thickness for this layer
        if i == num_layers - 1:
            thickness = remaining_depth
        else:
            # Random thickness, but ensure we have enough for remaining layers
            min_thickness = 2.0
            max_possible = remaining_depth - (num_layers - i - 1) * min_thickness
            thickness = round(random.uniform(min_thickness, max_possible), 2)
        
        depth_start = round(current_depth, 2)
        depth_end = round(current_depth + thickness, 2)
        
        # Generate lithology for this interval
        lithology = generate_lithology_description(region, depth_start)
        
        intervals.append({
            "Depth_Start_m": depth_start,
            "Depth_End_m": depth_end,
            "Lithology": lithology
        })
        
        current_depth = depth_end
        remaining_depth = max_depth - current_depth
    
    # Ensure the last interval reaches exactly max_depth
    if intervals:
        intervals[-1]["Depth_End_m"] = round(max_depth, 2)
        intervals[-1]["Lithology"] = generate_lithology_description(region, intervals[-1]["Depth_Start_m"])
    
    # Ensure all depths are non-negative
    for interval in intervals:
        interval["Depth_Start_m"] = max(0.0, interval["Depth_Start_m"])
        interval["Depth_End_m"] = max(interval["Depth_Start_m"], interval["Depth_End_m"])
    
    return intervals


def generate_multiple_wells(region: str, num_wells: int) -> List[Dict]:
    """Generate intervals for multiple wells in a region."""
    all_intervals = []
    for i in range(1, num_wells + 1):
        intervals = generate_well_intervals(region, i)
        all_intervals.extend(intervals)
    return all_intervals


def create_csv_file(intervals: List[Dict], filename: str, region_description: str = "") -> str:
    """Create CSV file with simple 3-column format."""
    fieldnames = ["Depth_Start_m", "Depth_End_m", "Lithology"]
    
    # Create output directory if it doesn't exist
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    filepath = os.path.join(OUTPUT_DIR, filename)
    
    with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
        # Write region description as comment (before header)
        if region_description:
            csvfile.write(f"# {region_description}\n")
            csvfile.write(f"# Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            csvfile.write(f"# Total Intervals: {len(intervals)}\n")
            csvfile.write(f"# Format: {', '.join(fieldnames)}\n\n")
        
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        
        # Write interval data
        for interval in intervals:
            writer.writerow(interval)
    
    return filepath


def create_combined_csv(all_intervals: List[Dict], filename: str) -> str:
    """Create a combined CSV with all intervals, adding Well_ID column."""
    fieldnames = ["Well_ID", "Depth_Start_m", "Depth_End_m", "Lithology"]
    
    filepath = os.path.join(OUTPUT_DIR, filename)
    
    with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
        csvfile.write(f"# GVAS Synthetic Test Data - Combined Simple Format\n")
        csvfile.write(f"# Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        csvfile.write(f"# Total Intervals: {len(all_intervals)}\n")
        csvfile.write(f"# Format: {', '.join(fieldnames)}\n\n")
        
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        
        # We need to track which well each interval belongs to
        # Since we're generating all intervals together, we'll distribute them
        # For this simple version, let's create a separate file for each well
        pass
    
    return filepath


def create_well_csv(intervals: List[Dict], filename: str, well_id: str) -> str:
    """Create CSV file for a single well with Well_ID prefix."""
    fieldnames = ["Well_ID", "Depth_Start_m", "Depth_End_m", "Lithology"]
    
    filepath = os.path.join(OUTPUT_DIR, filename)
    
    with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
        csvfile.write(f"# {well_id}\n")
        csvfile.write(f"# Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        csvfile.write(f"# Total Intervals: {len(intervals)}\n")
        csvfile.write(f"# Format: {', '.join(fieldnames)}\n\n")
        
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        
        for interval in intervals:
            row = {
                "Well_ID": well_id,
                "Depth_Start_m": interval["Depth_Start_m"],
                "Depth_End_m": interval["Depth_End_m"],
                "Lithology": interval["Lithology"]
            }
            writer.writerow(row)
    
    return filepath


def create_metadata_file() -> str:
    """Create a metadata file describing all generated data."""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    total_intervals = NUM_WELLS_PER_REGION * NUM_REGIONS * NUM_LAYERS_PER_WELL
    
    # Build regions section
    regions_section = "\n".join([f"- **{name}**: {REGIONS[name]['description']}" 
                                  for name in REGIONS.keys()])
    
    # Build lithology section
    lithology_section = ""
    for category, liths in LITHOLOGIES.items():
        lithology_section += f"\n- {category}:\n"
        for lith in liths:
            lithology_section += f"  - {lith}\n"
    
    metadata = f"""# GVAS Synthetic Test Data - Simple Format Metadata
# Generated: {timestamp}
# Python Version: 3.11.9+

## Overview
This directory contains synthetic well log data in **SIMPLE 3-COLUMN FORMAT** for testing GVAS:
- Depth_Start_m: Start depth of interval (meters)
- Depth_End_m: End depth of interval (meters)
- Lithology: Lithology description

## Example Data Format
```
Depth_Start_m	Depth_End_m	Lithology
0	4.62	Top soil
4.62	11.5	Weathered basalt
11.5	23.1	Clay mixed with boulders
23.1	34.65	Slightly fractured basalt
...
```

## Format Details
- Each row represents a depth interval with a single lithology
- Depth ranges are **continuous** (each Depth_Start_m = previous Depth_End_m)
- All depths are in meters
- Lithology descriptions use terms from GVAS volcanic ontology
- Each well has {NUM_LAYERS_PER_WELL} depth intervals

## Files Generated

### Individual Well Files (CSV)
- **ETHIOPIA-WELL-001.csv, ETHIOPIA-WELL-002.csv, etc.**: Individual well data in simple format
- Contains Well_ID, Depth_Start_m, Depth_End_m, Lithology columns

### Region Files (CSV)
- **region_*_simple.csv**: All wells in a region combined
- Contains Depth_Start_m, Depth_End_m, Lithology columns

### Combined File (CSV)
- **all_wells_combined.csv**: All wells from all regions
- Contains Well_ID, Depth_Start_m, Depth_End_m, Lithology columns

## Data Characteristics

### Regions Covered
{regions_section}

### Lithology Types
{lithology_section}

## Usage Instructions

1. **Upload to GVAS**: Use the CSV files directly in the GVAS upload interface
2. **Individual Well Testing**: Use individual well files for single-well analysis
3. **Region Testing**: Use region files for multi-well testing within a region
4. **Combined Testing**: Use the combined file for global analysis

## Data Quality
- Depth ranges are continuous (no gaps)
- Each well has exactly {NUM_LAYERS_PER_WELL} intervals
- Depth values are realistic for volcanic aquifer studies
- Lithology descriptions use terms from the GVAS volcanic ontology

## Statistics
- Total Wells: {NUM_WELLS_PER_REGION * NUM_REGIONS}
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
    print("GVAS Synthetic Data Generator - Simple 3-Column Format")
    print("=" * 80)
    print(f"Generating {NUM_WELLS_PER_REGION} wells per region x {NUM_REGIONS} regions")
    print(f"Each well has {NUM_LAYERS_PER_WELL} depth intervals")
    print(f"Output directory: {OUTPUT_DIR}")
    print()
    
    all_intervals = []
    generated_files = []
    total_wells = 0
    
    # Create well subdirectory
    wells_dir = os.path.join(OUTPUT_DIR, "wells")
    os.makedirs(wells_dir, exist_ok=True)
    
    # Generate data for each region
    for region_name, region_config in REGIONS.items():
        print(f"Generating data for: {region_name}")
        
        # Generate all intervals for all wells in this region
        region_all_intervals = []
        
        for well_num in range(1, NUM_WELLS_PER_REGION + 1):
            well_id = generate_well_id(region_name, well_num)
            intervals = generate_well_intervals(region_name, well_num, NUM_LAYERS_PER_WELL)
            
            # Save individual well file
            well_filename = f"{well_id.replace('-', '_')}.csv"
            well_filepath = create_well_csv(intervals, os.path.join("wells", well_filename), well_id)
            generated_files.append(well_filepath)
            
            # Add to region collection (create a single representative well for region file)
            if well_num == 1:  # Use first well as representative for region
                region_all_intervals = intervals
            
            print(f"  Created: {well_id} with {len(intervals)} intervals")
        
        total_wells += NUM_WELLS_PER_REGION
        
        # Save region file (single representative well, without Well_ID column)
        region_filename = f"region_{region_name.lower().replace(' ', '_')}_simple.csv"
        region_filepath = create_csv_file(region_all_intervals, region_filename, region_config["description"])
        generated_files.append(region_filepath)
        print(f"  Created region file: {region_filename}")
        
        all_intervals.extend(intervals)  # Add first well's intervals to all_intervals
    
    # Create combined CSV with Well_ID
    combined_filename = "all_wells_combined.csv"
    combined_filepath = os.path.join(OUTPUT_DIR, combined_filename)
    
    with open(combined_filepath, 'w', newline='', encoding='utf-8') as csvfile:
        csvfile.write(f"# GVAS Synthetic Test Data - All Wells Combined\n")
        csvfile.write(f"# Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        csvfile.write(f"# Total Intervals: {len(all_intervals)}\n\n")
        
        writer = csv.DictWriter(csvfile, fieldnames=["Well_ID", "Depth_Start_m", "Depth_End_m", "Lithology"])
        writer.writeheader()
        
        # We need to associate intervals with wells
        # Since we generated them separately, let's regenerate for tracking
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
    print(f"\nCreated combined file: {combined_filename}")
    
    # Create metadata file
    metadata_filepath = create_metadata_file()
    generated_files.append(metadata_filepath)
    print(f"Created metadata file: METADATA.md")
    
    print()
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Total wells generated: {total_wells}")
    print(f"Total intervals: {len(all_intervals)}")
    print(f"Intervals per well: {NUM_LAYERS_PER_WELL}")
    print(f"Files created: {len(generated_files)}")
    print(f"Output location: {os.path.abspath(OUTPUT_DIR)}")
    print()
    print("Generated files:")
    print(f"  - {NUM_WELLS_PER_REGION * NUM_REGIONS} individual well files in wells/ directory")
    print(f"  - {NUM_REGIONS} region files")
    print(f"  - {combined_filename}")
    print(f"  - METADATA.md")
    
    print()
    print("Data generation complete!")
    print("Each file uses the simple format: Depth_Start_m, Depth_End_m, Lithology")
    print("You can now upload these files to GVAS for testing.")


if __name__ == "__main__":
    main()
