from __future__ import annotations

from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
BASE = ROOT / 'store-assets'
ICON_DIR = BASE / 'icons'
PROMO_DIR = BASE / 'promo'
SHOT_DIR = BASE / 'screenshots'
SOURCE_PRODUCT_IMAGE = BASE / 'source' / 'sony-wh1000xm4.jpg'

MIDNIGHT = (9, 16, 31)
NAVY = (17, 44, 78)
STEEL = (81, 96, 120)
MIST = (226, 232, 240)
IVORY = (247, 249, 252)
WHITE = (255, 255, 255)
EMERALD = (34, 197, 94)
GOLD = (245, 158, 11)
CHAMPAGNE = (246, 196, 106)
AMAZON = (255, 153, 0)
AMAZON_DARK = (230, 126, 0)
INK = (15, 23, 42)
SKY = (14, 116, 144)
SLATE = (51, 65, 85)

FONT_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
FONT_REG = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'


def ensure_dirs() -> None:
    for directory in (BASE, ICON_DIR, PROMO_DIR, SHOT_DIR):
        directory.mkdir(parents=True, exist_ok=True)


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    path = FONT_BOLD if bold else FONT_REG
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


def vertical_gradient(size: tuple[int, int], top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    width, height = size
    image = Image.new('RGBA', size)
    draw = ImageDraw.Draw(image)
    for y in range(height):
        ratio = y / max(1, height - 1)
        color = tuple(int(top[i] + (bottom[i] - top[i]) * ratio) for i in range(3))
        draw.line([(0, y), (width, y)], fill=(*color, 255))
    return image


def add_glow(image: Image.Image) -> None:
    width, height = image.size
    overlay = Image.new('RGBA', image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    draw.ellipse((-0.22 * width, -0.30 * height, 0.40 * width, 0.42 * height), fill=(255, 255, 255, 28))
    draw.ellipse((0.58 * width, -0.12 * height, 1.15 * width, 0.58 * height), fill=(255, 200, 120, 18))
    draw.ellipse((0.12 * width, 0.62 * height, 0.86 * width, 1.20 * height), fill=(56, 189, 248, 14))
    overlay = overlay.filter(ImageFilter.GaussianBlur(max(3, width // 28)))
    image.alpha_composite(overlay)


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new('L', size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size[0], size[1]), radius=radius, fill=255)
    return mask


def crop_to_fill(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    target_width, target_height = size
    src_width, src_height = image.size
    scale = max(target_width / src_width, target_height / src_height)
    resized = image.resize((int(src_width * scale), int(src_height * scale)))
    left = max(0, (resized.width - target_width) // 2)
    top = max(0, (resized.height - target_height) // 2)
    return resized.crop((left, top, left + target_width, top + target_height))


def text_width(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont) -> float:
    left, _, right, _ = draw.textbbox((0, 0), text, font=font)
    return right - left


def text_height(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont) -> float:
    _, top, _, bottom = draw.textbbox((0, 0), text, font=font)
    return bottom - top


def fit_font(draw: ImageDraw.ImageDraw, text: str, max_width: int, start_size: int, min_size: int, bold: bool = False):
    for size in range(start_size, min_size - 1, -1):
        current = load_font(size, bold=bold)
        if text_width(draw, text, current) <= max_width:
            return current
    return load_font(min_size, bold=bold)


def wrap_text(draw: ImageDraw.ImageDraw, text: str, max_width: int, start_size: int, min_size: int, max_lines: int, bold: bool = False):
    words = text.split()
    for size in range(start_size, min_size - 1, -1):
        current = load_font(size, bold=bold)
        lines: list[str] = []
        line = ''
        for word in words:
            candidate = f'{line} {word}'.strip()
            if text_width(draw, candidate, current) <= max_width:
                line = candidate
            else:
                if line:
                    lines.append(line)
                line = word
        if line:
            lines.append(line)
        if len(lines) <= max_lines:
            return current, lines
    return load_font(min_size, bold=bold), [' '.join(words)]


def draw_logo(image: Image.Image) -> None:
    """Draw minimalist orange basket icon with checkmark"""
    width, height = image.size
    draw = ImageDraw.Draw(image)
    
    # Orange color
    orange = (255, 140, 0, 255)
    
    # Stroke width scaled to size
    stroke_width = max(1, int(width * 0.08))
    
    # Basket dimensions (centered, simple geometric shape)
    basket_left = width * 0.25
    basket_right = width * 0.65
    basket_top = height * 0.35
    basket_bottom = height * 0.65
    
    # Draw basket body (simple rectangle)
    draw.rectangle(
        [basket_left, basket_top, basket_right, basket_bottom],
        outline=orange,
        width=stroke_width
    )
    
    # Draw basket handle (simple arc from left to right, above the basket)
    handle_left = basket_left + (basket_right - basket_left) * 0.15
    handle_right = basket_right - (basket_right - basket_left) * 0.15
    handle_top = basket_top - (basket_bottom - basket_top) * 0.4
    
    draw.arc(
        [handle_left, handle_top, handle_right, basket_top],
        start=0,
        end=180,
        fill=orange,
        width=stroke_width
    )
    
    # Draw two simple wheel lines at bottom
    wheel_spacing = (basket_right - basket_left) * 0.25
    wheel_left_x = basket_left + wheel_spacing
    wheel_right_x = basket_right - wheel_spacing
    wheel_y = basket_bottom + stroke_width
    wheel_radius = (basket_right - basket_left) * 0.12
    
    for wheel_x in [wheel_left_x, wheel_right_x]:
        draw.ellipse(
            [wheel_x - wheel_radius, wheel_y, wheel_x + wheel_radius, wheel_y + wheel_radius * 2],
            outline=orange,
            width=stroke_width
        )
    
    # Draw checkmark to the right, simple and clean
    check_x = width * 0.72
    check_y = height * 0.28
    check_size = width * 0.12
    
    # Draw checkmark lines (clean, minimal)
    check_stroke = max(1, int(width * 0.06))
    
    # Small tick
    draw.line(
        [(check_x - check_size * 0.4, check_y + check_size * 0.2),
         (check_x - check_size * 0.1, check_y + check_size * 0.5)],
        fill=orange,
        width=check_stroke
    )
    
    # Long tick
    draw.line(
        [(check_x - check_size * 0.1, check_y + check_size * 0.5),
         (check_x + check_size * 0.4, check_y - check_size * 0.3)],
        fill=orange,
        width=check_stroke
    )


def draw_logo_old(image: Image.Image) -> None:
    width, height = image.size
    draw = ImageDraw.Draw(image)
    compact = width <= 24

    # Subtle shadow effect for light background.
    basket_shadow = Image.new('RGBA', image.size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(basket_shadow)
    shadow_draw.rounded_rectangle((0.24 * width, 0.47 * height, 0.74 * width, 0.68 * height), radius=0.06 * width, fill=(200, 210, 225, 28))
    basket_shadow = basket_shadow.filter(ImageFilter.GaussianBlur(max(2, width // 22)))
    image.alpha_composite(basket_shadow)

    basket_fill = (35, 50, 85)
    basket_light = (70, 95, 140)
    subtle_line = (56, 76, 112)
    
    # Main basket body - wider and more like a real cart.
    body = (0.22 * width, 0.44 * height, 0.78 * width, 0.68 * height)
    draw.rounded_rectangle(body, radius=0.08 * width, fill=basket_fill)

    # Front and side walls for 3D effect.
    side_fill = subtle_line if compact else basket_light
    draw.line([(0.22 * width, 0.44 * height), (0.22 * width, 0.68 * height)], fill=side_fill, width=max(1, width // 40))
    draw.line([(0.78 * width, 0.44 * height), (0.78 * width, 0.68 * height)], fill=side_fill, width=max(1, width // 40))

    # Basket weave - horizontal lines for texture.
    if width >= 32:
        line_spacing = (0.68 * height - 0.44 * height) / (3 if width < 48 else 4)
        line_count = 2 if width < 48 else 3
        for i in range(1, line_count + 1):
            y = 0.44 * height + line_spacing * i
            draw.line([(0.26 * width, y), (0.74 * width, y)], fill=(55, 75, 110, 78 if width < 48 else 110), width=1)

    # Vertical weave lines for basket grid pattern.
    if width >= 48:
        col_spacing = (0.78 * width - 0.22 * width) / 5
        for i in range(1, 5):
            x = 0.22 * width + col_spacing * i
            draw.line([(x, 0.47 * height), (x, 0.65 * height)], fill=(55, 75, 110, 82), width=1)

    # Rim/edge of basket for definition.
    rim_fill = subtle_line if compact else basket_light
    draw.line([(0.24 * width, 0.44 * height), (0.76 * width, 0.44 * height)], fill=rim_fill, width=max(1, width // 32))

    # Handle - stronger and more visible.
    handle_radius = max(2, width // 24)
    handle_box = (0.32 * width, 0.28 * height, 0.68 * width, 0.44 * height)
    draw.arc(handle_box, start=0, end=180, fill=basket_light, width=max(2, width // 28))
    
    # Handle support posts.
    if not compact:
        draw.line([(0.34 * width, 0.44 * height), (0.32 * width, 0.35 * height)], fill=basket_fill, width=max(1, width // 40))
        draw.line([(0.66 * width, 0.44 * height), (0.68 * width, 0.35 * height)], fill=basket_fill, width=max(1, width // 40))

    # Verification badge with ring.
    badge_box = (0.54 * width, 0.10 * height, 0.90 * width, 0.46 * height)
    draw.ellipse(badge_box, fill=EMERALD, outline=(220, 255, 235), width=max(1, width // 36))
    stroke = max(2, width // 22)
    draw.line([(0.66 * width, 0.24 * height), (0.72 * width, 0.31 * height), (0.84 * width, 0.17 * height)], fill=WHITE, width=stroke)

    # Wheel accents in champagne for a more premium finish.
    wheel_radius = max(3, width // 16)
    for center_x in (0.34 * width, 0.66 * width):
        wheel_box = (center_x - wheel_radius, 0.75 * height - wheel_radius, center_x + wheel_radius, 0.75 * height + wheel_radius)
        draw.ellipse(wheel_box, fill=CHAMPAGNE, outline=(194, 145, 55), width=max(1, width // 48))


def generate_icons() -> None:
    for size in (16, 32, 48, 128):
        image = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        top = (255, 255, 255)
        bottom = (240, 242, 246)
        background = vertical_gradient((size, size), top, bottom)
        add_glow(background)

        # Add a subtle inner panel so the icon feels more finished and premium.
        inner = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        inner_draw = ImageDraw.Draw(inner)
        inset = max(2, round(size * 0.08))
        inner_draw.rounded_rectangle((inset, inset, size - inset, size - inset), radius=max(6, round(size * 0.18)), outline=(255, 255, 255, 20), width=1)
        background.alpha_composite(inner)

        pad = max(2, round(size * 0.03))
        mask = rounded_mask((size - pad * 2, size - pad * 2), max(6, round(size * 0.22)))
        image.paste(background.resize((size - pad * 2, size - pad * 2)), (pad, pad), mask)
        draw_logo(image)
        rgb = image.convert('RGB')
        rgb.save(ICON_DIR / f'icon-{size}.png', optimize=True)
        if size == 128:
            rgb.save(BASE / 'store-icon-128.png', optimize=True)


def draw_button(base: Image.Image, rect: tuple[int, int, int, int], label: str) -> None:
    x0, y0, x1, y1 = rect
    shadow = Image.new('RGBA', base.size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle((x0, y0 + 4, x1, y1 + 4), radius=14, fill=(0, 0, 0, 45))
    shadow = shadow.filter(ImageFilter.GaussianBlur(3))
    base.alpha_composite(shadow)

    button = vertical_gradient((x1 - x0, y1 - y0), AMAZON, AMAZON_DARK)
    mask = rounded_mask((x1 - x0, y1 - y0), 14)
    base.paste(button, (x0, y0), mask)

    draw = ImageDraw.Draw(base)
    draw.rounded_rectangle((x0, y0, x1, y1), radius=14, outline=(255, 228, 181), width=1)
    font = fit_font(draw, label, (x1 - x0) - 18, max(14, (y1 - y0) // 2), 11, bold=True)
    label_width = text_width(draw, label, font)
    label_height = text_height(draw, label, font)
    draw.text((x0 + ((x1 - x0) - label_width) / 2, y0 + ((y1 - y0) - label_height) / 2 - 1), label, fill=INK, font=font)


def draw_product_thumb(base: Image.Image, rect: tuple[int, int, int, int]) -> None:
    x0, y0, x1, y1 = rect
    width = x1 - x0
    height = y1 - y0
    thumb = vertical_gradient((width, height), (245, 248, 252), (226, 232, 240))

    try:
        with Image.open(SOURCE_PRODUCT_IMAGE) as source:
            photo = crop_to_fill(source.convert('RGB'), (width, height)).convert('RGBA')
            thumb = photo
    except Exception:
        shadow = Image.new('RGBA', (width, height), (0, 0, 0, 0))
        shadow_draw = ImageDraw.Draw(shadow)
        shadow_draw.ellipse((width * 0.18, height * 0.72, width * 0.82, height * 0.92), fill=(15, 23, 42, 36))
        shadow = shadow.filter(ImageFilter.GaussianBlur(max(4, width // 18)))
        thumb.alpha_composite(shadow)

        render = Image.new('RGBA', (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(render)
        center_x = width // 2
        center_y = height // 2
        band_width = max(10, width // 18)
        cup_width = max(24, width // 5)
        cup_height = max(40, height // 2)
        band_box = (center_x - width * 0.22, center_y - height * 0.34, center_x + width * 0.22, center_y + height * 0.16)
        draw.arc(band_box, start=198, end=342, fill=(69, 85, 110), width=band_width)
        draw.rounded_rectangle((center_x - width * 0.26, center_y - height * 0.12, center_x - width * 0.11, center_y + cup_height * 0.55), radius=12, fill=(77, 92, 118))
        draw.rounded_rectangle((center_x + width * 0.11, center_y - height * 0.12, center_x + width * 0.26, center_y + cup_height * 0.55), radius=12, fill=(77, 92, 118))
        draw.rounded_rectangle((center_x - width * 0.17, center_y - height * 0.06, center_x + width * 0.17, center_y + cup_height * 0.52), radius=14, outline=(118, 134, 160), width=max(3, width // 30))
        highlight = Image.new('RGBA', (width, height), (0, 0, 0, 0))
        hd = ImageDraw.Draw(highlight)
        hd.ellipse((width * 0.12, height * 0.04, width * 0.58, height * 0.46), fill=(255, 255, 255, 46))
        highlight = highlight.filter(ImageFilter.GaussianBlur(max(4, width // 22)))
        render.alpha_composite(highlight)
        thumb.alpha_composite(render)

    base.paste(thumb.convert('RGB'), (x0, y0))


def draw_chip(draw: ImageDraw.ImageDraw, rect: tuple[int, int, int, int], text: str, fill: tuple[int, int, int], fg: tuple[int, int, int], bold: bool = True) -> None:
    x0, y0, x1, y1 = rect
    draw.rounded_rectangle(rect, radius=(y1 - y0) // 2, fill=fill)
    font = fit_font(draw, text, x1 - x0 - 12, max(11, (y1 - y0) // 2), 9, bold=bold)
    draw.text((x0 + 8, y0 + ((y1 - y0) - text_height(draw, text, font)) / 2 - 1), text, fill=fg, font=font)


def draw_text_button(
    draw: ImageDraw.ImageDraw,
    rect: tuple[int, int, int, int],
    text: str,
    fill: tuple[int, int, int],
    fg: tuple[int, int, int],
    outline: tuple[int, int, int] | None = None,
    bold: bool = False,
) -> None:
    x0, y0, x1, y1 = rect
    draw.rounded_rectangle(rect, radius=10, fill=fill, outline=outline, width=1 if outline else 0)
    font = fit_font(draw, text, x1 - x0 - 12, 12, 9, bold=bold)
    label_width = text_width(draw, text, font)
    label_height = text_height(draw, text, font)
    draw.text((x0 + ((x1 - x0) - label_width) / 2, y0 + ((y1 - y0) - label_height) / 2 - 1), text, fill=fg, font=font)


def draw_decision_panel(base: Image.Image, rect: tuple[int, int, int, int], feature_line: str) -> None:
    x0, y0, x1, y1 = rect
    compact = (y1 - y0) < 480
    panel = Image.new('RGBA', base.size, (0, 0, 0, 0))
    shadow = Image.new('RGBA', base.size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle((x0, y0 + 8, x1, y1 + 8), radius=16, fill=(15, 23, 42, 28))
    shadow = shadow.filter(ImageFilter.GaussianBlur(12))
    base.alpha_composite(shadow)

    draw = ImageDraw.Draw(panel)
    draw.rounded_rectangle(rect, radius=16, fill=WHITE, outline=(209, 213, 219), width=1)
    draw.rounded_rectangle((x0, y0, x1, y0 + 42), radius=16, fill=(248, 250, 252))
    draw.rectangle((x0, y0 + 20, x1, y0 + 42), fill=(248, 250, 252))
    draw.line((x0, y0 + 42, x1, y0 + 42), fill=(229, 231, 235), width=1)

    small_font = load_font(11, bold=True)
    draw.text((x0 + 16, y0 + 14), 'DRAG PANEL', fill=(71, 85, 105), font=small_font)
    close_font = load_font(12)
    close_text = 'Close'
    close_width = text_width(draw, close_text, close_font)
    draw.text((x1 - close_width - 14, y0 + 13), close_text, fill=(107, 114, 128), font=close_font)

    cursor_y = y0 + 56
    eyebrow_font = load_font(11)
    title_font = fit_font(draw, 'Sony WH-1000XM4', x1 - x0 - 48, 22, 16, bold=True)
    draw.text((x0 + 16, cursor_y), 'DECISION SUMMARY', fill=(107, 114, 128), font=eyebrow_font)
    cursor_y += 18
    draw.text((x0 + 16, cursor_y), 'Sony WH-1000XM4', fill=INK, font=title_font)
    cursor_y += title_font.size + 12

    rec_rect = (x0 + 16, cursor_y, x1 - 16, cursor_y + 44)
    draw.rounded_rectangle(rec_rect, radius=10, outline=(76, 175, 80), width=2, fill=(255, 255, 255))
    rec_font = load_font(13, bold=True)
    conf_font = load_font(12)
    draw.text((rec_rect[0] + 12, rec_rect[1] + 13), 'highly recommended', fill=(76, 175, 80), font=rec_font)
    conf_text = '89% confidence'
    conf_width = text_width(draw, conf_text, conf_font)
    draw.text((rec_rect[2] - conf_width - 12, rec_rect[1] + 14), conf_text, fill=(31, 41, 55), font=conf_font)
    cursor_y = rec_rect[3] + 12

    badge_font = load_font(12, bold=True)
    badge_text = 'Great Deal 86/100'
    badge_width = text_width(draw, badge_text, badge_font) + 20
    draw_chip(draw, (x0 + 16, cursor_y, x0 + 16 + badge_width, cursor_y + 28), badge_text, (220, 252, 231), (22, 101, 52))
    cursor_y += 36

    note_font = load_font(12)
    note_text = 'Strong rating, strong discount, and solid price confidence.'
    if not compact:
        note_font, note_lines = wrap_text(draw, note_text, x1 - x0 - 32, 12, 10, 2)
        for line in note_lines:
            draw.text((x0 + 16, cursor_y), line, fill=(75, 85, 99), font=note_font)
            cursor_y += note_font.size + 2
        cursor_y += 8

    radar_height = 64 if compact else 78
    radar_rect = (x0 + 16, cursor_y, x1 - 16, cursor_y + radar_height)
    draw.rounded_rectangle(radar_rect, radius=10, fill=(248, 250, 252), outline=(219, 227, 238), width=1)
    radar_title_font = load_font(12, bold=True)
    radar_font = load_font(12)
    draw.text((radar_rect[0] + 12, radar_rect[1] + 10), 'MARKET RADAR', fill=(51, 65, 85), font=radar_title_font)
    draw.text((radar_rect[0] + 12, radar_rect[1] + 28), 'Best overall: Amazon $279.99', fill=INK, font=radar_font)
    if compact:
        draw.text((radar_rect[0] + 12, radar_rect[1] + 44), feature_line, fill=(15, 90, 150), font=load_font(11))
    else:
        draw.text((radar_rect[0] + 12, radar_rect[1] + 44), 'Best online: Online Marketplace $285.99', fill=INK, font=radar_font)
        draw.text((radar_rect[0] + 12, radar_rect[1] + 60), feature_line, fill=(15, 90, 150), font=radar_font)
    cursor_y = radar_rect[3] + 10

    if compact:
        draw_chip(draw, (x0 + 16, cursor_y, x0 + 82, cursor_y + 24), 'Buy Now', (230, 240, 251), (15, 90, 150))
        draw.text((x0 + 92, cursor_y + 4), 'High urgency', fill=(75, 85, 99), font=load_font(12))
        cursor_y += 34
    else:
        timing_height = 70
        timing_rect = (x0 + 16, cursor_y, x1 - 16, cursor_y + timing_height)
        draw.rounded_rectangle(timing_rect, radius=10, fill=(248, 250, 252), outline=(219, 227, 238), width=1)
        draw_chip(draw, (timing_rect[0] + 12, timing_rect[1] + 10, timing_rect[0] + 82, timing_rect[1] + 32), 'Buy Now', (230, 240, 251), (15, 90, 150))
        draw.text((timing_rect[0] + 92, timing_rect[1] + 14), 'High urgency', fill=(75, 85, 99), font=load_font(12))
        draw.text((timing_rect[0] + 12, timing_rect[1] + 40), 'Estimated savings now: 12%', fill=INK, font=load_font(12))
        draw.text((timing_rect[0] + 12, timing_rect[1] + 56), 'Prime delivery available for this item.', fill=(75, 85, 99), font=load_font(11))
        cursor_y = timing_rect[3] + 10

    reasons_font = load_font(12)
    bullets = ['Discount versus recent list price'] if compact else ['Discount versus recent list price', 'High review quality with reliable demand']
    for bullet in bullets:
        draw.ellipse((x0 + 18, cursor_y + 6, x0 + 22, cursor_y + 10), fill=(59, 130, 246))
        draw.text((x0 + 30, cursor_y), bullet, fill=INK, font=reasons_font)
        cursor_y += 18
    cursor_y += 4 if not compact else 2

    if not compact:
        price_font = load_font(14, bold=True)
        draw.text((x0 + 16, cursor_y), 'Price Analysis', fill=INK, font=price_font)
        cursor_y += 22
        label_font = load_font(13)
        draw.text((x0 + 16, cursor_y), 'Excellent Price', fill=INK, font=label_font)
        cursor_y += 18
        bar_rect = (x0 + 16, cursor_y, x1 - 16, cursor_y + 10)
        draw.rounded_rectangle(bar_rect, radius=5, fill=(229, 231, 235))
        draw.rounded_rectangle((bar_rect[0], bar_rect[1], int(bar_rect[0] + (bar_rect[2] - bar_rect[0]) * 0.84), bar_rect[3]), radius=5, fill=(76, 175, 80))
        cursor_y += 22

    primary_y = y1 - 64
    button_gap = 8
    total_width = (x1 - x0) - 32
    if compact:
        primary_width = int(total_width * 0.68)
        tertiary_width = total_width - primary_width - button_gap
        first_rect = (x0 + 16, primary_y, x0 + 16 + primary_width, primary_y + 38)
        second_x = first_rect[2] + button_gap
        second_rect = (second_x, primary_y, second_x + tertiary_width, primary_y + 38)
        draw_text_button(draw, first_rect, 'Buy on Amazon', (22, 101, 52), WHITE, bold=True)
        draw_text_button(draw, second_rect, 'Share', (239, 246, 255), (29, 78, 216))
    else:
        primary_width = int(total_width * 0.42)
        secondary_width = int(total_width * 0.30)
        tertiary_width = total_width - primary_width - secondary_width - button_gap * 2
        first_rect = (x0 + 16, primary_y, x0 + 16 + primary_width, primary_y + 38)
        second_x = first_rect[2] + button_gap
        second_rect = (second_x, primary_y, second_x + secondary_width, primary_y + 38)
        third_x = second_rect[2] + button_gap
        third_rect = (third_x, primary_y, third_x + tertiary_width, primary_y + 38)
        draw_text_button(draw, first_rect, 'Buy on Amazon', (22, 101, 52), WHITE, bold=True)
        draw_text_button(draw, second_rect, 'Compare Later', WHITE, (55, 65, 81), outline=(209, 213, 219))
        draw_text_button(draw, third_rect, 'Share', (239, 246, 255), (29, 78, 216))
    if not compact:
        draw.text((x0 + 16, y1 - 18), 'We may earn from qualifying purchases.', fill=(107, 114, 128), font=load_font(11))

    base.alpha_composite(panel)


def draw_browser_mock(base: Image.Image, frame: tuple[int, int, int, int], feature_line: str, compact: bool = False) -> None:
    draw = ImageDraw.Draw(base)
    x0, y0, x1, y1 = frame
    radius = max(18, (y1 - y0) // 18)
    draw.rounded_rectangle(frame, radius=radius, fill=(255, 255, 255), outline=(203, 213, 225), width=2)

    header_height = max(40, (y1 - y0) // 12)
    draw.rounded_rectangle((x0, y0, x1, y0 + header_height), radius=radius, fill=(19, 25, 33))
    draw.rectangle((x0, y0 + header_height - radius, x1, y0 + header_height), fill=(19, 25, 33))
    for index, color in enumerate(((239, 68, 68), (245, 158, 11), (34, 197, 94))):
        cx = x0 + 28 + index * 30
        cy = y0 + header_height // 2
        draw.ellipse((cx - 7, cy - 7, cx + 7, cy + 7), fill=color)

    # Calculate button position with proper spacing
    button_width = 100
    button_right = x1 - 16
    button_left = button_right - button_width
    search_rect = (x0 + 124, y0 + 8, button_left - 12, y0 + header_height - 8)
    
    draw.rounded_rectangle(search_rect, radius=14, fill=WHITE)
    draw.text((search_rect[0] + 16, search_rect[1] + 5), 'Search Amazon products', fill=(148, 163, 184), font=load_font(13))
    draw.rounded_rectangle((button_left, y0 + 8, button_right, y0 + header_height - 8), radius=14, fill=(255, 153, 0))
    draw.text((button_left + 16, y0 + 14), 'Search', fill=INK, font=load_font(13, bold=True))

    gap = max(18, (x1 - x0) // 36)
    content_rect = (x0 + gap, y0 + header_height + gap, x1 - gap, y1 - gap - 12)
    draw.rectangle(content_rect, fill=(255, 255, 255))

    # Make a square box for the product image - larger and square
    card_size = int(min((content_rect[2] - content_rect[0]) * 0.35, (content_rect[3] - content_rect[1]) * 0.75))
    image_card = (content_rect[0] + 18, content_rect[1] + 18, content_rect[0] + 18 + card_size, content_rect[1] + 18 + card_size)
    draw.rounded_rectangle(image_card, radius=16, fill=(248, 250, 252), outline=(226, 232, 240), width=1)
    
    # Make a square thumb that fits inside the card
    card_width = image_card[2] - image_card[0]
    card_height = image_card[3] - image_card[1]
    square_size = min(card_width, card_height) - 24
    left = image_card[0] + (card_width - square_size) // 2
    top = image_card[1] + (card_height - square_size) // 2
    thumb_rect = (left, top, left + square_size, top + square_size)
    draw_product_thumb(base, thumb_rect)

    text_x = image_card[2] + 24
    buy_box_width = int((content_rect[2] - content_rect[0]) * 0.19)
    text_right = content_rect[2] - buy_box_width - 32
    title_font, title_lines = wrap_text(draw, 'Sony WH-1000XM4 Wireless Headphones', text_right - text_x, 28, 18, 2, bold=True)
    meta_font = load_font(max(14, title_font.size - 8))
    price_font = load_font(max(32, title_font.size + 10), bold=True)
    title_y = content_rect[1] + 26
    for line in title_lines:
        draw.text((text_x, title_y), line, fill=INK, font=title_font)
        title_y += title_font.size + 2
    draw.text((text_x, title_y + 10), '$279.99', fill=(11, 116, 133), font=price_font)
    draw.text((text_x, title_y + 64), '4.7 stars  •  43,000 reviews  •  Prime delivery', fill=STEEL, font=meta_font)
    bullets = [
        'Industry-leading noise cancellation',
        'Up to 30 hours battery life',
        'Fast shipping and easy returns',
    ]
    bullet_y = title_y + 106
    for bullet in bullets:
        draw.ellipse((text_x, bullet_y + 6, text_x + 6, bullet_y + 12), fill=(255, 153, 0))
        draw.text((text_x + 14, bullet_y), bullet, fill=(55, 65, 81), font=meta_font)
        bullet_y += meta_font.size + 10

    buy_box = (content_rect[2] - buy_box_width, content_rect[1] + 24, content_rect[2] - 8, content_rect[1] + 230)
    draw.rounded_rectangle(buy_box, radius=14, fill=(255, 255, 255), outline=(226, 232, 240), width=1)
    draw.text((buy_box[0] + 18, buy_box[1] + 18), '$279.99', fill=INK, font=load_font(24, bold=True))
    draw.text((buy_box[0] + 18, buy_box[1] + 54), 'FREE delivery Tomorrow', fill=(15, 118, 110), font=load_font(12))
    draw.text((buy_box[0] + 18, buy_box[1] + 78), 'In Stock', fill=(22, 101, 52), font=load_font(13))
    draw_button(base, (buy_box[0] + 18, buy_box[1] + 108, buy_box[2] - 18, buy_box[1] + 148), 'Add to Cart')
    draw.rounded_rectangle((buy_box[0] + 18, buy_box[1] + 160, buy_box[2] - 18, buy_box[1] + 198), radius=12, fill=(255, 255, 255), outline=(209, 213, 219), width=1)
    draw.text((buy_box[0] + 42, buy_box[1] + 171), 'Buy Now', fill=INK, font=load_font(12, bold=True))

    if compact:
        panel_width = int((x1 - x0) * 0.30)
        panel_height = int((y1 - y0) * 0.66)
        panel_rect = (x1 - panel_width - 18, y1 - panel_height - 18, x1 - 18, y1 - 18)
    else:
        panel_width = int((x1 - x0) * 0.30)
        panel_height = int((y1 - y0) * 0.89)
        panel_top = y0 + header_height + 54
        panel_rect = (x1 - panel_width - 18, panel_top, x1 - 18, min(y1 - 18, panel_top + panel_height))
    draw_decision_panel(base, panel_rect, feature_line)


def compose_small_promo(output_path: Path) -> None:
    size = (440, 280)
    width, height = size
    canvas = vertical_gradient(size, NAVY, MIDNIGHT)
    add_glow(canvas)
    draw = ImageDraw.Draw(canvas)

    side_margin = 28
    title_font, title_lines = wrap_text(draw, 'Shop Smarter, Buy Better', width - side_margin * 2 - 140, 30, 20, 2, bold=True)
    title_y = 24
    for line in title_lines:
        draw.text((side_margin, title_y), line, fill=WHITE, font=title_font)
        title_y += title_font.size + 2

    subtitle_font, subtitle_lines = wrap_text(draw, 'Premium guidance with a clear Amazon buy signal', width - side_margin * 2 - 20, 15, 11, 2)
    subtitle_y = title_y + 6
    for line in subtitle_lines:
        draw.text((side_margin, subtitle_y), line, fill=(203, 213, 225), font=subtitle_font)
        subtitle_y += subtitle_font.size + 2

    draw_button(canvas, (width - 170, 26, width - 28, 68), 'Buy on Amazon')

    frame_top = max(126, subtitle_y + 12)
    frame = (28, frame_top, width - 28, height - 22)
    draw.rounded_rectangle(frame, radius=22, fill=(241, 245, 249), outline=(148, 163, 184), width=2)

    x0, y0, x1, y1 = frame
    draw.rounded_rectangle((x0, y0, x1, y0 + 40), radius=22, fill=(226, 232, 240))
    draw.rectangle((x0, y0 + 20, x1, y0 + 40), fill=(226, 232, 240))
    for index, color in enumerate(((239, 68, 68), (245, 158, 11), (34, 197, 94))):
        cx = x0 + 28 + index * 24
        cy = y0 + 20
        draw.ellipse((cx - 7, cy - 7, cx + 7, cy + 7), fill=color)

    thumb = (x0 + 18, y0 + 52, x0 + 104, y0 + 138)
    draw_product_thumb(canvas, thumb)
    card = (x0 + 122, y0 + 52, x1 - 18, y0 + 138)
    draw.rounded_rectangle(card, radius=14, fill=WHITE, outline=(194, 209, 228), width=2)

    product_font = fit_font(draw, 'Sony WH-1000XM4', card[2] - card[0] - 20, 16, 11, bold=True)
    price_font = load_font(18, bold=True)
    meta_font = load_font(10)
    draw.text((card[0] + 14, card[1] + 12), 'Sony WH-1000XM4', fill=INK, font=product_font)
    draw.text((card[0] + 14, card[1] + 38), '$279.99', fill=SKY, font=price_font)
    draw.text((card[0] + 14, card[1] + 64), '89% confidence  •  Great deal', fill=STEEL, font=meta_font)

    canvas.convert('RGB').save(output_path, optimize=True)


def compose_asset(size: tuple[int, int], title: str, subtitle: str, feature_line: str, output_path: Path, title_lines: int = 2) -> None:
    width, height = size
    canvas = vertical_gradient(size, NAVY, MIDNIGHT)
    add_glow(canvas)
    draw = ImageDraw.Draw(canvas)

    side_margin = max(28, width // 18)
    top_margin = max(24, height // 14)
    headline_width = width - side_margin * 2

    title_font, title_wrapped = wrap_text(draw, title, headline_width, max(34, height // 9), 20, title_lines, bold=True)
    title_y = top_margin
    for line in title_wrapped:
        draw.text((side_margin, title_y), line, fill=WHITE, font=title_font)
        title_y += title_font.size + 4

    subtitle_font, subtitle_wrapped = wrap_text(draw, subtitle, headline_width, max(18, height // 18), 12, 2, bold=False)
    subtitle_y = title_y + 4
    for line in subtitle_wrapped:
        draw.text((side_margin, subtitle_y), line, fill=(203, 213, 225), font=subtitle_font)
        subtitle_y += subtitle_font.size + 2

    frame_top = subtitle_y + max(16, height // 24)
    frame_bottom = height - max(22, height // 18)
    frame = (side_margin, frame_top, width - side_margin, frame_bottom)
    draw_browser_mock(canvas, frame, feature_line, compact=(width <= 480))
    canvas.convert('RGB').save(output_path, optimize=True)


def generate_marketing_assets() -> None:
    compose_small_promo(PROMO_DIR / 'small-promo-440x280.png')
    compose_asset(
        (1400, 560),
        'Should I Buy This?',
        'Premium decision intelligence and one-click Amazon flow',
        'Est. savings now: 12%',
        PROMO_DIR / 'marquee-promo-1400x560.png',
        title_lines=1,
    )

    screenshot_specs: Iterable[tuple[str, str, str]] = (
        ('Should I Buy This?', 'Instant guidance on supported Amazon product pages', 'Est. savings now: 12%'),
        ('Should I Buy This?', 'Confidence scoring, market radar, and value context', 'Best timing: buy now'),
        ('Should I Buy This?', 'Conversion-focused Buy on Amazon flow with clear disclosure', 'Prime delivery available'),
    )
    for index, (title, subtitle, feature_line) in enumerate(screenshot_specs, start=1):
        compose_asset((1280, 800), title, subtitle, feature_line, SHOT_DIR / f'screenshot-{index}-1280x800.png', title_lines=1)


def main() -> None:
    ensure_dirs()
    generate_icons()
    generate_marketing_assets()
    print('Generated store assets in', BASE)


if __name__ == '__main__':
    main()
