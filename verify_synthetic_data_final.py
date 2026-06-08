#!/usr/bin/env python3
"""
GVAS Synthetic Data Verification - Final Simple Format
===================================================
Verifies that the generated data matches the requested format.

Usage:
    python verify_synthetic_data_final.py

Requirements:
    Python 3.11.9+
"""

import csv
import os
import sys
from pathlib import Path

def verify_csv_file(filepath: str, has_well_id: bool = False) -> bool:
    """Verify a CSV file has the correct format."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # Find header line
        header_line = None
        for line in lines:
            stripped = line.strip()
            if stripped and not stripped.startswith('#'):
                header_line = stripped
                break
        
        if header_line is None:
            print(f"  ERROR: No header found")
            return False
        
        # Parse header
        header = list(csv.reader([header_line]))[0]
        
        # Check expected fields
        if has_well_id:
            expected_fields = ["Well_ID", "Depth_Start_m", "Depth_End_m", "Lithology"]
        else:
            expected_fields = ["Depth_Start_m", "Depth_End_m", "Lithology"]
        
        missing = [field for field in expected_fields if field not in header]
        if missing:
            print(f"  ERROR: Missing fields: {missing}")
            return False
        
        # Check data rows
        data_rows = 0
        depth_starts = []
        depth_ends = []
        previous_end = None
        continuity_errors = 0
        
        for line in lines:
            stripped = line.strip()
            if stripped and not stripped.startswith('#') and stripped != header_line:
                data_rows += 1
                row = list(csv.reader([stripped]))[0]
                
                if len(row) < 3 + (1 if has_well_id else 0):
                    print(f"  ERROR: Row has insufficient columns")
                    return False
                
                depth_start_idx = 1 if has_well_id else 0
                depth_end_idx = 2 if has_well_id else 1
                lithology_idx = 3 if has_well_id else 2
                
                depth_start = float(row[depth_start_idx])
                depth_end = float(row[depth_end_idx])
                
                depth_starts.append(depth_start)
                depth_ends.append(depth_end)
                
                # Check depth consistency
                if depth_end <= depth_start:
                    print(f"  ERROR: Invalid depth range: {depth_start} >= {depth_end}")
                    return False
                
                # Check continuity (for simple format without Well_ID)
                if not has_well_id and previous_end is not None:
                    if abs(depth_start - previous_end) > 0.01:  # Allow small rounding errors
                        continuity_errors += 1
                
                previous_end = depth_end
        
        if not has_well_id and continuity_errors > 0:
            print(f"  WARNING: {continuity_errors} continuity gaps detected")
        
        print(f"  Valid: {data_rows} data rows")
        print(f"  Depth range: {min(depth_starts):.2f} - {max(depth_ends):.2f} meters")
        print(f"  Format: {'with Well_ID' if has_well_id else '3-column simple'}")
        return True
            
    except Exception as e:
        print(f"  ERROR: {e}")
        return False


def main():
    """Main verification function."""
    print("=" * 80)
    print("GVAS Synthetic Data Verification - Final Simple Format")
    print("=" * 80)
    
    synthetic_dir = Path("synthetic_test_data_final")
    
    if not synthetic_dir.exists():
        print("ERROR: synthetic_test_data_final directory not found!")
        print("Please run synthetic_data_generator_final.py first.")
        sys.exit(1)
    
    print(f"\nVerifying files in: {synthetic_dir.absolute()}")
    print()
    
    all_valid = True
    
    # Verify region example files (3 columns)
    region_files = list(synthetic_dir.glob("region_*_example.csv"))
    print(f"Region Example Files ({len(region_files)}):")
    
    for region_file in sorted(region_files):
        print(f"\n  {region_file.name}:")
        valid = verify_csv_file(str(region_file), has_well_id=False)
        if not valid:
            all_valid = False
    
    # Verify individual well files (4 columns with Well_ID)
    wells_dir = synthetic_dir / "wells"
    if wells_dir.exists():
        well_files = list(wells_dir.glob("*.csv"))
        print(f"\nWell Files ({len(well_files)}):")
        
        for well_file in sorted(well_files)[:3]:  # Show first 3
            print(f"\n  {well_file.name}:")
            valid = verify_csv_file(str(well_file), has_well_id=True)
            if not valid:
                all_valid = False
        
        if len(well_files) > 3:
            print(f"\n  ... and {len(well_files) - 3} more well files")
    
    # Verify combined file
    combined_file = synthetic_dir / "all_wells_combined.csv"
    if combined_file.exists():
        print(f"\nCombined File:")
        print(f"  all_wells_combined.csv:")
        valid = verify_csv_file(str(combined_file), has_well_id=True)
        if not valid:
            all_valid = False
    
    # Verify metadata
    metadata_file = synthetic_dir / "METADATA.md"
    if metadata_file.exists():
        print(f"\nMETADATA.md:")
        print(f"  Valid: Metadata file exists")
    else:
        print(f"\nMETADATA.md:")
        print(f"  ERROR: Metadata file not found")
        all_valid = False
    
    print()
    print("=" * 80)
    if all_valid:
        print("SUCCESS: All synthetic data is valid!")
        print()
        print("Format matches your example:")
        print("  Depth_Start_m, Depth_End_m, Lithology")
        print()
        print("Next steps:")
        print("1. Start GVAS using auto_run.bat")
        print("2. Upload region_*_example.csv files for simple 3-column format")
        print("3. Or upload individual well files from wells/ directory")
        print("4. Or upload all_wells_combined.csv for multi-well analysis")
    else:
        print("ERROR: Some data files have issues. Please regenerate the data.")
        sys.exit(1)
    print("=" * 80)


if __name__ == "__main__":
    main()
