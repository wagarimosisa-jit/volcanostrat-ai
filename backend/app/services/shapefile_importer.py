"""
Shapefile Import Service for VolcanoStrat AI
Handles upload and processing of shapefile data for well logs and cross-section lines
"""

import os
import tempfile
import zipfile
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union
import pandas as pd
import geopandas as gpd
import shapely
from shapely.geometry import Point, LineString, Polygon, shape
import json


class ShapefileImporter:
    """
    Service for importing and processing shapefile data.
    Supports:
    - Well point data (with attributes)
    - Cross-section line data
    - Study area polygon data
    - Stratigraphy layer polygons
    """
    
    def __init__(self, upload_dir: str = None):
        self.upload_dir = upload_dir or tempfile.gettempdir()
        self.required_well_fields = ['Well_ID', 'X_Coordinate', 'Y_Coordinate', 'Elevation_m', 
                                       'Depth_Start_m', 'Depth_End_m', 'Raw_Lithology_Description']
    
    def process_uploaded_shapefile(self, file_content: bytes, filename: str) -> Dict:
        """
        Process an uploaded shapefile (single file or zip).
        
        Args:
            file_content: Bytes content of the uploaded file
            filename: Original filename
            
        Returns:
            Dict with processed data and metadata
        """
        # Check if it's a zip file (common for shapefile bundles)
        if filename.endswith('.zip') or self._is_zip(file_content):
            return self._process_zip_shapefile(file_content, filename)
        elif filename.endswith('.shp'):
            return self._process_single_shapefile(file_content, filename)
        else:
            raise ValueError(f"Unsupported shapefile format: {filename}")
    
    def _is_zip(self, content: bytes) -> bool:
        """Check if content is a zip file."""
        return content[:4] == b'PK\x03\x04'
    
    def _process_zip_shapefile(self, content: bytes, filename: str) -> Dict:
        """Process a zipped shapefile."""
        with tempfile.NamedTemporaryFile(suffix='.zip', delete=False) as tmp_zip:
            tmp_zip.write(content)
            tmp_zip_path = tmp_zip.name
        
        try:
            # Extract to temp directory
            extract_dir = tempfile.mkdtemp()
            with zipfile.ZipFile(tmp_zip_path, 'r') as zip_ref:
                zip_ref.extractall(extract_dir)
            
            # Find the .shp file
            shp_files = [f for f in os.listdir(extract_dir) if f.endswith('.shp')]
            if not shp_files:
                raise ValueError("No .shp file found in zip archive")
            
            shp_path = os.path.join(extract_dir, shp_files[0])
            result = self._read_shapefile(shp_path)
            
            # Determine data type
            data_type = self._determine_shapefile_type(result)
            result['data_type'] = data_type
            result['source'] = filename
            
            return result
            
        finally:
            # Cleanup
            os.unlink(tmp_zip_path)
            if os.path.exists(extract_dir):
                import shutil
                shutil.rmtree(extract_dir)
    
    def _process_single_shapefile(self, content: bytes, filename: str) -> Dict:
        """Process a single .shp file.
        
        Note: Shapefiles require multiple files (.shp, .shx, .dbf, etc.).
        Uploading a single .shp without companions will fail.
        """
        with tempfile.NamedTemporaryFile(suffix='.shp', delete=False) as tmp_shp:
            tmp_shp.write(content)
            tmp_shp_path = tmp_shp.name
        
        try:
            result = self._read_shapefile(tmp_shp_path)
            data_type = self._determine_shapefile_type(result)
            result['data_type'] = data_type
            result['source'] = filename
            return result
        except Exception as e:
            error_msg = str(e)
            # Check if it's a missing shapefile component error
            if "Unable to open" in error_msg and ".shx" in error_msg:
                raise ValueError(
                    "Shapefile upload failed: Missing required files. "
                    "Shapefiles require .shp, .shx, .dbf, and .prj files. "
                    "Please upload as a .zip file containing all shapefile components."
                )
            raise ValueError(f"Failed to read shapefile: {error_msg}")
        finally:
            os.unlink(tmp_shp_path)
    
    def _read_shapefile(self, shp_path: str) -> Dict:
        """Read a shapefile and return geodataframe."""
        try:
            gdf = gpd.read_file(shp_path)
            return {
                'geodataframe': gdf,
                'crs': str(gdf.crs) if gdf.crs else 'EPSG:4326',
                'geometry_type': gdf.geometry.type.unique().tolist(),
                'columns': gdf.columns.tolist(),
                'feature_count': len(gdf)
            }
        except Exception as e:
            raise ValueError(f"Failed to read shapefile: {str(e)}")
    
    def _determine_shapefile_type(self, result: Dict) -> str:
        """Determine the type of shapefile data."""
        geom_types = result.get('geometry_type', [])
        columns = result.get('columns', [])
        
        # Check for well data
        well_indicators = ['well', 'borehole', 'well_id', 'depth']
        if any(ind in col.lower() for col in columns for ind in well_indicators):
            return 'wells'
        
        # Check for cross-section line
        if any(gt in ['LineString', 'MultiLineString'] for gt in geom_types):
            return 'cross_section_line'
        
        # Check for study area polygon
        if any(gt in ['Polygon', 'MultiPolygon'] for gt in geom_types):
            # Check if it might be stratigraphy layers
            layer_indicators = ['layer', 'strat', 'formation', 'unit']
            if any(ind in col.lower() for col in columns for ind in layer_indicators):
                return 'stratigraphy_layers'
            return 'study_area'
        
        # Check for point data with well information
        if any(gt in ['Point', 'MultiPoint'] for gt in geom_types):
            return 'wells'
        
        return 'unknown'
    
    def convert_to_well_data(self, result: Dict) -> Dict:
        """
        Convert shapefile data to standard well data format.
        
        Args:
            result: Output from process_uploaded_shapefile
            
        Returns:
            Dict with wells list in standard format
        """
        if result['data_type'] != 'wells':
            raise ValueError(f"Shapefile is not well data, it's {result['data_type']}")
        
        gdf = result['geodataframe']
        wells = []
        
        # Try to map columns to required fields
        column_mapping = self._map_columns_to_well_fields(gdf.columns)
        
        for idx, row in gdf.iterrows():
            # Extract coordinates
            geom = row.geometry
            if isinstance(geom, Point):
                x, y = geom.x, geom.y
            elif isinstance(geom, (Polygon, LineString)):
                # Use centroid for polygons/lines
                centroid = geom.centroid
                x, y = centroid.x, centroid.y
            else:
                continue
            
            # Extract depth intervals if available
            depth_intervals = self._extract_depth_intervals(row, gdf.columns)
            
            if not depth_intervals:
                # If no depth intervals, create a single interval from elevation
                elevation = self._get_value(row, column_mapping, 'Elevation_m', default=0)
                depth_intervals = [{
                    'depth_start': 0,
                    'depth_end': 100,  # Default depth
                    'raw_lithology': self._get_value(row, column_mapping, 'Raw_Lithology_Description', default='Unknown')
                }]
            
            well = {
                'Well_ID': self._get_value(row, column_mapping, 'Well_ID', required=True, idx=idx),
                'X_Coordinate': float(x),
                'Y_Coordinate': float(y),
                'Elevation_m': float(self._get_value(row, column_mapping, 'Elevation_m', default=0)),
                'Depth_Start_m': depth_intervals[0]['depth_start'],
                'Depth_End_m': depth_intervals[-1]['depth_end'],
                'Raw_Lithology_Description': depth_intervals[0]['raw_lithology'],
                'Depth_Intervals': depth_intervals
            }
            wells.append(well)
        
        return {
            'wells': wells,
            'count': len(wells),
            'crs': result['crs'],
            'source': result.get('source', 'shapefile')
        }
    
    def _map_columns_to_well_fields(self, columns: List[str]) -> Dict:
        """Map shapefile columns to standard well fields."""
        mapping = {}
        columns_lower = [col.lower() for col in columns]
        
        # Map Well_ID
        for col in columns:
            if any(alias in col.lower() for alias in ['well_id', 'wellid', 'borehole_id', 'hole_id']):
                mapping['Well_ID'] = col
                break
        
        # Map coordinates (already extracted from geometry)
        # Map elevation
        for col in columns:
            if any(alias in col.lower() for alias in ['elev', 'altitude', 'height', 'z']):
                mapping['Elevation_m'] = col
                break
        
        # Map depth fields
        for col in columns:
            if any(alias in col.lower() for alias in ['depth_start', 'depth_from', 'from', 'top']):
                mapping['Depth_Start_m'] = col
            if any(alias in col.lower() for alias in ['depth_end', 'depth_to', 'to', 'bottom']):
                mapping['Depth_End_m'] = col
        
        # Map lithology
        for col in columns:
            if any(alias in col.lower() for alias in ['lithology', 'lith', 'description', 'rock_type']):
                mapping['Raw_Lithology_Description'] = col
                break
        
        return mapping
    
    def _get_value(self, row, column_mapping: Dict, field: str, required: bool = False, default=None, idx: int = None):
        """Get a value from a row using column mapping."""
        if field in column_mapping and column_mapping[field] in row.index:
            val = row[column_mapping[field]]
            if pd.notna(val):
                return val
        
        if required:
            raise ValueError(f"Required field '{field}' not found in row {idx}")
        return default
    
    def _extract_depth_intervals(self, row, columns: List[str]) -> List[Dict]:
        """Extract depth intervals from a row."""
        intervals = []
        
        # Look for fields that might contain depth intervals
        depth_col_patterns = [
            ('depth_from', 'depth_to'),
            ('from', 'to'),
            ('top', 'bottom'),
            ('start', 'end')
        ]
        
        for from_pattern, to_pattern in depth_col_patterns:
            from_cols = [col for col in columns if from_pattern in col.lower()]
            to_cols = [col for col in columns if to_pattern in col.lower()]
            
            if from_cols and to_cols:
                # Found potential depth columns
                for from_col, to_col in zip(from_cols, to_cols):
                    from_val = row.get(from_col)
                    to_val = row.get(to_col)
                    if pd.notna(from_val) and pd.notna(to_val):
                        intervals.append({
                            'depth_start': float(from_val),
                            'depth_end': float(to_val),
                            'raw_lithology': row.get('Raw_Lithology_Description', 'Unknown')
                        })
                break
        
        return intervals
    
    def process_cross_section_line(self, result: Dict) -> Dict:
        """
        Process a cross-section line shapefile.
        
        Args:
            result: Output from process_uploaded_shapefile
            
        Returns:
            Dict with line coordinates
        """
        if result['data_type'] != 'cross_section_line':
            raise ValueError(f"Shapefile is not a cross-section line, it's {result['data_type']}")
        
        gdf = result['geodataframe']
        
        # Extract line coordinates
        line_points = []
        for geom in gdf.geometry:
            if isinstance(geom, LineString):
                for x, y in geom.coords:
                    line_points.append({'x': float(x), 'y': float(y)})
            elif isinstance(geom, Point):
                line_points.append({'x': float(geom.x), 'y': float(geom.y)})
        
        # Ensure we have at least 2 points
        if len(line_points) < 2:
            raise ValueError("Cross-section line must have at least 2 points")
        
        return {
            'line_points': line_points,
            'crs': result['crs'],
            'length_m': self._calculate_line_length(line_points),
            'source': result.get('source', 'shapefile')
        }
    
    def _calculate_line_length(self, points: List[Dict]) -> float:
        """Calculate the length of a line in meters (approximate)."""
        from math import sqrt
        
        if len(points) < 2:
            return 0.0
        
        total_length = 0.0
        for i in range(len(points) - 1):
            x1, y1 = points[i]['x'], points[i]['y']
            x2, y2 = points[i+1]['x'], points[i+1]['y']
            # Approximate distance (assumes coordinates are in meters or close enough)
            dx = x2 - x1
            dy = y2 - y1
            total_length += sqrt(dx**2 + dy**2)
        
        return total_length
    
    def process_study_area(self, result: Dict) -> Dict:
        """
        Process a study area polygon shapefile.
        
        Args:
            result: Output from process_uploaded_shapefile
            
        Returns:
            Dict with polygon data
        """
        if result['data_type'] != 'study_area':
            raise ValueError(f"Shapefile is not a study area, it's {result['data_type']}")
        
        gdf = result['geodataframe']
        
        polygons = []
        for geom in gdf.geometry:
            if isinstance(geom, Polygon):
                # Extract exterior coordinates
                coords = list(geom.exterior.coords)
                polygons.append([{'x': float(x), 'y': float(y)} for x, y in coords])
            elif isinstance(geom, shapely.geometry.multipolygon.MultiPolygon):
                for poly in geom.geoms:
                    coords = list(poly.exterior.coords)
                    polygons.append([{'x': float(x), 'y': float(y)} for x, y in coords])
        
        return {
            'polygons': polygons,
            'crs': result['crs'],
            'area_km2': self._calculate_polygon_area(polygons, result['crs']),
            'source': result.get('source', 'shapefile')
        }
    
    def _calculate_polygon_area(self, polygons: List[List[Dict]], crs: str) -> float:
        """Calculate polygon area in km²."""
        # Simplified area calculation
        # For accurate area, we'd need to consider the CRS and use proper geodesic calculations
        total_area = 0.0
        for polygon in polygons:
            if len(polygon) >= 3:
                # Use shoelace formula for simple area calculation
                n = len(polygon)
                area = 0.0
                for i in range(n):
                    j = (i + 1) % n
                    area += polygon[i]['x'] * polygon[j]['y']
                    area -= polygon[j]['x'] * polygon[i]['y']
                area = abs(area) / 2.0
                total_area += area
        
        # Convert from degrees² to km² (approximate)
        # This is a rough estimate; proper calculation would need projection
        return total_area * 12300  # Approximate conversion factor


# Singleton instance
shapefile_importer = ShapefileImporter()
