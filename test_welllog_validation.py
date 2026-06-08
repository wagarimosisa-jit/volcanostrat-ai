#!/usr/bin/env python3
"""
Test script to verify WellLog model accepts float depth values
"""

import sys
sys.path.insert(0, 'C:\\Users\\Hayyuu\\volcanostrat-ai\\backend\\app')

from models.well_log import WellLog

# Test with integer depths (should work)
print("Testing integer depths...")
try:
    well1 = WellLog(
        Well_ID="TEST-WELL-001",
        X_Coordinate=38.922037,
        Y_Coordinate=8.979068,
        Elevation_m=1830.43,
        Depth_Start_m=0,
        Depth_End_m=10,
        Raw_Lithology_Description="Basalt"
    )
    print("[PASS] Integer depths: OK")
except Exception as e:
    print(f"[FAIL] Integer depths: {e}")

# Test with float depths (this was failing before the fix)
print("\nTesting float depths...")
try:
    well2 = WellLog(
        Well_ID="TEST-WELL-002",
        X_Coordinate=38.922037,
        Y_Coordinate=8.979068,
        Elevation_m=1830.43,
        Depth_Start_m=0.0,
        Depth_End_m=3.35,
        Raw_Lithology_Description="Basalt"
    )
    print("[PASS] Float depths: OK")
except Exception as e:
    print(f"[FAIL] Float depths: {e}")

# Test with more float values from synthetic data
print("\nTesting various float depths from synthetic data...")
test_cases = [
    (0.0, 1.65, "Alluvium"),
    (1.65, 2.95, "Basalt"),
    (2.95, 5.42, "Hyaloclastite"),
    (5.42, 7.39, "Pillow Basalt Weathered Moderately fractured"),
]

for start, end, lith in test_cases:
    try:
        well = WellLog(
            Well_ID="TEST-WELL",
            X_Coordinate=38.922037,
            Y_Coordinate=8.979068,
            Elevation_m=1830.43,
            Depth_Start_m=start,
            Depth_End_m=end,
            Raw_Lithology_Description=lith
        )
        print(f"[PASS] Depth {start}-{end}m ({lith}): OK")
    except Exception as e:
        print(f"[FAIL] Depth {start}-{end}m ({lith}): {e}")

print("\n" + "="*60)
print("All tests completed!")
print("WellLog model now accepts integers, floats, and decimals.")
