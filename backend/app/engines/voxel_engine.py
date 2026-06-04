import numpy as np
from typing import List, Dict, Tuple
from scipy.interpolate import griddata

def create_voxel_model(wells: List[Dict], resolution: float = 10.0) -> Dict:
    """
    Creates a 3D voxel model from well data.
    Returns: {
        'voxels': 3D numpy array,
        'resolution': float,
        'origin': (x_min, y_min, z_min),
        'extent': (x_max, y_max, z_max)
    }
    """
    if not wells:
        return {}

    # Collect all coordinates and depths
    all_x = []
    all_y = []
    all_z = []
    all_layers = []

    for well in wells:
        x = well['Coordinates']['X']
        y = well['Coordinates']['Y']
        elevation = well['Coordinates']['Elevation']

        for layer in well['Layers']:
            z_start = elevation - layer['Depth_Start']
            z_end = elevation - layer['Depth_End']

            all_x.extend([x, x])
            all_y.extend([y, y])
            all_z.extend([z_start, z_end])
            all_layers.append({
                'x': x,
                'y': y,
                'z_start': z_start,
                'z_end': z_end,
                'modifiers': layer['Modifiers'],
                'hydro_property': layer['Hydro_Property']
            })

    if not all_layers:
        return {}

    # Create grid
    x_min, x_max = min(all_x), max(all_x)
    y_min, y_max = min(all_y), max(all_y)
    z_min, z_max = min(all_z), max(all_z)

    x_grid = np.arange(x_min, x_max, resolution)
    y_grid = np.arange(y_min, y_max, resolution)
    z_grid = np.arange(z_min, z_max, resolution)

    # Initialize voxel grid (store modifiers as strings)
    voxels = np.empty((len(x_grid), len(y_grid), len(z_grid)), dtype=object)

    # Populate voxels from well layers
    for layer in all_layers:
        x_idx = np.argmin(np.abs(x_grid - layer['x']))
        y_idx = np.argmin(np.abs(y_grid - layer['y']))
        z_start_idx = np.argmin(np.abs(z_grid - layer['z_start']))
        z_end_idx = np.argmin(np.abs(z_grid - layer['z_end']))

        # Ensure indices are within bounds
        x_idx = max(0, min(x_idx, len(x_grid)-1))
        y_idx = max(0, min(y_idx, len(y_grid)-1))
        z_start_idx = max(0, min(z_start_idx, len(z_grid)-1))
        z_end_idx = max(0, min(z_end_idx, len(z_grid)-1))

        # Fill voxels in this layer
        for z_idx in range(z_start_idx, z_end_idx + 1):
            if 0 <= x_idx < len(x_grid) and 0 <= y_idx < len(y_grid) and 0 <= z_idx < len(z_grid):
                voxels[x_idx, y_idx, z_idx] = {
                    'modifiers': layer['modifiers'],
                    'hydro_property': layer['hydro_property'],
                    'layer_number': None  # Will be assigned later
                }

    # Interpolate gaps (simple nearest neighbor for now)
    filled_voxels = np.copy(voxels)
    for i in range(len(x_grid)):
        for j in range(len(y_grid)):
            for k in range(len(z_grid)):
                if filled_voxels[i, j, k] is None or filled_voxels[i, j, k] == '':
                    # Find nearest non-empty voxel
                    for di in [-1, 0, 1]:
                        for dj in [-1, 0, 1]:
                            for dk in [-1, 0, 1]:
                                ni, nj, nk = i + di, j + dj, k + dk
                                if (0 <= ni < len(x_grid) and
                                    0 <= nj < len(y_grid) and
                                    0 <= nk < len(z_grid) and
                                    filled_voxels[ni, nj, nk] is not None and
                                    filled_voxels[ni, nj, nk] != ''):
                                    filled_voxels[i, j, k] = filled_voxels[ni, nj, nk]
                                    break
                            else:
                                continue
                            break
                        else:
                            continue
                        break

    return {
        'voxels': filled_voxels.tolist(),
        'resolution': resolution,
        'origin': (float(x_min), float(y_min), float(z_min)),
        'extent': (float(x_max), float(y_max), float(z_max)),
        'grid_sizes': (len(x_grid), len(y_grid), len(z_grid))
    }

def extract_layers(voxel_model: Dict) -> List[Dict]:
    """
    Extracts individual layers from the voxel model.
    Each layer is a separate entity with its modifiers.
    """
    if not voxel_model or 'voxels' not in voxel_model:
        return []

    voxels = voxel_model['voxels']
    layers = []

    # Group voxels by unique modifier/hydro_property combinations
    unique_combinations = set()
    for i in range(len(voxels)):
        for j in range(len(voxels[i])):
            for k in range(len(voxels[i][j])):
                voxel = voxels[i][j][k]
                if voxel and isinstance(voxel, dict):
                    key = (tuple(sorted(voxel.get('modifiers', []))), voxel.get('hydro_property', ''))
                    unique_combinations.add(key)

    # Create a layer for each unique combination
    for idx, (modifiers, hydro_property) in enumerate(sorted(unique_combinations), 1):
        layers.append({
            'Layer_Number': idx,
            'Modifiers': list(modifiers),
            'Hydro_Property': hydro_property,
            'Voxel_Count': 0  # Will be counted later
        })

    return layers
