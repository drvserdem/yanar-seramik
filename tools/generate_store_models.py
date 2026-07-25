from pathlib import Path
import math
import trimesh
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
MODELS = ROOT / 'models'
MODELS.mkdir(exist_ok=True)


def mat(name, rgba, roughness=0.42, metallic=0.0):
    return trimesh.visual.material.PBRMaterial(
        name=name,
        baseColorFactor=np.array(rgba, dtype=np.uint8),
        roughnessFactor=roughness,
        metallicFactor=metallic,
    )

WHITE = mat('warm-grout', [235, 232, 220, 255], roughness=0.75)
DARK_GROUT = mat('dark-grout', [73, 67, 66, 255], roughness=0.82)
YELLOW = mat('mustard-glaze', [225, 166, 26, 255], roughness=0.28)
GREEN = mat('green-glaze', [52, 116, 62, 255], roughness=0.32)
CREAM_TILE = mat('cream-glaze', [210, 203, 183, 255], roughness=0.34)
BLUE = mat('cobalt-glaze', [24, 50, 145, 255], roughness=0.26)
WOOD = mat('warm-wood-core', [188, 164, 126, 255], roughness=0.7)
CREAM = mat('drawer-interior', [237, 232, 216, 255], roughness=0.72)


def add_box(scene, name, extents, center, material):
    mesh = trimesh.creation.box(extents=extents)
    mesh.apply_translation(center)
    mesh.visual.material = material
    scene.add_geometry(mesh, node_name=name, geom_name=name)
    return mesh


def _grid_positions(length, spacing):
    count = max(1, int(math.floor(length / spacing)))
    start = -length / 2
    return [start + i * spacing for i in range(1, count + 1) if start + i * spacing < length / 2 - 1e-6]


def add_grout_grid(scene, prefix, extents, center, faces=('front', 'top', 'left', 'right'), spacing=0.055, thickness=0.0045, grout_mat=WHITE):
    """Add thin grout strips slightly above selected box faces. y is vertical, z is depth."""
    w, h, d = extents
    cx, cy, cz = center
    eps = 0.0015

    if 'front' in faces:
        z = cz + d / 2 + eps
        for i, x in enumerate(_grid_positions(w, spacing)):
            add_box(scene, f'{prefix}-front-v-{i}', (thickness, h, thickness), (cx + x, cy, z), grout_mat)
        for i, y in enumerate(_grid_positions(h, spacing)):
            add_box(scene, f'{prefix}-front-h-{i}', (w, thickness, thickness), (cx, cy + y, z), grout_mat)

    if 'back' in faces:
        z = cz - d / 2 - eps
        for i, x in enumerate(_grid_positions(w, spacing)):
            add_box(scene, f'{prefix}-back-v-{i}', (thickness, h, thickness), (cx + x, cy, z), grout_mat)
        for i, y in enumerate(_grid_positions(h, spacing)):
            add_box(scene, f'{prefix}-back-h-{i}', (w, thickness, thickness), (cx, cy + y, z), grout_mat)

    if 'top' in faces:
        y = cy + h / 2 + eps
        for i, x in enumerate(_grid_positions(w, spacing)):
            add_box(scene, f'{prefix}-top-x-{i}', (thickness, thickness, d), (cx + x, y, cz), grout_mat)
        for i, zoff in enumerate(_grid_positions(d, spacing)):
            add_box(scene, f'{prefix}-top-z-{i}', (w, thickness, thickness), (cx, y, cz + zoff), grout_mat)

    if 'left' in faces:
        x = cx - w / 2 - eps
        for i, zoff in enumerate(_grid_positions(d, spacing)):
            add_box(scene, f'{prefix}-left-z-{i}', (thickness, h, thickness), (x, cy, cz + zoff), grout_mat)
        for i, y in enumerate(_grid_positions(h, spacing)):
            add_box(scene, f'{prefix}-left-y-{i}', (thickness, thickness, d), (x, cy + y, cz), grout_mat)

    if 'right' in faces:
        x = cx + w / 2 + eps
        for i, zoff in enumerate(_grid_positions(d, spacing)):
            add_box(scene, f'{prefix}-right-z-{i}', (thickness, h, thickness), (x, cy, cz + zoff), grout_mat)
        for i, y in enumerate(_grid_positions(h, spacing)):
            add_box(scene, f'{prefix}-right-y-{i}', (thickness, thickness, d), (x, cy + y, cz), grout_mat)


def add_tiled_box(scene, prefix, extents, center, body_mat, spacing=0.055, grout_mat=WHITE, faces=('front', 'top', 'left', 'right')):
    add_box(scene, prefix, extents, center, body_mat)
    add_grout_grid(scene, prefix, extents, center, faces=faces, spacing=spacing, grout_mat=grout_mat)


