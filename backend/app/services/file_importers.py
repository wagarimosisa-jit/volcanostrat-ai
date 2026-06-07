"""
File Import Services for VolcanoStrat AI
Supports: Excel, LAS, GeoJSON, and CSV formats
"""

import io
import re
from typing import Dict, List, Optional, Union
from pathlib import Path

try:
    import pandas as pd
    import openpyxl
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False

try:
    import lasio
    HAS_LASIO = True
except ImportError:
    HAS_LASIO = False

try:
    import geopandas as gpd
    HAS_GEOPANDAS = True
except ImportError:
    HAS_GEOPANDAS = False


class ExcelImporter:
    """Service for importing Excel well log files (.xlsx, .xls)"""
    
    @staticmethod
    def can_handle(filename: str) -> bool:
        """Check if this importer can handle the file"""
        return filename.lower().endswith(('.xlsx', '.xls'))
    
    @staticmethod
    def import_file(file_content: bytes, filename: str) -> Dict:
        """
        Import an Excel file and convert to well data format.
        
        Args:
            file_content: Bytes content of the Excel file
            filename: Original filename
            
        Returns:
            Dict with wells list in standard format
        """
        if not HAS_PANDAS:
            raise ImportError("Pandas not installed. Install with: pip install pandas openpyxl")
        
        try:
            # Read Excel file
            xls = pd.ExcelFile(io.BytesIO(file_content))
            
            # Get first sheet
            sheet_name = xls.sheet_names[0]
            df = pd.read_excel(xls, sheet_name=sheet_name)
            
            # Convert to well data
            return ExcelImporter._convert_to_well_data(df, filename)
            
        except Exception as e:
            raise ValueError(f"Failed to read Excel file: {str(e)}")
    
    @staticmethod
    def _convert_to_well_data(df: pd.DataFrame, filename: str) -> Dict:
        """Convert DataFrame to well data format"""
        wells = []
        
        # Try to detect if it's a single well with multiple intervals
        # or multiple wells
        
        # Check for Well_ID column
        if 'Well_ID' in df.columns:
            # Multiple wells
            well_ids = df['Well_ID'].unique()
            for well_id in well_ids:
                well_df = df[df['Well_ID'] == well_id]
                intervals = ExcelImporter._extract_intervals(well_df)
                wells.append(ExcelImporter._create_well(well_id, well_df, intervals, filename))
        else:
            # Single well or all data for one well
            intervals = ExcelImporter._extract_intervals(df)
            wells.append(ExcelImporter._create_well('Well_1', df, intervals, filename))
        
        return {
            'wells': wells,
            'count': len(wells),
            'format': 'excel',
            'source': filename
        }
    
    @staticmethod
    def _extract_intervals(df: pd.DataFrame) -> List[Dict]:
        """Extract depth intervals from DataFrame"""
        intervals = []
        
        # Look for depth columns
        depth_start_cols = [col for col in df.columns if 'depth' in col.lower() and ('start' in col.lower() or 'from' in col.lower() or 'top' in col.lower())]
        depth_end_cols = [col for col in df.columns if 'depth' in col.lower() and ('end' in col.lower() or 'to' in col.lower() or 'bottom' in col.lower())]
        lithology_cols = [col for col in df.columns if 'lith' in col.lower() or 'description' in col.lower() or 'rock' in col.lower()]
        
        if depth_start_cols and depth_end_cols and lithology_cols:
            # Use specific columns
            start_col = depth_start_cols[0]
            end_col = depth_end_cols[0]
            lith_col = lithology_cols[0]
            
            for _, row in df.iterrows():
                interval = {
                    'depth_start': float(row[start_col]),
                    'depth_end': float(row[end_col]),
                    'raw_lithology': str(row[lith_col])
                }
                intervals.append(interval)
        else:
            # Try default column names
            for _, row in df.iterrows():
                interval = {
                    'depth_start': float(row.get('Depth_Start_m', row.get('From', row.get('Top', 0)))),
                    'depth_end': float(row.get('Depth_End_m', row.get('To', row.get('Bottom', 100)))),
                    'raw_lithology': str(row.get('Raw_Lithology_Description', row.get('Lithology', row.get('Description', 'Unknown'))))
                }
                intervals.append(interval)
        
        return intervals
    
    @staticmethod
    def _create_well(well_id: str, df: pd.DataFrame, intervals: List[Dict], filename: str) -> Dict:
        """Create a well dictionary"""
        # Extract coordinates
        x = df.get('X_Coordinate', df.get('Longitude', df.get('X', 0)))
        y = df.get('Y_Coordinate', df.get('Latitude', df.get('Y', 0)))
        elevation = df.get('Elevation_m', df.get('Elevation', df.get('Z', 0)))
        
        if isinstance(x, pd.Series):
            x = x.iloc[0] if len(x) > 0 else 0
        if isinstance(y, pd.Series):
            y = y.iloc[0] if len(y) > 0 else 0
        if isinstance(elevation, pd.Series):
            elevation = elevation.iloc[0] if len(elevation) > 0 else 0
        
        return {
            'Well_ID': str(well_id),
            'X_Coordinate': float(x),
            'Y_Coordinate': float(y),
            'Elevation_m': float(elevation),
            'Depth_Intervals': intervals,
            'source': filename
        }


