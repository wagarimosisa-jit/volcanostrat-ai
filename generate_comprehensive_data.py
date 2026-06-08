#!/usr/bin/env python3
"""
GVAS Comprehensive Synthetic Data Generator
Generates:
1. Multiple well CSV files in simple 3-column format
2. Combined CSV with all wells
3. Synthetic study area shapefile
4. Cross-section shapefile for 2D/3D visualization
"""

import csv
import os
import random
from datetime import datetime

# Configuration
OUTPUT_DIR = "comprehensive_synthetic_data"
NUM_WELLS = 10
DEPTH_INTERVALS = 20  # Depth intervals per well
MAX_DEPTH = 50  # meters

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

# Study area coordinates (Ethiopian Rift Valley example)
STUDY_AREA = {
    "name": "GVAS_Synthetic_Study_Area",
    "coordinates": [
        [38.7, 8.9],  # Bottom-left
        [38.7, 9.1],  # Top-left
        [39.1, 9.1],  # Top-right
        [39.1, 8.9],  # Bottom-right
        [38.7, 8.9]   # Close polygon
    ]
}

# Cross-section line
CROSS_SECTION = {
    "name": "GVAS_Cross_Section",
    "coordinates": [
        [38.7, 8.9],
        [39.1, 9.1]
    ]
}

def generate_well_id(num):
    return f"GVAS-WELL-{num:03d}"

def generate_depth_intervals(num_intervals=NUM_WELLS, max_depth=MAX_DEPTH):
    """Generate continuous depth intervals"""
    intervals = []
    current_depth = 0.0
    
    for i in range(num_intervals):
        if i == num_intervals - 1:
            thickness = max_depth - current_depth
        else:
            thickness = random.uniform(1.0, 4.0)
            # Ensure we don't exceed max depth
            remaining = max_depth - current_depth
            if thickness > remaining - (num_intervals - i - 1) * 1.0:
                thickness = remaining - (num_intervals - i - 1) * 1.0
        
        depth_start = round(current_depth, 2)
        depth_end = round(current_depth + thickness, 2)
        
        intervals.append((depth_start, depth_end))
        current_depth = depth_end
    
    # Adjust last interval to reach exactly max_depth
    if intervals:
        intervals[-1] = (intervals[-1][0], round(max_depth, 2))
    
    return intervals

def generate_lithology(depth):
    """Generate realistic lithology based on depth"""
    # Weight towards surface lithologies at shallow depths
    if depth < 5:
        shallow_liths = ["Top soil", "Alluvium", "Sand", "Gravel", "Clay", 
                        "Weathered basalt", "Volcanic Clay"]
        if random.random() < 0.7:
            return random.choice(shallow_liths)
    
    # Mid-depth: more volcanic lithologies
    if depth < 20:
        mid_liths = ["Basalt", "Scoriaceous Basalt", "Vesicular Basalt",
                    "Fractured basalt", "Slightly fractured basalt",
                    "Weathered basalt", "Volcanic Clay", "Tuff"]
        if random.random() < 0.6:
            return random.choice(mid_liths)
    
    # Deep: massive and various basalt types
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