def export(scene, filename):
    scene.metadata['unit'] = 'meters'
    path = MODELS / filename
    path.write_bytes(scene.export(file_type='glb'))
    loaded = trimesh.load(path)
    dims = loaded.bounds[1] - loaded.bounds[0]
    print(filename, np.round(dims, 4), f'{path.stat().st_size/1024:.1f} KB')


def tv_unit():
    scene = trimesh.Scene()
    w, d, h = 1.42, 0.42, 0.47
    # Main carcass, placed on the floor
    center = (0, h/2, 0)
    add_tiled_box(scene, 'tv-body', (w, h, d), center, YELLOW, spacing=0.075, grout_mat=WHITE, faces=('front','top','left','right'))
    # Two drawer fronts, subtly proud of the body
    gap = 0.016
    drawer_w = (w - gap*3) / 2
    drawer_h = h * 0.68
    z = d/2 + 0.009
    y = h*0.52
    for idx, x in enumerate((-drawer_w/2-gap/2, drawer_w/2+gap/2)):
        add_tiled_box(scene, f'tv-drawer-{idx}', (drawer_w, drawer_h, 0.022), (x, y, z), YELLOW, spacing=0.075, grout_mat=WHITE, faces=('front',))
    export(scene, 'store-tv-unit.glb')


def console():
    scene = trimesh.Scene()
    w, d, h = 0.81, 0.28, 0.91
    leg_t = 0.115
    top_t = 0.11
    shelf_t = 0.09
    shelf_y = 0.49
    # legs
    for side, x in [('left', -w/2+leg_t/2), ('right', w/2-leg_t/2)]:
        add_tiled_box(scene, f'console-{side}', (leg_t, h, d), (x, h/2, 0), GREEN, spacing=0.055, grout_mat=DARK_GROUT, faces=('front','top','left','right'))
    # top and shelf
    add_tiled_box(scene, 'console-top', (w, top_t, d), (0, h-top_t/2, 0), GREEN, spacing=0.055, grout_mat=DARK_GROUT, faces=('front','top','left','right'))
    add_tiled_box(scene, 'console-shelf', (w-2*leg_t, shelf_t, d), (0, shelf_y, 0), GREEN, spacing=0.055, grout_mat=DARK_GROUT, faces=('front','top'))
    export(scene, 'store-console-green.glb')



def console_cream():
    scene = trimesh.Scene()
    w, d, h = 0.81, 0.28, 0.91
    leg_t = 0.115
    top_t = 0.11
    shelf_t = 0.09
    shelf_y = 0.49
    for side, x in [('left', -w/2+leg_t/2), ('right', w/2-leg_t/2)]:
        add_tiled_box(scene, f'console-cream-{side}', (leg_t, h, d), (x, h/2, 0), CREAM_TILE, spacing=0.055, grout_mat=WHITE, faces=('front','top','left','right'))
    add_tiled_box(scene, 'console-cream-top', (w, top_t, d), (0, h-top_t/2, 0), CREAM_TILE, spacing=0.055, grout_mat=WHITE, faces=('front','top','left','right'))
    add_tiled_box(scene, 'console-cream-shelf', (w-2*leg_t, shelf_t, d), (0, shelf_y, 0), CREAM_TILE, spacing=0.055, grout_mat=WHITE, faces=('front','top'))
    export(scene, 'store-console-cream.glb')

def blue_table():
    scene = trimesh.Scene()
    w, d, h = 0.91, 0.91, 0.76
    top_t = 0.085
    pedestal_w, pedestal_d = 0.34, 0.34
    add_tiled_box(scene, 'table-pedestal', (pedestal_w, h-top_t, pedestal_d), (0, (h-top_t)/2, 0), BLUE, spacing=0.055, grout_mat=WHITE, faces=('front','back','left','right'))
    add_tiled_box(scene, 'table-top', (w, top_t, d), (0, h-top_t/2, 0), BLUE, spacing=0.055, grout_mat=WHITE, faces=('front','back','top','left','right'))
    export(scene, 'store-table-blue.glb')


def nightstand():
    scene = trimesh.Scene()
    w, d, h = 0.38, 0.38, 0.54
    add_tiled_box(scene, 'nightstand-body', (w, h, d), (0, h/2, 0), GREEN, spacing=0.035, grout_mat=WHITE, faces=('front','top','left','right'))
    # front drawer panels
    drawer_h = 0.215
    z = d/2 + 0.008
    for idx, y in enumerate((0.16, 0.39)):
        add_tiled_box(scene, f'nightstand-drawer-{idx}', (w*0.9, drawer_h, 0.018), (0, y, z), GREEN, spacing=0.035, grout_mat=WHITE, faces=('front',))
    export(scene, 'store-nightstand-green.glb')


if __name__ == '__main__':
    tv_unit()
    console()
    console_cream()
    blue_table()
    nightstand()