class LASImporter:
    """Service for importing LAS (Log ASCII Standard) well log files"""
    
    @staticmethod
    def can_handle(filename: str) -> bool:
        """Check if this importer can handle the file"""
        return filename.lower().endswith('.las')
    
    @staticmethod
    def import_file(file_content: bytes, filename: str) -> Dict:
        """
        Import a LAS file and convert to well data format.
        
        Args:
            file_content: Bytes content of the LAS file
            filename: Original filename
            
        Returns:
            Dict with well data in standard format
        """
        if not HAS_LASIO:
            raise ImportError("lasio not installed. Install with: pip install lasio")
        
        try:
            # Read LAS file
            text_content = file_content.decode('utf-8', errors='ignore')
            las = lasio.read(io.StringIO(text_content))
            
            # Extract well information
            well_data = LASImporter._extract_well_data(las)
            
            # Extract curves/intervals
            intervals = LASImporter._extract_intervals(las)
            
            return {
                'wells': [well_data],
                'count': 1,
                'format': 'las',
                'source': filename,
                'metadata': {
                    'version': las.version,
                    'well_name': las.well.WELL.value if hasattr(las.well, 'WELL') else None,
                    'company': las.well.COMP.value if hasattr(las.well, 'COMP') else None,
                    'date': las.well.DATE.value if hasattr(las.well, 'DATE') else None
                }
            }
            
        except Exception as e:
            raise ValueError(f"Failed to read LAS file: {str(e)}")
    
    @staticmethod
    def _extract_well_data(las) -> Dict:
        """Extract well metadata from LAS file"""
        well_info = {}
        
        # Extract coordinates (try different common column names)
        for param in ['X', 'LONG', 'LONGITUDE', 'X_COORD']:
            if hasattr(las.well, param):
                well_info['X_Coordinate'] = float(las.well[param].value)
                break
        else:
            well_info['X_Coordinate'] = 0.0
        
        for param in ['Y', 'LAT', 'LATITUDE', 'Y_COORD']:
            if hasattr(las.well, param):
                well_info['Y_Coordinate'] = float(las.well[param].value)
                break
        else:
            well_info['Y_Coordinate'] = 0.0
        
        for param in ['ELEV', 'ELEVATION', 'ELEV_M', 'GL']:
            if hasattr(las.well, param):
                well_info['Elevation_m'] = float(las.well[param].value)
                break
        else:
            well_info['Elevation_m'] = 0.0
        
        # Well ID
        for param in ['WELL', 'NAME', 'WELL_NAME']:
            if hasattr(las.well, param):
                well_info['Well_ID'] = str(las.well[param].value)
                break
        else:
            well_info['Well_ID'] = Path(filename).stem
        
        return well_info
    
    @staticmethod
    def _extract_intervals(las) -> List[Dict]:
        """Extract depth intervals and lithology from LAS curves"""
        intervals = []
        
        # Check if we have depth and lithology columns
        depth_col = None
        lith_col = None
        
        for col in las.columns:
            col_lower = col.lower().strip()
            if 'depth' in col_lower:
                depth_col = col
            elif any(lith in col_lower for lith in ['lith', 'rock', 'strat', 'formation']):
                lith_col = col
        
        if not depth_col:
            # Try first column as depth
            if len(las.columns) > 0:
                depth_col = las.columns[0]
        
        if not lith_col:
            # Try to find a column with text data
            for col in las.columns:
                if col != depth_col:
                    lith_col = col
                    break
        
        if depth_col and lith_col:
            # Create intervals
            depths = las[depth_col]
            liths = las[lith_col]
            
            for i in range(len(depths)):
                if i == 0:
                    continue
                
                interval = {
                    'depth_start': float(depths[i-1]),
                    'depth_end': float(depths[i]),
                    'raw_lithology': str(liths[i])
                }
                intervals.append(interval)
        
        return intervals


