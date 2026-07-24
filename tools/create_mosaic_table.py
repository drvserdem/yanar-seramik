"""Generate realistic GLB + USDZ AR models for Yanar Seramik's mosaic table.

The model is built at the product's real dimensions (81 x 49 x 38 cm), uses
rounded structural geometry and PBR tile/grout textures.  The GLB is used by
<model-viewer>; the USDZ package is used as a direct Apple Quick Look fallback.
"""

from __future__ import annotations

import binascii
import io
import math
import struct
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Sequence, Tuple

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import distance_transform_edt, gaussian_filter
import trimesh
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals

ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / "models"
TEXTURE_DIR = MODEL_DIR / "textures"
MODEL_DIR.mkdir(parents=True, exist_ok=True)
TEXTURE_DIR.mkdir(parents=True, exist_ok=True)

# Catalogue dimensions in metres. Y is up.
W, D, H = 0.81, 0.49, 0.38
TOP_T = 0.090
BOTTOM_T = 0.068
SIDE_T = 0.080
OPEN_H = H - TOP_T - BOTTOM_T
SURFACE_EPS = 0.0008
TILE_PITCH = 0.0470

VERSION = "20260724-pbr2"


@dataclass
class TextureSet:
    key: str
    base: Image.Image
    normal: Image.Image
    mr: Image.Image
    base_path: Path
    normal_path: Path
    mr_path: Path


@dataclass
class SceneMesh:
    name: str
    mesh: trimesh.Trimesh
    material_key: str


def pbr_constant(name: str, rgba: Sequence[int], roughness: float = 0.72) -> PBRMaterial:
    return PBRMaterial(
        name=name,
        baseColorFactor=np.asarray(rgba, dtype=np.uint8),
        metallicFactor=0.0,
        roughnessFactor=float(roughness),
        doubleSided=True,
    )


def rounded_rect_boundary(width: float, depth: float, radius: float, segments: int = 5) -> np.ndarray:
    """Return a counter-clockwise rounded rectangle in X/Z."""
    radius = max(0.0, min(radius, width / 2, depth / 2))
    cx = width / 2 - radius
    cz = depth / 2 - radius
    corners = [
        (cx, cz, 0.0, math.pi / 2),
        (-cx, cz, math.pi / 2, math.pi),
        (-cx, -cz, math.pi, 3 * math.pi / 2),
        (cx, -cz, 3 * math.pi / 2, 2 * math.pi),
    ]
    pts: List[Tuple[float, float]] = []
    for x0, z0, a0, a1 in corners:
        for angle in np.linspace(a0, a1, segments, endpoint=False):
            pts.append((x0 + radius * math.cos(angle), z0 + radius * math.sin(angle)))
    return np.asarray(pts, dtype=float)


def rounded_prism(width: float, depth: float, height: float, radius: float, center: Sequence[float]) -> trimesh.Trimesh:
    """Create a rounded rectangular prism with flat caps and smooth side normals."""
    ring = rounded_rect_boundary(width, depth, radius)
    n = len(ring)
    y0, y1 = -height / 2, height / 2
    verts = np.vstack([
        np.column_stack([ring[:, 0], np.full(n, y0), ring[:, 1]]),
        np.column_stack([ring[:, 0], np.full(n, y1), ring[:, 1]]),
        [[0.0, y0, 0.0], [0.0, y1, 0.0]],
    ])
    bottom_center, top_center = 2 * n, 2 * n + 1
    faces: List[List[int]] = []
    for i in range(n):
        j = (i + 1) % n
        faces.append([i, j, n + j])
        faces.append([i, n + j, n + i])
        faces.append([bottom_center, j, i])
        faces.append([top_center, n + i, n + j])
    mesh = trimesh.Trimesh(vertices=verts, faces=np.asarray(faces), process=True)
    mesh.apply_translation(np.asarray(center, dtype=float))
    return mesh


def grid_count(length: float) -> int:
    return max(1, int(round(length / TILE_PITCH)))


