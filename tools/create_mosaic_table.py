import math
from pathlib import Path
import numpy as np
import trimesh
from trimesh.visual.material import PBRMaterial

OUT = Path('/mnt/data/yanar_v3/yanar-seramik/models')
OUT.mkdir(parents=True, exist_ok=True)

# Real-world dimensions in meters (Y-up)
W, D, H = 0.81, 0.49, 0.38
TOP_T = 0.095
BOTTOM_T = 0.075
SIDE_T = 0.085
OPEN_H = H - TOP_T - BOTTOM_T
TILE_THICK = 0.0048
GAP = 0.0032


def mat(name, rgba, roughness=0.25):
    return PBRMaterial(
        name=name,
        baseColorFactor=np.array(rgba, dtype=np.uint8),
        metallicFactor=0.0,
        roughnessFactor=float(roughness),
    )


def box(extents, center):
    m = trimesh.creation.box(extents=extents)
    m.apply_translation(center)
    return m


def add_grid(groups, face, pos, u_min, u_max, v_min, v_max, nu, nv, palette, seed_offset=0):
    """Create a grid of thin tile boxes on a plane.
    face: 'y' horizontal, 'z' front/back, 'x' left/right.
    u/v map to remaining two axes.
    """
    rng = np.random.default_rng(20260724 + seed_offset)
    u_span = u_max - u_min
    v_span = v_max - v_min
    tile_u = (u_span - GAP * (nu - 1)) / nu
    tile_v = (v_span - GAP * (nv - 1)) / nv
    if tile_u <= 0 or tile_v <= 0:
        return
    for i in range(nu):
        for j in range(nv):
            u = u_min + tile_u / 2 + i * (tile_u + GAP)
            v = v_min + tile_v / 2 + j * (tile_v + GAP)
            # deterministic subtle tonal variation
            idx = int(rng.choice(len(palette), p=[0.54,0.18,0.14,0.09,0.05]))
            if face == 'y':
                ext = [tile_u, TILE_THICK, tile_v]
                cen = [u, pos, v]
            elif face == 'z':
                ext = [tile_u, tile_v, TILE_THICK]
                cen = [u, v, pos]
            elif face == 'x':
                ext = [TILE_THICK, tile_v, tile_u]
                cen = [pos, v, u]
            else:
                raise ValueError(face)
            groups[idx].append(box(ext, cen))