class GeoJSONImporter:
    """Service for importing GeoJSON files"""
    
    @staticmethod
    def can_handle(filename: str) -> bool:
        """Check if this importer can handle the file"""
        return filename.lower().endswith(('.geojson', '.json'))
    
    @staticmethod
    def import_file(file_content: bytes, filename: str) -> Dict:
        """
        Import a GeoJSON file and convert to well data format.
        
        Args:
            file_content: Bytes content of the GeoJSON file
            filename: Original filename
            
        Returns:
            Dict with well data in standard format
        """
        if not HAS_GEOPANDAS:
            raise ImportError("GeoPandas not installed. Install with: pip install geopandas")
        
        try:
            import json
            
            # Parse JSON
            data = json.loads(file_content.decode('utf-8'))
            
            if data.get('type') != 'FeatureCollection':
                raise ValueError("GeoJSON must be a FeatureCollection")
            
            wells = []
            for feature in data.get('features', []):
                well = GeoJSONImporter._feature_to_well(feature, filename)
                if well:
                    wells.append(well)
            
            return {
                'wells': wells,
                'count': len(wells),
                'format': 'geojson',
                'source': filename,
                'crs': data.get('crs', {}).get('properties', {}).get('name', 'EPSG:4326')
            }
            
        except Exception as e:
            raise ValueError(f"Failed to read GeoJSON file: {str(e)}")
    
    @staticmethod
    def _feature_to_well(feature: Dict, filename: str) -> Optional[Dict]:
        """Convert a GeoJSON feature to well data"""
        geometry = feature.get('geometry')
        properties = feature.get('properties', {})
        
        if not geometry:
            return None
        
        # Extract coordinates
        coords = []
        if geometry.get('type') == 'Point':
            coords = geometry.get('coordinates', [])
        elif geometry.get('type') == 'LineString':
            coords = geometry.get('coordinates', [])[0]  # Use first point
        elif geometry.get('type') == 'Polygon':
            coords = geometry.get('coordinates', [[[]]])[0][0]  # Use first point of exterior ring
        
        if len(coords) < 2:
            return None
        
        # For Point: [longitude, latitude] or [x, y, z]
        x = coords[0]
        y = coords[1]
        elevation = coords[2] if len(coords) > 2 else properties.get('elevation', properties.get('z', 0))
        
        # Extract well ID
        well_id = properties.get('Well_ID', properties.get('id', properties.get('name', f"Well_{len(coords)}")))
        
        # Extract depth intervals if available
        intervals = []
        if 'depths' in properties:
            depths = properties['depths']
            lithologies = properties.get('lithologies', [])
            for i in range(len(depths)):
                if i == 0:
                    continue
                interval = {
                    'depth_start': float(depths[i-1]),
                    'depth_end': float(depths[i]),
                    'raw_lithology': str(lithologies[i] if i < len(lithologies) else 'Unknown')
                }
                intervals.append(interval)
        
        return {
            'Well_ID': str(well_id),
            'X_Coordinate': float(x),
            'Y_Coordinate': float(y),
            'Elevation_m': float(elevation),
            'Depth_Intervals': intervals if intervals else [{
                'depth_start': 0,
                'depth_end': 100,
                'raw_lithology': properties.get('lithology', properties.get('description', 'Unknown'))
            }],
            'source': filename
        }


