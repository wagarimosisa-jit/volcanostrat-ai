"""
Shapefile Export Service for VolcanoStrat AI
Handles export of stratigraphy layers and well data to shapefile format
"""

import os
import tempfile
import zipfile
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import pandas as pd
import geopandas as gpd
import shapely
from shapely.geometry import Point, LineString, Polygon, MultiPolygon
import json


class ShapefileExporter:
    """
    Service for exporting data to shapefile format.
    Supports exporting:
    - Well locations as points
    - Stratigraphy layers as polygons
    - Cross-sections as lines
    - Combined 2D/3D data
    """
    
    def __init__(self, temp_dir: str = None):
        self.temp_dir = temp_dir or tempfile.gettempdir()
    
    def export_wells_to_shapefile(self, wells: List[Dict], output_format: str = 'zip') -> Dict:
        """
        Export well data to shapefile format.
        
        Args:
            wells: List of well dictionaries
            output_format: 'zip' or 'shp' (zip includes all shapefile files)
            
        Returns:
            Dict with download URL or base64 encoded data
        """
        if not wells:
            raise ValueError("No well data to export")
        
        # Create geodataframe from wells
        features = []
        for well in wells:
            coord = well.get('Coordinates', {})
            x = coord.get('X', 0)
            y = coord.get('Y', 0)
            
            # Create point geometry
            geom = Point(x, y)
            
            # Flatten layer information for attributes
            layers = well.get('Layers', [])
            layer_info = []
            for layer in layers:
                layer_info.append(
                    f"Layer {layer.get('Layer_Number', '?')}: " +
                    f"{', '.join(layer.get('Modifiers', []))} " +
                    f"({layer.get('Hydro_Property', 'Unknown')})"
                )
            
            feature = {
                'geometry': geom,
                'Well_ID': well.get('Well_ID', 'Unknown'),
                'Elevation': coord.get('Elevation', 0),
                'Num_Layers': len(layers),
                'Layer_Info': '\n'.join(layer_info) if layer_info else 'None',
                'Hydro_Prop': self._get_dominant_hydro_property(layers),
                'Confidence': self._calculate_average_confidence(layers)
            }
            features.append(feature)
        
        gdf = gpd.GeoDataFrame(features, crs='EPSG:4326')
        
        # Export to shapefile
        return self._export_geodataframe(gdf, 'wells', output_format)
    
    def _get_dominant_hydro_property(self, layers: List[Dict]) -> str:
        """Get the most common hydro property from layers."""
        from collections import Counter
        props = [l.get('Hydro_Property', 'Unknown') for l in layers if l.get('Hydro_Property')]
        if not props:
            return 'Unknown'
        counter = Counter(props)
        return counter.most_common(1)[0][0]
    
    def _calculate_average_confidence(self, layers: List[Dict]) -> float:
        """Calculate average confidence from layers."""
        confidences = [l.get('Confidence', 0) for l in layers if l.get('Confidence')]
        if not confidences:
            return 0.0
        return round(sum(confidences) / len(confidences), 2)
    
    def export_stratigraphy_layers_to_shapefile(
        self, 
        voxel_model: Dict, 
        wells: List[Dict],
        output_format: str = 'zip'
    ) -> Dict:
        """
        Export stratigraphy layers as polygons to shapefile.
        
        Args:
            voxel_model: Voxel model data
            wells: Well data for reference
            output_format: 'zip' or 'shp'
            
        Returns:
            Dict with download URL or base64 encoded data
        """
        if not voxel_model or 'voxels' not in voxel_model:
            raise ValueError("Invalid voxel model")
        
        # Extract layers from voxel model
        layers_data = self._extract_layers_from_voxel_model(voxel_model)
        
        if not layers_data:
            raise ValueError("No layers found in voxel model")
        
        # Create polygons for each layer
        features = []
        for layer_info in layers_data:
            # Create a polygon representing the layer extent
            # This is a simplified approach - in production, you'd want to
            # trace the actual layer boundaries
            geom = self._create_layer_polygon(voxel_model, layer_info)
            
            feature = {
                'geometry': geom,
                'Layer_Num': layer_info.get('layer_number', 0),
                'Hydro_Prop': layer_info.get('hydro_property', 'Unknown'),
                'Modifiers': ', '.join(layer_info.get('modifiers', [])),
                'Voxel_Count': layer_info.get('voxel_count', 0),
                'Depth_Range': f"{layer_info.get('depth_min', 0):.1f}-{layer_info.get('depth_max', 0):.1f} m"
            }
            features.append(feature)
        
        gdf = gpd.GeoDataFrame(features, crs='EPSG:4326')
        
        return self._export_geodataframe(gdf, 'stratigraphy_layers', output_format)
    
    def _extract_layers_from_voxel_model(self, voxel_model: Dict) -> List[Dict]:
        """Extract unique layers from voxel model."""
        voxels = voxel_model.get('voxels', [])
        origin = voxel_model.get('origin', (0, 0, 0))
        resolution = voxel_model.get('resolution', 10)
        
        if not voxels:
            return []
        
        # Group voxels by properties
        layer_map = {}
        
        for i in range(len(voxels)):
            for j in range(len(voxels[i])):
                for k in range(len(voxels[i][j])):
                    voxel = voxels[i][j][k]
                    if voxel and isinstance(voxel, dict):
                        key = (
                            tuple(sorted(voxel.get('modifiers', []))),
                            voxel.get('hydro_property', 'Unknown')
                        )
                        if key not in layer_map:
                            layer_map[key] = {
                                'modifiers': list(key[0]),
                                'hydro_property': key[1],
                                'voxel_count': 0,
                                'min_i': i, 'max_i': i,
                                'min_j': j, 'max_j': j,
                                'min_k': k, 'max_k': k
                            }
                        else:
                            layer_map[key]['voxel_count'] += 1
                            layer_map[key]['min_i'] = min(layer_map[key]['min_i'], i)
                            layer_map[key]['max_i'] = max(layer_map[key]['max_i'], i)
                            layer_map[key]['min_j'] = min(layer_map[key]['min_j'], j)
                            layer_map[key]['max_j'] = max(layer_map[key]['max_j'], j)
                            layer_map[key]['min_k'] = min(layer_map[key]['min_k'], k)
                            layer_map[key]['max_k'] = max(layer_map[key]['max_k'], k)
        
        # Convert to list with layer numbers
        layers = []
        for idx, (key, info) in enumerate(layer_map.items(), 1):
            z_min = origin[2] + info['min_k'] * resolution
            z_max = origin[2] + info['max_k'] * resolution
            info['layer_number'] = idx
            info['depth_min'] = -z_min  # Convert to depth (positive down)
            info['depth_max'] = -z_max
            layers.append(info)
        
        return layers
    
    def _create_layer_polygon(self, voxel_model: Dict, layer_info: Dict) -> Polygon:
        """Create a polygon representing a layer's extent."""
        origin = voxel_model.get('origin', (0, 0, 0))
        resolution = voxel_model.get('resolution', 10)
        
        # Get the bounding box of the layer
        min_i = layer_info.get('min_i', 0)
        max_i = layer_info.get('max_i', 0)
        min_j = layer_info.get('min_j', 0)
        max_j = layer_info.get('max_j', 0)
        min_k = layer_info.get('min_k', 0)
        max_k = layer_info.get('max_k', 0)
        
        # Convert to coordinates
        x_min = origin[0] + min_i * resolution
        x_max = origin[0] + (max_i + 1) * resolution
        y_min = origin[1] + min_j * resolution
        y_max = origin[1] + (max_j + 1) * resolution
        z_min = origin[2] + min_k * resolution
        z_max = origin[2] + (max_k + 1) * resolution
        
        # For now, create a simple rectangular polygon in 2D
        # (shapefiles are 2D, so we'll use the top view)
        coords = [
            (x_min, y_min),
            (x_max, y_min),
            (x_max, y_max),
            (x_min, y_max),
            (x_min, y_min)
        ]
        
        return Polygon(coords)
    
    def export_cross_section_to_shapefile(
        self, 
        cross_section: Dict,
        output_format: str = 'zip'
    ) -> Dict:
        """
        Export cross-section as line shapefile.
        
        Args:
            cross_section: Cross-section data
            output_format: 'zip' or 'shp'
            
        Returns:
            Dict with download URL or base64 encoded data
        """
        if not cross_section or 'data' not in cross_section:
            raise ValueError("Invalid cross-section data")
        
        data = cross_section.get('data', [])
        
        # Group points by distance to create line segments
        line_features = []
        current_line_points = []
        current_hydro_prop = None
        
        for point in sorted(data, key=lambda x: (x.get('distance', 0), x.get('depth', 0))):
            # Start a new line when hydro property changes
            if point.get('hydro_property') != current_hydro_prop:
                if current_line_points:
                    # Save previous line
                    if len(current_line_points) >= 2:
                        line_features.append({
                            'geometry': LineString(current_line_points),
                            'Hydro_Prop': current_hydro_prop,
                            'Modifiers': ', '.join(point.get('modifiers', []))
                        })
                    current_line_points = []
                current_hydro_prop = point.get('hydro_property', 'Unknown')
            
            # Add point to current line
            current_line_points.append((
                point.get('distance', 0),
                -point.get('depth', 0)  # Negative depth for upward direction
            ))
        
        # Add the last line
        if current_line_points and len(current_line_points) >= 2:
            line_features.append({
                'geometry': LineString(current_line_points),
                'Hydro_Prop': current_hydro_prop,
                'Modifiers': ', '.join(current_line_points[0][2] if len(current_line_points[0]) > 2 else [])
            })
        
        gdf = gpd.GeoDataFrame(line_features, crs='EPSG:4326')
        
        return self._export_geodataframe(gdf, 'cross_section', output_format)
    
    def export_2d_stratigraphy_to_shapefile(
        self,
        cross_section: Dict,
        line_points: List[Dict],
        output_format: str = 'zip'
    ) -> Dict:
        """
        Export 2D stratigraphy from cross-section as polygons.
        
        Args:
            cross_section: Cross-section data
            line_points: Line points defining the cross-section
            output_format: 'zip' or 'shp'
            
        Returns:
            Dict with download URL or base64 encoded data
        """
        if not cross_section or 'data' not in cross_section:
            raise ValueError("Invalid cross-section data")
        
        data = cross_section.get('data', [])
        
        # Group by hydro property and create polygons
        # This is a simplified approach - in production, you'd want to
        # properly trace layer boundaries
        
        # For now, create a line representation
        return self.export_cross_section_to_shapefile(cross_section, output_format)
    
    def export_3d_model_to_shapefile(
        self,
        voxel_model: Dict,
        output_format: str = 'zip'
    ) -> Dict:
        """
        Export 3D voxel model as shapefile (2D representation).
        
        Args:
            voxel_model: Voxel model data
            output_format: 'zip' or 'shp'
            
        Returns:
            Dict with download URL or base64 encoded data
        """
        if not voxel_model or 'voxels' not in voxel_model:
            raise ValueError("Invalid voxel model")
        
        # Create a simplified 2D representation by taking the top slice
        voxels = voxel_model.get('voxels', [])
        origin = voxel_model.get('origin', (0, 0, 0))
        resolution = voxel_model.get('resolution', 10)
        
        if not voxels or not voxels[0] or not voxels[0][0]:
            raise ValueError("Empty voxel model")
        
        # Take the top layer (k=0)
        top_layer = voxels[0][0]  # First row, first column
        
        # Create polygons for each unique hydro property in the top layer
        features = []
        prop_map = {}
        
        for i in range(len(voxels)):
            for j in range(len(voxels[i])):
                # Get the top voxel at this (i,j) position
                for k in range(len(voxels[i][j])):
                    voxel = voxels[i][j][k]
                    if voxel and isinstance(voxel, dict):
                        prop = voxel.get('hydro_property', 'Unknown')
                        if prop not in prop_map:
                            prop_map[prop] = []
                        prop_map[prop].append((i, j, k))
                        break
        
        # Create a polygon for each property
        for prop, coords in prop_map.items():
            if len(coords) >= 3:
                # Create a convex hull polygon (simplified)
                # Get all unique (i,j) positions
                positions = set((i, j) for i, j, k in coords)
                if len(positions) >= 3:
                    # Convert to coordinates
                    x_min = origin[0] + min(i for i, j in positions) * resolution
                    x_max = origin[0] + (max(i for i, j in positions) + 1) * resolution
                    y_min = origin[1] + min(j for i, j in positions) * resolution
                    y_max = origin[1] + (max(j for i, j in positions) + 1) * resolution
                    
                    polygon_coords = [
                        (x_min, y_min),
                        (x_max, y_min),
                        (x_max, y_max),
                        (x_min, y_max),
                        (x_min, y_min)
                    ]
                    
                    features.append({
                        'geometry': Polygon(polygon_coords),
                        'Hydro_Prop': prop,
                        'Voxel_Count': len(coords)
                    })
        
        gdf = gpd.GeoDataFrame(features, crs='EPSG:4326')
        
        return self._export_geodataframe(gdf, '3d_model_2d', output_format)
    
    def _export_geodataframe(self, gdf: gpd.GeoDataFrame, name: str, output_format: str) -> Dict:
        """Export a geodataframe to shapefile format."""
        if gdf.empty:
            raise ValueError(f"GeoDataFrame is empty for {name}")
        
        # Create temp directory
        temp_dir = tempfile.mkdtemp()
        try:
            # Save shapefile
            shp_path = os.path.join(temp_dir, f"{name}.shp")
            gdf.to_file(shp_path)
            
            if output_format == 'zip':
                # Create zip file
                zip_path = os.path.join(temp_dir, f"{name}.zip")
                with zipfile.ZipFile(zip_path, 'w') as zipf:
                    # Add all shapefile files
                    for ext in ['shp', 'shx', 'dbf', 'prj', 'cpg']:
                        file_path = os.path.join(temp_dir, f"{name}.{ext}")
                        if os.path.exists(file_path):
                            zipf.write(file_path, f"{name}.{ext}")
                    
                    # Add metadata
                    metadata = {
                        'name': name,
                        'feature_count': len(gdf),
                        'crs': str(gdf.crs) if gdf.crs else 'EPSG:4326',
                        'exported_by': 'VolcanoStrat AI',
                        'columns': gdf.columns.tolist()
                    }
                    zipf.writestr(f"{name}_metadata.json", json.dumps(metadata, indent=2))
                
                # Read and encode the zip file
                with open(zip_path, 'rb') as f:
                    data = f.read()
                
                return {
                    'format': 'shapefile_zip',
                    'data': data,
                    'filename': f"{name}.zip",
                    'feature_count': len(gdf),
                    'mime_type': 'application/zip'
                }
            else:
                # Return individual files (not recommended for web)
                files = {}
                for ext in ['shp', 'shx', 'dbf', 'prj', 'cpg']:
                    file_path = os.path.join(temp_dir, f"{name}.{ext}")
                    if os.path.exists(file_path):
                        with open(file_path, 'rb') as f:
                            files[f"{name}.{ext}"] = f.read()
                
                return {
                    'format': 'shapefile_files',
                    'files': files,
                    'filename': f"{name}.shp",
                    'feature_count': len(gdf),
                    'mime_type': 'application/octet-stream'
                }
                
        finally:
            # Cleanup
            import shutil
            shutil.rmtree(temp_dir)
    
    def create_downloadable_shapefile(
        self,
        data_type: str,
        data: Dict,
        line_points: Optional[List[Dict]] = None,
        resolution: float = 10.0
    ) -> Dict:
        """
        Main method to create a downloadable shapefile based on data type.
        
        Args:
            data_type: Type of data to export - 'wells', 'layers', '2d', '3d', 'cross_section'
            data: The data to export
            line_points: Optional line points for 2D export
            resolution: Resolution for 3D model
            
        Returns:
            Dict with downloadable shapefile data
        """
        try:
            if data_type == 'wells':
                return self.export_wells_to_shapefile(data.get('wells', []))
            elif data_type == 'layers':
                return self.export_stratigraphy_layers_to_shapefile(
                    data.get('voxel_model', {}),
                    data.get('wells', [])
                )
            elif data_type == 'combined_2d':
                return self.export_2d_stratigraphy_to_shapefile(
                    data.get('cross_section', {}),
                    line_points or [],
                    resolution
                )
            elif data_type == 'combined_3d':
                return self.export_3d_model_to_shapefile(
                    data.get('voxel_model', {}),
                    resolution
                )
            elif data_type == 'cross_section':
                return self.export_cross_section_to_shapefile(
                    data.get('cross_section', {})
                )
            else:
                raise ValueError(f"Unknown data type: {data_type}")
        except Exception as e:
            return {
                'error': str(e),
                'format': 'error'
            }


# Singleton instance
shapefile_exporter = ShapefileExporter()
