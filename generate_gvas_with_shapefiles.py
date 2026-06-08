#!/usr/bin/env python3
"""
GVAS Format Synthetic Data Generator with Shapefiles
Generates:
1. GVAS format CSV files (Well_ID, X, Y, Elevation, Depth_Start, Depth_End, Lithology)
2. Study area polygon shapefile
3. Cross-section line shapefile
4. Well locations point shapefile
"""

import csv
import os
import random
from datetime import datetime

# Configuration
OUTPUT_DIR = "gvas_format_with_shapefiles"
NUM_WELLS = 10
DEPTH_INTERVALS = 20  # Depth intervals per well
MAX_DEPTH = 50  # meters

# Study area: Ethiopian Rift Valley
STUDY_AREA = {
    "name": "GVAS_Synthetic_Study_Area",
    "coordinates": [
        [38.7, 8.9],  # Bottom-left
        [38.7, 9.1],  # Top-left
        [39.1, 9.1],  # Top-right
        [39.1, 8.9],  # Bottom-right
        [38.7, 8.9]   # Close polygon
    ],
    "min_elevation": 1500,
    "max_elevation": 2000
}

# Cross-section line (diagonal across study area)
CROSS_SECTION = {
    "name": "GVAS_Cross_Section_A_B",
    "coordinates": [
        [38.7, 8.9],
        [39.1, 9.1]
    ]
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

# Store well coordinates for shapefile creation
WELL_COORDINATES = []

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

def create_shapefiles(output_dir, well_coordinates):
    """Create shapefiles for study area, cross-section, and wells"""
    try:
        import geopandas as gpd
        from shapely.geometry import Polygon, LineString, Point
        
        shapefile_dir = os.path.join(output_dir, "shapefiles")
        os.makedirs(shapefile_dir, exist_ok=True)
        
        created_files = []
        
        # 1. Study Area Polygon
        study_area_poly = Polygon(STUDY_AREA["coordinates"])
        study_gdf = gpd.GeoDataFrame(
            [{
                "Name": STUDY_AREA["name"], 
                "Type": "Study Area",
                "Description": "GVAS Synthetic Study Area - Ethiopian Rift Valley",
                "geometry": study_area_poly
            }],
            crs="EPSG:4326"
        )
        study_file = os.path.join(shapefile_dir, "study_area.shp")
        study_gdf.to_file(study_file)
        created_files.append(study_file)
        print(f"  Created: study_area.shp (polygon)")
        
        # 2. Cross-Section Line
        cross_section_line = LineString(CROSS_SECTION["coordinates"])
        cross_gdf = gpd.GeoDataFrame(
            [{
                "Name": CROSS_SECTION["name"],
                "Type": "Cross-Section",
                "Description": "A-B cross-section line",
                "Length_m": round(cross_section_line.length * 111320, 2),  # Approximate meters
                "geometry": cross_section_line
            }],
            crs="EPSG:4326"
        )
        cross_file = os.path.join(shapefile_dir, "cross_section.shp")
        cross_gdf.to_file(cross_file)
        created_files.append(cross_file)
        print(f"  Created: cross_section.shp (line)")
        
        # 3. Well Locations Points
        well_points = []
        well_features = []
        for coord in well_coordinates:
            well_id, x, y, elev = coord
            well_points.append(Point(x, y))
            well_features.append({
                "Well_ID": well_id,
                "X_Coordinate": x,
                "Y_Coordinate": y,
                "Elevation_m": elev,
                "Type": "Well",
                "geometry": Point(x, y)
            })
        
        wells_gdf = gpd.GeoDataFrame(well_features, crs="EPSG:4326")
        wells_file = os.path.join(shapefile_dir, "wells.shp")
        wells_gdf.to_file(wells_file)
        created_files.append(wells_file)
        print(f"  Created: wells.shp ({len(well_coordinates)} points)")
        
        return True, created_files
        
    except ImportError as e:
        print(f"\n  WARNING: Shapefile creation requires geopandas: {e}")
        print(f"  Install with: pip install geopandas shapely pyproj")
        
        # Create placeholder files with coordinates info
        shapefile_dir = os.path.join(output_dir, "shapefiles")
        os.makedirs(shapefile_dir, exist_ok=True)
        
        # Write coordinates to text files
        coords_file = os.path.join(shapefile_dir, "study_area_coordinates.txt")
        with open(coords_file, 'w') as f:
            f.write("# Study Area Polygon (WGS84 decimal degrees)\n")
            f.write("# Format: Longitude, Latitude\n")
            for coord in STUDY_AREA["coordinates"]:
                f.write(f"{coord[0]},{coord[1]}\n")
        
        cross_file = os.path.join(shapefile_dir, "cross_section_coordinates.txt")
        with open(cross_file, 'w') as f:
            f.write("# Cross-Section Line (WGS84 decimal degrees)\n")
            f.write("# Format: Longitude, Latitude\n")
            for coord in CROSS_SECTION["coordinates"]:
                f.write(f"{coord[0]},{coord[1]}\n")
        
        wells_file = os.path.join(shapefile_dir, "wells_coordinates.txt")
        with open(wells_file, 'w') as f:
            f.write("# Well Locations (WGS84 decimal degrees)\n")
            f.write("# Format: Well_ID, Longitude, Latitude, Elevation_m\n")
            for coord in well_coordinates:
                f.write(f"{coord[0]},{coord[1]},{coord[2]},{coord[3]}\n")
        
        return False, [coords_file, cross_file, wells_file]

def create_metadata(output_dir, num_wells, num_intervals, shapefiles_created, min_lon, max_lon, min_lat, max_lat):
    """Create metadata file"""
    filepath = os.path.join(output_dir, "METADATA.txt")
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write("GVAS Synthetic Data - Raw Format with Shapefiles\n")
        f.write("=" * 70 + "\n")
        f.write(f"Generated: {timestamp}\n")
        f.write(f"Total Wells: {num_wells}\n")
        f.write(f"Intervals per Well: {num_intervals}\n")
        f.write(f"Max Depth: {MAX_DEPTH}m\n\n")
        
        f.write("Study Area:\n")
        f.write(f"  Name: {STUDY_AREA['name']}\n")
        f.write(f"  Location: Ethiopian Rift Valley\n")
        f.write(f"  Longitude: {min_lon} - {max_lon}°E\n")
        f.write(f"  Latitude: {min_lat} - {max_lat}°N\n")
        f.write(f"  Elevation: {STUDY_AREA['min_elevation']} - {STUDY_AREA['max_elevation']}m\n\n")
        
        f.write("Cross-Section:\n")
        f.write(f"  Name: {CROSS_SECTION['name']}\n")
        f.write(f"  Coordinates: {CROSS_SECTION['coordinates'][0]} to {CROSS_SECTION['coordinates'][1]}\n\n")
        
        f.write("GVAS Format Columns:\n")
        f.write("  1. Well_ID - Unique well identifier\n")
        f.write("  2. X_Coordinate - Longitude (WGS84 decimal degrees)\n")
        f.write("  3. Y_Coordinate - Latitude (WGS84 decimal degrees)\n")
        f.write("  4. Elevation_m - Elevation in meters (WGS84)\n")
        f.write("  5. Depth_Start_m - Start depth in meters (below ground)\n")
        f.write("  6. Depth_End_m - End depth in meters (below ground)\n")
        f.write("  7. Raw_Lithology_Description - Raw lithology description\n\n")
        
        f.write("Files Generated:\n")
        f.write(f"  - Individual well CSVs: {num_wells} files in 'wells/'\n")
        f.write(f"  - ALL_WELLS_GVAS_FORMAT.csv\n")
        f.write(f"  - METADATA.txt\n")
        
        if shapefiles_created:
            f.write(f"  - Shapefiles in 'shapefiles/' directory:\n")
            for sf in shapefiles_created:
                f.write(f"    - {os.path.basename(sf)}\n")
        else:
            f.write("  - Coordinate files in 'shapefiles/' (install geopandas for .shp files)\n")
        
        f.write("\nUsage for GVAS:\n")
        f.write("  1. Upload ALL_WELLS_GVAS_FORMAT.csv for well data\n")
        f.write("  2. Import study_area.shp for 2D/3D study area boundary\n")
        f.write("  3. Import cross_section.shp for 2D profile visualization\n")
        f.write("  4. Import wells.shp for well location mapping\n")
    
    return filepath

def main():
    print("=" * 70)
    print("GVAS Format Synthetic Data Generator with Shapefiles")
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
    
    # Extract bounds from study area coordinates
    all_lons = [c[0] for c in STUDY_AREA["coordinates"]]
    all_lats = [c[1] for c in STUDY_AREA["coordinates"]]
    min_lon, max_lon = min(all_lons), max(all_lons)
    min_lat, max_lat = min(all_lats), max(all_lats)
    
    for i in range(1, NUM_WELLS + 1):
        well_id = generate_well_id(i)
        
        # Generate coordinates and elevation
        x_coord = round(random.uniform(min_lon, max_lon), 6)
        y_coord = round(random.uniform(min_lat, max_lat), 6)
        elevation = round(random.uniform(STUDY_AREA["min_elevation"], STUDY_AREA["max_elevation"]), 2)
        
        # Store for shapefile creation
        WELL_COORDINATES.append((well_id, x_coord, y_coord, elevation))
        
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
    
    # Create shapefiles
    print("\nCreating shapefiles for 2D/3D visualization...")
    success, shapefiles = create_shapefiles(OUTPUT_DIR, WELL_COORDINATES)
    
    # Create metadata
    print("\nCreating metadata file...")
    metadata_file = create_metadata(OUTPUT_DIR, NUM_WELLS, DEPTH_INTERVALS, shapefiles, min_lon, max_lon, min_lat, max_lat)
    print(f"  Created: {os.path.basename(metadata_file)}")
    
    print("\n" + "=" * 70)
    print("Data Generation Complete!")
    print("=" * 70)
    print(f"\nOutput directory: {os.path.abspath(OUTPUT_DIR)}")
    print(f"\nStructure:")
    print(f"  gvas_format_with_shapefiles/")
    print(f"  +-- wells/")
    print(f"  |   +-- GVAS-WELL-001.csv through GVAS-WELL-010.csv")
    print(f"  +-- shapefiles/")
    print(f"  |   +-- study_area.shp (polygon)")
    print(f"  |   +-- cross_section.shp (line)")
    print(f"  |   +-- wells.shp (points)")
    print(f"  +-- ALL_WELLS_GVAS_FORMAT.csv")
    print(f"  +-- METADATA.txt")
    
    if not success:
        print("\n  NOTE: Full shapefiles require geopandas")
        print("  Install with: pip install geopandas shapely pyproj")
        print("  Coordinate text files created as fallback")
    
    print(f"\nEXACT GVAS Format:")
    print(f"  Well_ID, X_Coordinate, Y_Coordinate, Elevation_m, Depth_Start_m, Depth_End_m, Raw_Lithology_Description")

if __name__ == "__main__":
    main()