class FileImporterFactory:
    """Factory for getting the right importer for a file"""
    
    IMPORTERS = [
        ShapefileImporter,  # Will be imported separately
        ExcelImporter,
        LASImporter,
        GeoJSONImporter
    ]
    
    @classmethod
    def get_importer(cls, filename: str):
        """Get the appropriate importer for a file"""
        for importer_class in cls.IMPORTERS:
            if hasattr(importer_class, 'can_handle') and importer_class.can_handle(filename):
                return importer_class()
        return None
    
    @classmethod
    def import_file(cls, file_content: bytes, filename: str) -> Dict:
        """Import a file using the appropriate importer"""
        importer = cls.get_importer(filename)
        if importer:
            return importer.import_file(file_content, filename)
        
        # Default to CSV if no specific importer found
        if filename.lower().endswith('.csv'):
            return cls._import_csv(file_content, filename)
        
        raise ValueError(f"No importer found for file type: {filename}")
    
    @staticmethod
    def _import_csv(file_content: bytes, filename: str) -> Dict:
        """Import a CSV file"""
        import pandas as pd
        
        df = pd.read_csv(io.BytesIO(file_content))
        
        # Convert to well data
        wells = []
        
        if 'Well_ID' in df.columns:
            # Multiple wells
            well_ids = df['Well_ID'].unique()
            for well_id in well_ids:
                well_df = df[df['Well_ID'] == well_id]
                intervals = []
                for _, row in well_df.iterrows():
                    interval = {
                        'depth_start': float(row.get('Depth_Start_m', 0)),
                        'depth_end': float(row.get('Depth_End_m', 100)),
                        'raw_lithology': str(row.get('Raw_Lithology_Description', 'Unknown'))
                    }
                    intervals.append(interval)
                
                wells.append({
                    'Well_ID': str(well_id),
                    'X_Coordinate': float(row.get('X_Coordinate', 0)),
                    'Y_Coordinate': float(row.get('Y_Coordinate', 0)),
                    'Elevation_m': float(row.get('Elevation_m', 0)),
                    'Depth_Intervals': intervals,
                    'source': filename
                })
        else:
            # Single well
            intervals = []
            for _, row in df.iterrows():
                interval = {
                    'depth_start': float(row.get('Depth_Start_m', 0)),
                    'depth_end': float(row.get('Depth_End_m', 100)),
                    'raw_lithology': str(row.get('Raw_Lithology_Description', 'Unknown'))
                }
                intervals.append(interval)
            
            wells.append({
                'Well_ID': 'Well_1',
                'X_Coordinate': float(df.get('X_Coordinate', [0])[0]),
                'Y_Coordinate': float(df.get('Y_Coordinate', [0])[0]),
                'Elevation_m': float(df.get('Elevation_m', [0])[0]),
                'Depth_Intervals': intervals,
                'source': filename
            })
        
        return {
            'wells': wells,
            'count': len(wells),
            'format': 'csv',
            'source': filename
        }


# Import the ShapefileImporter that we created earlier
try:
    from .shapefile_importer import ShapefileImporter
except ImportError:
    class ShapefileImporter:
        @staticmethod
        def can_handle(filename: str) -> bool:
            return filename.lower().endswith(('.shp', '.zip'))
        
        @staticmethod
        def import_file(file_content: bytes, filename: str) -> Dict:
            raise NotImplementedError("ShapefileImporter not available. Install geopandas.")
