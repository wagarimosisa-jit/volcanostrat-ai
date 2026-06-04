import numpy as np
from typing import Dict, List, Tuple
import matplotlib.pyplot as plt
import io
import base64

def generate_cross_section(voxel_model: Dict, line_points: List[Dict]) -> Dict:
    """
    Generates a 2D cross-section from a 3D voxel model along a line.
    Returns: {
        'image': base64 encoded PNG,
        'data': list of points with modifiers
    }
    """
    if not voxel_model or 'voxels' not in voxel_model:
        return {}

    voxels = voxel_model['voxels']
    origin = voxel_model['origin']
    resolution = voxel_model['resolution']
    extent = voxel_model['extent']

    # Convert line points to voxel coordinates
    x1, y1 = line_points[0]['x'], line_points[0]['y']
    x2, y2 = line_points[1]['x'], line_points[1]['y']

    # Convert to voxel indices
    x1_idx = int((x1 - origin[0]) / resolution)
    y1_idx = int((y1 - origin[1]) / resolution)
    x2_idx = int((x2 - origin[0]) / resolution)
    y2_idx = int((y2 - origin[1]) / resolution)

    # Calculate line direction
    dx = x2_idx - x1_idx
    dy = y2_idx - y1_idx
    length = np.sqrt(dx**2 + dy**2)
    if length == 0:
        return {}

    # Normalize direction
    dx /= length
    dy /= length

    # Sample along the line
    num_samples = int(length * 2)  # 2 samples per voxel
    cross_section_data = []

    for i in range(num_samples + 1):
        # Interpolate position
        x_idx = x1_idx + i * dx * length / num_samples
        y_idx = y1_idx + i * dy * length / num_samples

        # Round to nearest voxel
        x_idx = int(round(x_idx))
        y_idx = int(round(y_idx))

        # Ensure within bounds
        x_idx = max(0, min(x_idx, len(voxels) - 1))
        y_idx = max(0, min(y_idx, len(voxels[0]) - 1))

        # Sample all z-values at this (x,y)
        for k in range(len(voxels[0][0])):
            voxel = voxels[x_idx][y_idx][k]
            if voxel and isinstance(voxel, dict):
                z = origin[2] + k * resolution
                cross_section_data.append({
                    'distance': i * length / num_samples,
                    'depth': -z,  # Positive depth
                    'modifiers': voxel.get('modifiers', []),
                    'hydro_property': voxel.get('hydro_property', 'Unknown')
                })

    # Sort by depth
    cross_section_data.sort(key=lambda x: x['depth'])

    # Generate matplotlib figure
    plt.figure(figsize=(10, 5))
    for idx, point in enumerate(cross_section_data):
        depth = point['depth']
        modifiers = ", ".join(point['modifiers']) if point['modifiers'] else "None"
        hydro = point['hydro_property']

        # Assign color based on hydro property
        if "Aquifer" in hydro:
            color = 'blue' if "High" in hydro else 'lightblue'
        else:
            color = 'gray'

        plt.scatter(point['distance'], depth, color=color, s=10)

        # Add text label every 10 points to avoid clutter
        if idx % 10 == 0:
            plt.text(point['distance'], depth, f"{modifiers}\n{hydro}",
                     fontsize=8, ha='center', va='center')

    plt.xlabel('Distance along line (m)')
    plt.ylabel('Depth (m)')
    plt.title('Cross-Section')
    plt.gca().invert_yaxis()  # Depth increases downward

    # Save to base64
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
    buf.seek(0)
    image_base64 = base64.b64encode(buf.read()).decode('utf-8')
    plt.close()

    return {
        'image': image_base64,
        'data': cross_section_data
    }