def create_individual_well_csv(well_num, intervals, output_dir):
    """Create individual well CSV file"""
    well_id = generate_well_id(well_num)
    filename = f"{well_id}.csv"
    filepath = os.path.join(output_dir, filename)
    
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        f.write(f"# {well_id}\n")
        f.write(f"# Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"# Format: Depth_Start_m,Depth_End_m,Lithology\n\n")
        
        writer = csv.writer(f)
        writer.writerow(["Depth_Start_m", "Depth_End_m", "Lithology"])
        
        for start, end in intervals:
            lith = generate_lithology(start)
            lith = add_modifiers(lith, start)
            writer.writerow([start, end, lith])
    
    return filepath

def create_combined_csv(all_well_data, output_dir):
    """Create combined CSV with all wells"""
    filepath = os.path.join(output_dir, "ALL_WELLS_COMBINED.csv")
    
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        f.write(f"# GVAS Synthetic Well Data - Combined\n")
        f.write(f"# Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"# Total Wells: {len(all_well_data)}\n")
        f.write(f"# Format: Well_ID,Depth_Start_m,Depth_End_m,Lithology\n\n")
        
        writer = csv.writer(f)
        writer.writerow(["Well_ID", "Depth_Start_m", "Depth_End_m", "Lithology"])
        
        for well_id, intervals in all_well_data:
            for start, end, lith in intervals:
                writer.writerow([well_id, start, end, lith])
    
    return filepath

def create_metadata(output_dir, num_wells, num_intervals):
    """Create metadata file"""
    filepath = os.path.join(output_dir, "METADATA.txt")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write("GVAS Comprehensive Synthetic Data\n")
        f.write("=" * 50 + "\n")
        f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Total Wells: {num_wells}\n")
        f.write(f"Intervals per Well: {num_intervals}\n")
        f.write(f"Max Depth: {MAX_DEPTH}m\n")
        f.write(f"Study Area: {STUDY_AREA['name']}\n")
        f.write(f"Cross-Section: {CROSS_SECTION['name']}\n")
        f.write("\nFiles Generated:\n")
        f.write(f"- Individual well CSVs: {num_wells} files\n")
        f.write(f"- ALL_WELLS_COMBINED.csv\n")
        f.write(f"- study_area.shp (with .shx, .dbf, .prj)\n")
        f.write(f"- cross_section.shp (with .shx, .dbf, .prj)\n")
        f.write(f"- METADATA.txt\n")
    
    return filepath

def create_shapefiles(output_dir):
    """Create shapefiles for study area and cross-section"""
    try:
        import geopandas as gpd
        from shapely.geometry import Polygon, LineString, Point
        import pyproj
        
        shapefile_dir = os.path.join(output_dir, "shapefiles")
        os.makedirs(shapefile_dir, exist_ok=True)
        
        # Create study area polygon
        study_area_poly = Polygon(STUDY_AREA["coordinates"])
        study_gdf = gpd.GeoDataFrame(
            [{"Name": STUDY_AREA["name"], "Type": "Study Area", "geometry": study_area_poly}],
            crs="EPSG:4326"
        )
        
        study_area_file = os.path.join(shapefile_dir, "study_area.shp")
        study_gdf.to_file(study_area_file)
        
        # Create cross-section line
        cross_section_line = LineString(CROSS_SECTION["coordinates"])
        cross_gdf = gpd.GeoDataFrame(
            [{"Name": CROSS_SECTION["name"], "Type": "Cross-Section", "geometry": cross_section_line}],
            crs="EPSG:4326"
        )
        
        cross_section_file = os.path.join(shapefile_dir, "cross_section.shp")
        cross_gdf.to_file(cross_section_file)
        
        # Create well locations shapefile
        # Generate random coordinates within study area
        min_lon = min(coord[0] for coord in STUDY_AREA["coordinates"])
        max_lon = max(coord[0] for coord in STUDY_AREA["coordinates"])
        min_lat = min(coord[1] for coord in STUDY_AREA["coordinates"])
        max_lat = max(coord[1] for coord in STUDY_AREA["coordinates"])
        
        well_points = []
        for i in range(1, NUM_WELLS + 1):
            well_points.append(Point(
                random.uniform(min_lon, max_lon),
                random.uniform(min_lat, max_lat)
            ))
        
        wells_gdf = gpd.GeoDataFrame(
            [{"Well_ID": f"GVAS-WELL-{i:03d}", "Type": "Well", "geometry": pt} 
             for i, pt in enumerate(well_points, 1)],
            crs="EPSG:4326"
        )
        
        wells_file = os.path.join(shapefile_dir, "wells.shp")
        wells_gdf.to_file(wells_file)
        
        return True, [study_area_file, cross_section_file, wells_file]
    except ImportError as e:
        print(f"Shapefile creation requires geopandas: {e}")
        # Create placeholder files
        shapefile_dir = os.path.join(output_dir, "shapefiles")
        os.makedirs(shapefile_dir, exist_ok=True)
        
        # Create README for manual shapefile creation
        readme_file = os.path.join(shapefile_dir, "README.txt")
        with open(readme_file, 'w') as f:
            f.write("Shapefile Creation Instructions\n")
            f.write("=" * 40 + "\n\n")
            f.write("To create shapefiles, install geopandas:\n")
            f.write("  pip install geopandas shapely pyproj\n\n")
            f.write("Then re-run this script.\n\n")
            f.write("Study Area Coordinates (WGS84):\n")
            for coord in STUDY_AREA["coordinates"]:
                f.write(f"  {coord[0]}, {coord[1]}\n")
            f.write("\nCross-Section Coordinates:\n")
            for coord in CROSS_SECTION["coordinates"]:
                f.write(f"  {coord[0]}, {coord[1]}\n")
        
        return False, [readme_file]

def main():
    print("=" * 70)
    print("GVAS Comprehensive Synthetic Data Generator")
    print("=" * 70)
    print(f"Generating {NUM_WELLS} wells with {DEPTH_INTERVALS} intervals each")
    print(f"Max depth: {MAX_DEPTH}m")
    print()
    
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    wells_dir = os.path.join(OUTPUT_DIR, "wells")
    os.makedirs(wells_dir, exist_ok=True)
    
    all_well_data = []
    
    # Generate individual well files
    print(f"Generating {NUM_WELLS} individual well CSV files...")
    for i in range(1, NUM_WELLS + 1):
        intervals = generate_depth_intervals(DEPTH_INTERVALS, MAX_DEPTH)
        
        # Add lithology
        lith_intervals = []
        for start, end in intervals:
            lith = generate_lithology(start)
            lith = add_modifiers(lith, start)
            lith_intervals.append((start, end, lith))
        
        all_well_data.append((generate_well_id(i), lith_intervals))
        
        filepath = create_individual_well_csv(i, intervals, wells_dir)
        print(f"  Created: {os.path.basename(filepath)}")
    
    # Create combined CSV
    print("\nCreating combined CSV file...")
    combined_file = create_combined_csv(all_well_data, OUTPUT_DIR)
    print(f"  Created: {os.path.basename(combined_file)}")
    
    # Create metadata
    print("\nCreating metadata file...")
    metadata_file = create_metadata(OUTPUT_DIR, NUM_WELLS, DEPTH_INTERVALS)
    print(f"  Created: {os.path.basename(metadata_file)}")
    
    # Create shapefiles
    print("\nCreating shapefiles...")
    success, shapefiles = create_shapefiles(OUTPUT_DIR)
    if success:
        print("  Created shapefiles:")
        for sf in shapefiles:
            print(f"    - {os.path.basename(sf)}")
    else:
        print("  Shapefile creation requires geopandas (see shapefiles/README.txt)")
    
    print("\n" + "=" * 70)
    print("Data Generation Complete!")
    print("=" * 70)
    print(f"\nOutput directory: {os.path.abspath(OUTPUT_DIR)}")
    print(f"\nFiles created:")
    print(f"  - {NUM_WELLS} individual well CSV files in 'wells/'")
    print(f"  - ALL_WELLS_COMBINED.csv")
    print(f"  - METADATA.txt")
    print(f"  - Shapefiles in 'shapefiles/' directory")
    print(f"\nFormat: Depth_Start_m,Depth_End_m,Lithology")
    print(f"All files are CSV format, compatible with GVAS import")
    print(f"\nFor 3D visualization:")
    print(f"  1. Upload ALL_WELLS_COMBINED.csv to GVAS")
    print(f"  2. Use study_area.shp for 2D/3D context")
    print(f"  3. Use cross_section.shp for 2D profiles")

if __name__ == "__main__":
    main()
