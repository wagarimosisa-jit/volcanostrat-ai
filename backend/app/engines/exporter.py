import csv
import io
import json
import base64
from typing import List, Dict
import numpy as np


def _get_vtk():
    try:
        import vtk
        return vtk
    except ImportError as e:
        raise ImportError("vtk not installed. Install with: pip install vtk") from e

def export_to_csv(wells: List[Dict]) -> str:
    """Exports well data to CSV (modifiers-only)"""
    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow(['Well_ID', 'Layer_Number', 'Depth_Start', 'Depth_End', 'Thickness',
                     'Modifiers', 'Interbeds', 'Hydro_Property', 'Confidence'])

    for well in wells:
        for layer in well['Layers']:
            modifiers = "; ".join(layer['Modifiers']) if layer['Modifiers'] else ""
            interbeds = "; ".join(layer['Interbeds']) if layer.get('Interbeds') else ""
            writer.writerow([
                well['Well_ID'],
                layer['Layer_Number'],
                layer['Depth_Start'],
                layer['Depth_End'],
                layer['Thickness'],
                modifiers,
                interbeds,
                layer.get('Hydro_Property', ''),
                layer.get('Confidence', '')
            ])

    return output.getvalue()

def export_to_vtk(voxel_model: Dict) -> str:
    """Exports voxel model to VTK format"""
    if not voxel_model or 'voxels' not in voxel_model:
        return ""

    voxels = voxel_model['voxels']
    origin = voxel_model['origin']
    resolution = voxel_model['resolution']
    extent = voxel_model['extent']

    vtk = _get_vtk()

    # Create VTK grid
    grid = vtk.vtkImageData()
    grid.SetDimensions(len(voxels), len(voxels[0]) if voxels else 0, len(voxels[0][0]) if voxels and voxels[0] else 0)
    grid.SetOrigin(origin[0], origin[1], origin[2])
    grid.SetSpacing(resolution, resolution, resolution)

    # Add scalar data (hydro property)
    scalars = vtk.vtkUnsignedCharArray()
    scalars.SetName("HydroProperty")
    scalars.SetNumberOfValues(len(voxels) * len(voxels[0]) * len(voxels[0][0]))

    # Map hydro properties to numbers for VTK
    property_map = {
        "Aquifer (High Productivity)": 1,
        "Aquifer (Moderate Productivity)": 2,
        "Aquifer (Low Productivity)": 3,
        "Aquitard": 4,
        "Unknown": 0
    }

    for i in range(len(voxels)):
        for j in range(len(voxels[i])):
            for k in range(len(voxels[i][j])):
                voxel = voxels[i][j][k]
                if voxel and isinstance(voxel, dict):
                    prop = voxel.get('hydro_property', 'Unknown')
                    scalars.SetValue(i * len(voxels[i]) * len(voxels[i][j]) +
                                    j * len(voxels[i][j]) + k,
                                    property_map.get(prop, 0))
                else:
                    scalars.SetValue(i * len(voxels[i]) * len(voxels[i][j]) +
                                    j * len(voxels[i][j]) + k, 0)

    grid.GetPointData().SetScalars(scalars)

    # Write to string
    writer = vtk.vtkXMLImageDataWriter()
    writer.SetInputData(grid)
    writer.SetFileName("temp.vti")
    writer.Write()

    # Read back and encode as base64
    with open("temp.vti", "rb") as f:
        vtk_data = base64.b64encode(f.read()).decode('utf-8')

    return vtk_data

def export_to_kml(wells: List[Dict]) -> str:
    """Exports well data to KML for Google Earth"""
    kml_header = """<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>GVAS - Well Data</name>
    <description>3D Volcanic Aquifer Model</description>
"""

    kml_footer = """
  </Document>
</kml>
"""

    kml_wells = ""
    for well in wells:
        coords = well['Coordinates']
        kml_wells += f"""
    <Placemark>
      <name>{well['Well_ID']}</name>
      <Point>
        <coordinates>{coords['X']},{coords['Y']},{coords['Elevation']}</coordinates>
      </Point>
    </Placemark>
"""

    return kml_header + kml_wells + kml_footer