def _tile_texture(
    key: str,
    cols: int,
    rows: int,
    palette: Sequence[Tuple[int, int, int]],
    grout_rgb: Tuple[int, int, int],
    seed: int,
) -> TextureSet:
    """Generate a baked glazed-mosaic PBR texture with recessed grout."""
    tile_px = 44
    gap_px = 4
    width = cols * tile_px + (cols + 1) * gap_px
    height = rows * tile_px + (rows + 1) * gap_px
    # keep mobile-friendly while preserving individual tile detail
    max_side = 1280
    scale = min(1.0, max_side / max(width, height))
    if scale < 1:
        tile_px = max(22, int(tile_px * scale))
        gap_px = max(2, int(gap_px * scale))
        width = cols * tile_px + (cols + 1) * gap_px
        height = rows * tile_px + (rows + 1) * gap_px

    rng = np.random.default_rng(seed)
    grout = np.empty((height, width, 3), dtype=np.float32)
    grout[:] = grout_rgb
    grout_noise = gaussian_filter(rng.normal(0, 1, (height, width)), sigma=max(2, gap_px * 1.2))
    grout += grout_noise[..., None] * 3.2
    grout = np.clip(grout, 0, 255)

    base = grout.copy()
    mask = np.zeros((height, width), dtype=np.uint8)
    roughness = np.full((height, width), 190, dtype=np.float32)
    height_map = np.zeros((height, width), dtype=np.float32)

    for row in range(rows):
        for col in range(cols):
            # Tiny hand-made irregularities: each mosaic is not perfectly identical.
            dx = int(rng.integers(-1, 2))
            dy = int(rng.integers(-1, 2))
            x0 = gap_px + col * (tile_px + gap_px) + dx
            y0 = gap_px + row * (tile_px + gap_px) + dy
            x1 = x0 + tile_px + int(rng.integers(-1, 2))
            y1 = y0 + tile_px + int(rng.integers(-1, 2))
            x0, y0 = max(0, x0), max(0, y0)
            x1, y1 = min(width, x1), min(height, y1)
            if x1 - x0 < 5 or y1 - y0 < 5:
                continue

            tile_mask_img = Image.new("L", (x1 - x0, y1 - y0), 0)
            draw = ImageDraw.Draw(tile_mask_img)
            radius = max(2, int(tile_px * 0.10 + rng.uniform(-1, 1)))
            draw.rounded_rectangle((0, 0, x1 - x0 - 1, y1 - y0 - 1), radius=radius, fill=255)
            tile_mask = np.asarray(tile_mask_img, dtype=np.float32) / 255.0

            color = np.asarray(palette[int(rng.integers(0, len(palette)))], dtype=np.float32)
            color *= rng.uniform(0.93, 1.07)
            h, w = tile_mask.shape
            low = rng.normal(0, 1, (max(2, h // 8), max(2, w // 8)))
            low_img = Image.fromarray(np.uint8(np.clip((low - low.min()) / (np.ptp(low) + 1e-6) * 255, 0, 255)))
            low_img = low_img.resize((w, h), Image.Resampling.BICUBIC).filter(ImageFilter.GaussianBlur(max(1, tile_px / 14)))
            glaze = np.asarray(low_img, dtype=np.float32) / 255.0
            yy, xx = np.mgrid[0:h, 0:w]
            diagonal = (xx / max(w - 1, 1) * 0.7 + yy / max(h - 1, 1) * 0.3)
            # broad glaze variation and a restrained window-like highlight
            value = 0.90 + 0.12 * glaze + 0.035 * diagonal
            highlight = np.exp(-(((xx - w * rng.uniform(0.22, 0.46)) / max(w * 0.18, 1)) ** 2 +
                                 ((yy - h * rng.uniform(0.10, 0.35)) / max(h * 0.13, 1)) ** 2))
            tile_rgb = color[None, None, :] * value[..., None] + highlight[..., None] * rng.uniform(8, 18)
            # mild edge darkening gives each glazed tile a slightly rounded appearance
            dist = distance_transform_edt(tile_mask > 0.5)
            bevel = np.clip(dist / max(2.5, tile_px * 0.12), 0, 1)
            tile_rgb *= (0.92 + 0.08 * bevel[..., None])
            tile_rgb = np.clip(tile_rgb, 0, 255)

            region = base[y0:y1, x0:x1]
            alpha = tile_mask[..., None]
            base[y0:y1, x0:x1] = region * (1 - alpha) + tile_rgb * alpha
            mask[y0:y1, x0:x1] = np.maximum(mask[y0:y1, x0:x1], np.uint8(tile_mask * 255))
            # small height undulations make reflections less computer-perfect
            waviness = gaussian_filter(rng.normal(0, 1, (h, w)), sigma=max(2, tile_px / 8))
            waviness = waviness / (np.max(np.abs(waviness)) + 1e-6)
            tile_height = (0.84 + 0.12 * bevel + 0.025 * waviness) * tile_mask
            height_map[y0:y1, x0:x1] = np.maximum(height_map[y0:y1, x0:x1], tile_height)
            tile_rough = rng.uniform(37, 58) + (1 - bevel) * 22 + np.abs(waviness) * 5
            rregion = roughness[y0:y1, x0:x1]
            roughness[y0:y1, x0:x1] = rregion * (1 - tile_mask) + tile_rough * tile_mask

    # Fine surface noise and normal map. The grout stays recessed.
    height_map = gaussian_filter(height_map, sigma=0.55)
    gy, gx = np.gradient(height_map)
    strength = 4.8
    nx, ny, nz = -gx * strength, np.ones_like(gx), -gy * strength
    norm = np.sqrt(nx * nx + ny * ny + nz * nz) + 1e-8
    normal = np.dstack([
        (nx / norm * 0.5 + 0.5) * 255,
        (nz / norm * 0.5 + 0.5) * 255,
        (ny / norm * 0.5 + 0.5) * 255,
    ])
    mr = np.zeros((height, width, 3), dtype=np.uint8)
    mr[..., 1] = np.uint8(np.clip(roughness, 0, 255))
    mr[..., 2] = 0  # non-metallic ceramic and grout

    base_img = Image.fromarray(np.uint8(np.clip(base, 0, 255)), "RGB")
    normal_img = Image.fromarray(np.uint8(np.clip(normal, 0, 255)), "RGB")
    mr_img = Image.fromarray(mr, "RGB")

    safe = key.replace("/", "-")
    base_path = TEXTURE_DIR / f"{safe}-base.png"
    normal_path = TEXTURE_DIR / f"{safe}-normal.png"
    mr_path = TEXTURE_DIR / f"{safe}-mr.png"
    base_img.save(base_path, optimize=True)
    normal_img.save(normal_path, optimize=True)
    mr_img.save(mr_path, optimize=True)
    return TextureSet(key, base_img, normal_img, mr_img, base_path, normal_path, mr_path)


def texture_material(name: str, textures: TextureSet) -> PBRMaterial:
    return PBRMaterial(
        name=name,
        baseColorFactor=np.array([255, 255, 255, 255], dtype=np.uint8),
        baseColorTexture=textures.base,
        normalTexture=textures.normal,
        metallicRoughnessTexture=textures.mr,
        metallicFactor=0.0,
        roughnessFactor=1.0,
        doubleSided=True,
    )


def plane_mesh(
    axis: str,
    position: float,
    u0: float,
    u1: float,
    v0: float,
    v1: float,
    positive_normal: bool,
    material: PBRMaterial,
) -> trimesh.Trimesh:
    if axis == "y":
        vertices = np.array([[u0, position, v0], [u1, position, v0], [u1, position, v1], [u0, position, v1]], float)
    elif axis == "z":
        vertices = np.array([[u0, v0, position], [u1, v0, position], [u1, v1, position], [u0, v1, position]], float)
    elif axis == "x":
        vertices = np.array([[position, v0, u0], [position, v0, u1], [position, v1, u1], [position, v1, u0]], float)
    else:
        raise ValueError(axis)
    faces = np.array([[0, 1, 2], [0, 2, 3]], dtype=np.int64)
    mesh = trimesh.Trimesh(vertices=vertices, faces=faces, process=False)
    # Determine generated normal and reverse if needed.
    generated = mesh.face_normals[0]
    wanted_axis = {"x": 0, "y": 1, "z": 2}[axis]
    if (generated[wanted_axis] > 0) != positive_normal:
        mesh.faces = mesh.faces[:, ::-1]
    uv = np.array([[0, 0], [1, 0], [1, 1], [0, 1]], dtype=float)
    mesh.visual = TextureVisuals(uv=uv, material=material)
    return mesh


def add_surface(
    scene: trimesh.Scene,
    records: List[SceneMesh],
    cache: Dict[Tuple[int, int], Tuple[TextureSet, PBRMaterial]],
    color_name: str,
    palette: Sequence[Tuple[int, int, int]],
    grout_rgb: Tuple[int, int, int],
    name: str,
    axis: str,
    position: float,
    u0: float,
    u1: float,
    v0: float,
    v1: float,
    positive_normal: bool,
    seed: int,
) -> None:
    cols, rows = grid_count(abs(u1 - u0)), grid_count(abs(v1 - v0))
    cache_key = (cols, rows)
    if cache_key not in cache:
        tex_key = f"{color_name.lower()}-{cols}x{rows}"
        tex = _tile_texture(tex_key, cols, rows, palette, grout_rgb, seed + cols * 13 + rows * 17)
        cache[cache_key] = (tex, texture_material(f"{color_name} mosaic {cols}x{rows}", tex))
    tex, material = cache[cache_key]
    mesh = plane_mesh(axis, position, u0, u1, v0, v1, positive_normal, material)
    scene.add_geometry(mesh, geom_name=name, node_name=name)
    records.append(SceneMesh(name, mesh, tex.key))


def build_scene(color_name: str, palette: Sequence[Tuple[int, int, int]], seed: int) -> Tuple[trimesh.Scene, List[SceneMesh], Dict[str, TextureSet]]:
    scene = trimesh.Scene()
    records: List[SceneMesh] = []
    cache: Dict[Tuple[int, int], Tuple[TextureSet, PBRMaterial]] = {}
    grout_rgb = (235, 232, 219)
    grout_material = pbr_constant("Warm mineral grout", [235, 232, 219, 255], 0.73)
    wood_material = pbr_constant("Wooden inner skeleton", [122, 83, 49, 255], 0.82)

    # Grout-backed, slightly rounded structure. The PBR surface planes below carry
    # the photorealistic glaze and recessed grout detail.
    body_parts = [
        ("Top slab", rounded_prism(W - 0.0015, D - 0.0015, TOP_T, 0.014, (0, H - TOP_T / 2, 0))),
        ("Bottom shelf", rounded_prism(W - 0.0015, D - 0.0015, BOTTOM_T, 0.011, (0, BOTTOM_T / 2, 0))),
        ("Left support", rounded_prism(SIDE_T, D - 0.0015, OPEN_H, 0.009, (-W / 2 + SIDE_T / 2, BOTTOM_T + OPEN_H / 2, 0))),
        ("Right support", rounded_prism(SIDE_T, D - 0.0015, OPEN_H, 0.009, (W / 2 - SIDE_T / 2, BOTTOM_T + OPEN_H / 2, 0))),
    ]
    for name, mesh in body_parts:
        mesh.visual.material = grout_material
        scene.add_geometry(mesh, geom_name=name, node_name=name)
        records.append(SceneMesh(name, mesh, "__grout__"))

    # A subtly inset wooden core is visible only through very small edge gaps.
    core = rounded_prism(W - 0.020, D - 0.020, TOP_T - 0.020, 0.008, (0, H - TOP_T / 2, 0))
    core.visual.material = wood_material
    scene.add_geometry(core, geom_name="Wood core", node_name="Wood core")
    records.append(SceneMesh("Wood core", core, "__wood__"))

    def surf(name, axis, pos, u0, u1, v0, v1, positive, n):
        add_surface(scene, records, cache, color_name, palette, grout_rgb, name, axis, pos, u0, u1, v0, v1, positive, seed + n * 101)

    # Main horizontal faces
    surf("Top surface", "y", H + SURFACE_EPS, -W / 2, W / 2, -D / 2, D / 2, True, 1)
    surf("Shelf surface", "y", BOTTOM_T + SURFACE_EPS, -W / 2 + SIDE_T, W / 2 - SIDE_T, -D / 2, D / 2, True, 2)
    surf("Inner ceiling", "y", H - TOP_T - SURFACE_EPS, -W / 2 + SIDE_T, W / 2 - SIDE_T, -D / 2, D / 2, False, 3)
    surf("Bottom underside", "y", -SURFACE_EPS, -W / 2, W / 2, -D / 2, D / 2, False, 4)

    # Front and back slab bands / support columns
    for z, positive, base_n in [(-D / 2 - SURFACE_EPS, False, 10), (D / 2 + SURFACE_EPS, True, 20)]:
        surf(f"{'Front' if z < 0 else 'Back'} top band", "z", z, -W / 2, W / 2, H - TOP_T, H, positive, base_n)
        surf(f"{'Front' if z < 0 else 'Back'} bottom band", "z", z, -W / 2, W / 2, 0, BOTTOM_T, positive, base_n + 1)
        surf(f"{'Front' if z < 0 else 'Back'} left column", "z", z, -W / 2, -W / 2 + SIDE_T, BOTTOM_T, H - TOP_T, positive, base_n + 2)
        surf(f"{'Front' if z < 0 else 'Back'} right column", "z", z, W / 2 - SIDE_T, W / 2, BOTTOM_T, H - TOP_T, positive, base_n + 3)

    # Outer and inner side faces
    surf("Outer left", "x", -W / 2 - SURFACE_EPS, -D / 2, D / 2, 0, H, False, 30)
    surf("Outer right", "x", W / 2 + SURFACE_EPS, -D / 2, D / 2, 0, H, True, 31)
    surf("Inner left", "x", -W / 2 + SIDE_T + SURFACE_EPS, -D / 2, D / 2, BOTTOM_T, H - TOP_T, True, 32)
    surf("Inner right", "x", W / 2 - SIDE_T - SURFACE_EPS, -D / 2, D / 2, BOTTOM_T, H - TOP_T, False, 33)

    texture_map = {tex.key: tex for tex, _ in cache.values()}
    return scene, records, texture_map


def export_glb(scene: trimesh.Scene, path: Path) -> None:
    data = scene.export(file_type="glb")
    path.write_bytes(data)
    # Validate loadability and catalogue dimensions.
    loaded = trimesh.load(path, force="scene")
    extents = loaded.bounds[1] - loaded.bounds[0]
    expected = np.array([W, H, D])
    if not np.allclose(extents, expected, atol=0.004):
        raise RuntimeError(f"Unexpected exported dimensions {extents}, expected approximately {expected}")


def usd_vec(values: Iterable[float], digits: int = 6) -> str:
    return "(" + ", ".join(f"{float(v):.{digits}f}" for v in values) + ")"


def usd_array(items: Sequence[str], indent: str = "            ", per_line: int = 6) -> str:
    if not items:
        return "[]"
    lines = []
    for i in range(0, len(items), per_line):
        lines.append(indent + ", ".join(items[i:i + per_line]))
    return "[\n" + ",\n".join(lines) + "\n        ]"


def safe_usd_name(name: str) -> str:
    cleaned = "".join(ch if ch.isalnum() else "_" for ch in name)
    if cleaned and cleaned[0].isdigit():
        cleaned = "M_" + cleaned
    return cleaned or "Mesh"


def write_usda(
    path: Path,
    color_name: str,
    records: Sequence[SceneMesh],
    textures: Dict[str, TextureSet],
) -> Dict[str, bytes]:
    material_names: Dict[str, str] = {"__grout__": "Grout", "__wood__": "Wood"}
    for key in textures:
        material_names[key] = safe_usd_name("Mat_" + key)

    lines = [
        "#usda 1.0",
        "(",
        '    defaultPrim = "Table"',
        "    metersPerUnit = 1",
        '    upAxis = "Y"',
        ")",
        "",
        'def Xform "Table" (',
        '    kind = "component"',
        ")",
        "{",
        '    def Scope "Materials"',
        "    {",
    ]

    def constant_material(mat_name: str, diffuse: Tuple[float, float, float], roughness: float) -> None:
        lines.extend([
            f'        def Material "{mat_name}"',
            "        {",
            f'            token outputs:surface.connect = </Table/Materials/{mat_name}/Preview.outputs:surface>',
            f'            def Shader "Preview"',
            "            {",
            '                uniform token info:id = "UsdPreviewSurface"',
            f'                color3f inputs:diffuseColor = {usd_vec(diffuse)}',
            '                float inputs:metallic = 0',
            f'                float inputs:roughness = {roughness:.4f}',
            '                token outputs:surface',
            "            }",
            "        }",
        ])

    constant_material("Grout", (0.83, 0.81, 0.75), 0.72)
    constant_material("Wood", (0.34, 0.20, 0.10), 0.82)

    assets: Dict[str, bytes] = {}
    for key, tex in textures.items():
        mat_name = material_names[key]
        base_name = f"textures/{tex.base_path.name}"
        normal_name = f"textures/{tex.normal_path.name}"
        mr_name = f"textures/{tex.mr_path.name}"
        assets[base_name] = tex.base_path.read_bytes()
        assets[normal_name] = tex.normal_path.read_bytes()
        assets[mr_name] = tex.mr_path.read_bytes()
        lines.extend([
            f'        def Material "{mat_name}"',
            "        {",
            f'            token outputs:surface.connect = </Table/Materials/{mat_name}/Preview.outputs:surface>',
            '            def Shader "Preview"',
            "            {",
            '                uniform token info:id = "UsdPreviewSurface"',
            f'                color3f inputs:diffuseColor.connect = </Table/Materials/{mat_name}/BaseColor.outputs:rgb>',
            '                float inputs:metallic = 0',
            f'                float inputs:roughness.connect = </Table/Materials/{mat_name}/MetalRough.outputs:g>',
            f'                normal3f inputs:normal.connect = </Table/Materials/{mat_name}/Normal.outputs:rgb>',
            '                token outputs:surface',
            "            }",
            '            def Shader "Primvar"',
            "            {",
            '                uniform token info:id = "UsdPrimvarReader_float2"',
            '                token inputs:varname = "st"',
            '                float2 outputs:result',
            "            }",
            '            def Shader "BaseColor"',
            "            {",
            '                uniform token info:id = "UsdUVTexture"',
            f'                asset inputs:file = @{base_name}@',
            '                token inputs:sourceColorSpace = "sRGB"',
            f'                float2 inputs:st.connect = </Table/Materials/{mat_name}/Primvar.outputs:result>',
            '                float3 outputs:rgb',
            "            }",
            '            def Shader "MetalRough"',
            "            {",
            '                uniform token info:id = "UsdUVTexture"',
            f'                asset inputs:file = @{mr_name}@',
            '                token inputs:sourceColorSpace = "raw"',
            f'                float2 inputs:st.connect = </Table/Materials/{mat_name}/Primvar.outputs:result>',
            '                float outputs:g',
            "            }",
            '            def Shader "Normal"',
            "            {",
            '                uniform token info:id = "UsdUVTexture"',
            f'                asset inputs:file = @{normal_name}@',
            '                token inputs:sourceColorSpace = "raw"',
            '                float4 inputs:scale = (2, 2, 2, 2)',
            '                float4 inputs:bias = (-1, -1, -1, -1)',
            f'                float2 inputs:st.connect = </Table/Materials/{mat_name}/Primvar.outputs:result>',
            '                float3 outputs:rgb',
            "            }",
            "        }",
        ])

    lines.extend(["    }", ""])

    for index, record in enumerate(records):
        mesh = record.mesh.copy()
        name = safe_usd_name(f"{index:02d}_{record.name}")
        points = [usd_vec(v) for v in mesh.vertices]
        counts = [str(len(face)) for face in mesh.faces]
        indices = [str(int(i)) for face in mesh.faces for i in face]
        normals = [usd_vec(n) for n in mesh.vertex_normals]
        mat_name = material_names[record.material_key]
        lines.extend([
            f'    def Mesh "{name}"',
            "    {",
            f'        int[] faceVertexCounts = {usd_array(counts, per_line=18)}',
            f'        int[] faceVertexIndices = {usd_array(indices, per_line=18)}',
            f'        point3f[] points = {usd_array(points, per_line=4)}',
            f'        normal3f[] normals = {usd_array(normals, per_line=4)} (',
            '            interpolation = "vertex"',
            '        )',
            '        uniform token subdivisionScheme = "none"',
            f'        rel material:binding = </Table/Materials/{mat_name}>',
        ])
        if isinstance(mesh.visual, TextureVisuals) and mesh.visual.uv is not None:
            uv = [usd_vec(x, 6) for x in mesh.visual.uv]
            lines.extend([
                f'        texCoord2f[] primvars:st = {usd_array(uv, per_line=6)} (',
                '            interpolation = "vertex"',
                '        )',
            ])
        lines.extend(["    }", ""])

    lines.extend(["}", ""])
    text = "\n".join(lines)
    path.write_text(text, encoding="utf-8")
    assets[path.name] = text.encode("utf-8")
    return assets


def dos_datetime() -> Tuple[int, int]:
    # Fixed reproducible timestamp: 2026-07-24 12:00
    year, month, day, hour, minute, second = 2026, 7, 24, 12, 0, 0
    dostime = (hour << 11) | (minute << 5) | (second // 2)
    dosdate = ((year - 1980) << 9) | (month << 5) | day
    return dostime, dosdate


def write_aligned_usdz(path: Path, files: Sequence[Tuple[str, bytes]]) -> None:
    """Write a zero-compression, 64-byte aligned USDZ package."""
    dostime, dosdate = dos_datetime()
    entries = []
    with path.open("wb") as out:
        for name, data in files:
            name_bytes = name.encode("utf-8")
            local_offset = out.tell()
            base = local_offset + 30 + len(name_bytes)
            pad = (-base) % 64
            if pad and pad < 4:
                pad += 64
            extra = b""
            if pad:
                extra = struct.pack("<HH", 0x1986, pad - 4) + b"\0" * (pad - 4)
            crc = binascii.crc32(data) & 0xFFFFFFFF
            header = struct.pack(
                "<IHHHHHIIIHH",
                0x04034B50, 20, 0, 0, dostime, dosdate,
                crc, len(data), len(data), len(name_bytes), len(extra),
            )
            out.write(header)
            out.write(name_bytes)
            out.write(extra)
            if out.tell() % 64 != 0:
                raise RuntimeError("USDZ alignment failure")
            out.write(data)
            entries.append((name_bytes, crc, len(data), local_offset))

        central_offset = out.tell()
        for name_bytes, crc, size, local_offset in entries:
            central = struct.pack(
                "<IHHHHHHIIIHHHHHII",
                0x02014B50, 20, 20, 0, 0, dostime, dosdate,
                crc, size, size, len(name_bytes), 0, 0, 0, 0, 0, local_offset,
            )
            out.write(central)
            out.write(name_bytes)
        central_size = out.tell() - central_offset
        out.write(struct.pack(
            "<IHHHHIIH", 0x06054B50, 0, 0, len(entries), len(entries),
            central_size, central_offset, 0,
        ))

    # Basic archive integrity check.
    with zipfile.ZipFile(path) as zf:
        bad = zf.testzip()
        if bad:
            raise RuntimeError(f"USDZ archive CRC failure: {bad}")


def build(color_name: str, palette: Sequence[Tuple[int, int, int]], seed: int) -> None:
    scene, records, textures = build_scene(color_name, palette, seed)
    base = f"mosaic-coffee-table-{color_name.lower()}"
    glb_path = MODEL_DIR / f"{base}.glb"
    export_glb(scene, glb_path)

    usda_path = MODEL_DIR / f"{base}.usda"
    assets = write_usda(usda_path, color_name, records, textures)
    # USDZ default layer must be the first entry.
    ordered: List[Tuple[str, bytes]] = [(usda_path.name, assets.pop(usda_path.name))]
    ordered.extend(sorted(assets.items(), key=lambda item: item[0]))
    usdz_path = MODEL_DIR / f"{base}.usdz"
    write_aligned_usdz(usdz_path, ordered)

    print(f"{glb_path.name}: {glb_path.stat().st_size / 1024 / 1024:.2f} MB")
    print(f"{usdz_path.name}: {usdz_path.stat().st_size / 1024 / 1024:.2f} MB")


if __name__ == "__main__":
    build("Yellow", [
        (236, 185, 5), (246, 200, 17), (218, 163, 0),
        (249, 211, 39), (228, 174, 0), (240, 190, 9),
    ], seed=2401)
    build("Green", [
        (31, 91, 47), (40, 111, 61), (25, 76, 39),
        (54, 126, 72), (35, 101, 52), (47, 116, 65),
    ], seed=2402)