def build(color_name, base_rgb, palette_rgbs):
    scene = trimesh.Scene()

    # Grout/base structure: slightly warm white, visible in the gaps.
    grout_material = mat('Warm white grout', [235, 232, 220, 255], roughness=0.72)
    wood_material = mat('Wood core', [135, 96, 60, 255], roughness=0.82)

    # Internal wooden skeleton, inset beneath grout layer so it is rarely visible.
    core_inset = 0.006
    pieces = [
        box([W-2*core_inset, TOP_T-2*core_inset, D-2*core_inset], [0, H-TOP_T/2, 0]),
        box([W-2*core_inset, BOTTOM_T-2*core_inset, D-2*core_inset], [0, BOTTOM_T/2, 0]),
        box([SIDE_T-2*core_inset, OPEN_H, D-2*core_inset], [-W/2+SIDE_T/2, BOTTOM_T+OPEN_H/2, 0]),
        box([SIDE_T-2*core_inset, OPEN_H, D-2*core_inset], [W/2-SIDE_T/2, BOTTOM_T+OPEN_H/2, 0]),
    ]
    wood = trimesh.util.concatenate(pieces)
    wood.visual.material = wood_material
    scene.add_geometry(wood, geom_name='wooden-skeleton', node_name='Wooden skeleton')

    # Grout-backed outer structure exactly at final dimensions.
    grout_pieces = [
        box([W, TOP_T, D], [0, H-TOP_T/2, 0]),
        box([W, BOTTOM_T, D], [0, BOTTOM_T/2, 0]),
        box([SIDE_T, OPEN_H, D], [-W/2+SIDE_T/2, BOTTOM_T+OPEN_H/2, 0]),
        box([SIDE_T, OPEN_H, D], [W/2-SIDE_T/2, BOTTOM_T+OPEN_H/2, 0]),
    ]
    grout = trimesh.util.concatenate(grout_pieces)
    grout.visual.material = grout_material
    scene.add_geometry(grout, geom_name='grout-body', node_name='Grout body')

    palette = [mat(f'{color_name} tile {i+1}', list(rgb)+[255], roughness=0.18 + i*0.025) for i, rgb in enumerate(palette_rgbs)]
    groups = [[] for _ in palette]

    # Top / underside / bottom surfaces
    add_grid(groups, 'y', H + TILE_THICK/2, -W/2, W/2, -D/2, D/2, 17, 10, palette, 1)
    add_grid(groups, 'y', -TILE_THICK/2, -W/2, W/2, -D/2, D/2, 17, 10, palette, 2)
    # Top of lower shelf and inner ceiling
    add_grid(groups, 'y', BOTTOM_T + TILE_THICK/2, -W/2+SIDE_T, W/2-SIDE_T, -D/2, D/2, 13, 10, palette, 3)
    add_grid(groups, 'y', H-TOP_T - TILE_THICK/2, -W/2+SIDE_T, W/2-SIDE_T, -D/2, D/2, 13, 10, palette, 4)

    # Outer left/right sides
    add_grid(groups, 'x', -W/2 - TILE_THICK/2, -D/2, D/2, 0, H, 10, 8, palette, 5)
    add_grid(groups, 'x', W/2 + TILE_THICK/2, -D/2, D/2, 0, H, 10, 8, palette, 6)

    # Inner left/right cavity walls
    add_grid(groups, 'x', -W/2 + SIDE_T + TILE_THICK/2, -D/2, D/2, BOTTOM_T, H-TOP_T, 10, 5, palette, 7)
    add_grid(groups, 'x', W/2 - SIDE_T - TILE_THICK/2, -D/2, D/2, BOTTOM_T, H-TOP_T, 10, 5, palette, 8)

    # Front ring: top, bottom, and side columns
    z_front = -D/2 - TILE_THICK/2
    z_back = D/2 + TILE_THICK/2
    for zpos, seed in [(z_front, 9), (z_back, 15)]:
        add_grid(groups, 'z', zpos, -W/2, W/2, H-TOP_T, H, 17, 2, palette, seed)
        add_grid(groups, 'z', zpos, -W/2, W/2, 0, BOTTOM_T, 17, 2, palette, seed+1)
        add_grid(groups, 'z', zpos, -W/2, -W/2+SIDE_T, BOTTOM_T, H-TOP_T, 2, 5, palette, seed+2)
        add_grid(groups, 'z', zpos, W/2-SIDE_T, W/2, BOTTOM_T, H-TOP_T, 2, 5, palette, seed+3)

    # Combine all tiles by material shade to keep GLB compact.
    for idx, meshes in enumerate(groups):
        if not meshes:
            continue
        combined = trimesh.util.concatenate(meshes)
        combined.visual.material = palette[idx]
        scene.add_geometry(combined, geom_name=f'{color_name.lower()}-tiles-{idx+1}', node_name=f'{color_name} mosaic tiles {idx+1}')

    # Normalize the final tiled object to the exact catalog dimensions.
    bounds = scene.bounds.copy()
    ext = bounds[1] - bounds[0]
    scale = np.eye(4)
    scale[0,0] = W / ext[0]
    scale[1,1] = H / ext[1]
    scale[2,2] = D / ext[2]
    scene.apply_transform(scale)
    normalized_bounds = scene.bounds.copy()
    translate = np.eye(4)
    translate[1,3] = -normalized_bounds[0,1]
    scene.apply_transform(translate)

    # Export as binary glTF
    out = OUT / f'mosaic-coffee-table-{color_name.lower()}.glb'
    out.write_bytes(scene.export(file_type='glb'))
    print(out, out.stat().st_size)


build('Yellow', (238,190,0), [
    (244,196,0), (235,178,0), (250,207,25), (226,165,0), (244,186,12)
])
build('Green', (35,113,63), [
    (41,119,66), (28,96,52), (53,128,76), (22,83,44), (63,137,84)
])
