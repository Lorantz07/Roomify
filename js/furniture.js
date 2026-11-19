/* ==========================================================================
   Roomify — Furniture catalog and top-view shapes
   Shared by the interactive editor and the dashboard plan thumbnails.
   ========================================================================== */

(function () {
  'use strict';

  var NS = (window.Roomify = window.Roomify || {});

  var CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'seating', label: 'Seating' },
    { id: 'tables', label: 'Tables' },
    { id: 'storage', label: 'Storage' },
    { id: 'bedroom', label: 'Bedroom' },
    { id: 'kitchen', label: 'Kitchen' },
    { id: 'bathroom', label: 'Bathroom' },
    { id: 'decor', label: 'Decor' }
  ];

  var ITEMS = [
    { id: 'sofa', name: 'Three-seat sofa', category: 'seating', shape: 'sofa', widthCm: 210, depthCm: 90, color: '#879783' },
    { id: 'armchair', name: 'Armchair', category: 'seating', shape: 'armchair', widthCm: 85, depthCm: 85, color: '#b97961' },
    { id: 'dining-chair', name: 'Dining chair', category: 'seating', shape: 'chair', widthCm: 48, depthCm: 52, color: '#b08a5f' },
    { id: 'bench', name: 'Bench', category: 'seating', shape: 'bench', widthCm: 120, depthCm: 40, color: '#9a7b58' },
    { id: 'ottoman', name: 'Ottoman', category: 'seating', shape: 'ottoman', widthCm: 65, depthCm: 65, color: '#c8a087' },

    { id: 'coffee-table', name: 'Coffee table', category: 'tables', shape: 'table', widthCm: 110, depthCm: 60, color: '#c9a978' },
    { id: 'dining-table', name: 'Dining table', category: 'tables', shape: 'table', widthCm: 170, depthCm: 90, color: '#a9845c' },
    { id: 'desk', name: 'Desk', category: 'tables', shape: 'desk', widthCm: 140, depthCm: 70, color: '#c9a978' },
    { id: 'side-table', name: 'Side table', category: 'tables', shape: 'round-table', widthCm: 45, depthCm: 45, color: '#b08a5f' },

    { id: 'bookshelf', name: 'Bookshelf', category: 'storage', shape: 'shelf', widthCm: 90, depthCm: 35, color: '#b08a5f' },
    { id: 'wardrobe', name: 'Wardrobe', category: 'storage', shape: 'wardrobe', widthCm: 120, depthCm: 60, color: '#a9845c' },
    { id: 'sideboard', name: 'Sideboard', category: 'storage', shape: 'sideboard', widthCm: 150, depthCm: 45, color: '#a9845c' },
    { id: 'tv-console', name: 'TV console', category: 'storage', shape: 'media', widthCm: 160, depthCm: 40, color: '#8a7257' },

    { id: 'double-bed', name: 'Double bed', category: 'bedroom', shape: 'bed', widthCm: 160, depthCm: 200, color: '#e8e1d4' },
    { id: 'single-bed', name: 'Single bed', category: 'bedroom', shape: 'bed', widthCm: 90, depthCm: 200, color: '#e8e1d4' },
    { id: 'nightstand', name: 'Nightstand', category: 'bedroom', shape: 'nightstand', widthCm: 45, depthCm: 40, color: '#b08a5f' },
    { id: 'dresser', name: 'Dresser', category: 'bedroom', shape: 'dresser', widthCm: 110, depthCm: 50, color: '#a9845c' },

    { id: 'kitchen-island', name: 'Kitchen island', category: 'kitchen', shape: 'island', widthCm: 180, depthCm: 90, color: '#d5d1c7' },
    { id: 'counter', name: 'Counter run', category: 'kitchen', shape: 'counter', widthCm: 240, depthCm: 60, color: '#d5d1c7' },
    { id: 'fridge', name: 'Fridge', category: 'kitchen', shape: 'fridge', widthCm: 70, depthCm: 70, color: '#d5d1c7' },
    { id: 'cooktop', name: 'Cooktop', category: 'kitchen', shape: 'cooktop', widthCm: 60, depthCm: 60, color: '#3f423e' },

    { id: 'bathtub', name: 'Bathtub', category: 'bathroom', shape: 'bathtub', widthCm: 170, depthCm: 75, color: '#f5f1e8' },
    { id: 'shower', name: 'Shower', category: 'bathroom', shape: 'shower', widthCm: 90, depthCm: 90, color: '#d5d1c7' },
    { id: 'toilet', name: 'Toilet', category: 'bathroom', shape: 'toilet', widthCm: 40, depthCm: 65, color: '#f5f1e8' },
    { id: 'vanity', name: 'Vanity', category: 'bathroom', shape: 'vanity', widthCm: 80, depthCm: 50, color: '#b08a5f' },

    { id: 'rug', name: 'Rug', category: 'decor', shape: 'rug', widthCm: 200, depthCm: 140, color: '#e5e2dc' },
    { id: 'plant', name: 'Plant', category: 'decor', shape: 'plant', widthCm: 50, depthCm: 50, color: '#879783' },
    { id: 'floor-lamp', name: 'Floor lamp', category: 'decor', shape: 'lamp', widthCm: 35, depthCm: 35, color: '#3f423e' }
  ];

  function getItem(id) {
    for (var i = 0; i < ITEMS.length; i += 1) {
      if (ITEMS[i].id === id) return ITEMS[i];
    }
    return null;
  }

  function clampByte(value) {
    return Math.max(0, Math.min(255, Math.round(value)));
  }

  function shade(hex, amount) {
    var value = String(hex || '').replace('#', '');
    if (value.length === 3) {
      value = value[0] + value[0] + value[1] + value[1] + value[2] + value[2];
    }
    if (!/^[0-9a-f]{6}$/i.test(value)) return '#d5d1c7';

    var red = parseInt(value.slice(0, 2), 16);
    var green = parseInt(value.slice(2, 4), 16);
    var blue = parseInt(value.slice(4, 6), 16);
    var target = amount < 0 ? 0 : 255;
    var mix = Math.min(1, Math.abs(amount));

    red = clampByte(red + (target - red) * mix);
    green = clampByte(green + (target - green) * mix);
    blue = clampByte(blue + (target - blue) * mix);

    return '#' + [red, green, blue].map(function (channel) {
      var part = channel.toString(16);
      return part.length === 1 ? '0' + part : part;
    }).join('');
  }

  function number(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function roundedRect(x, y, width, height, radius, fill, stroke, strokeWidth, extra) {
    return (
      '<rect x="' + x + '" y="' + y + '" width="' + width + '" height="' + height +
      '" rx="' + radius + '" fill="' + fill + '"' +
      (stroke ? ' stroke="' + stroke + '" stroke-width="' + strokeWidth + '"' : '') +
      (extra ? ' ' + extra : '') +
      '/>'
    );
  }

  function upholstered(w, h, fill, detail, ink, cushions, back) {
    var sw = Math.max(0.6, Math.min(w, h) * 0.018);
    var radius = Math.min(w, h) * 0.09;
    var hasBack = back !== false;
    var backHeight = hasBack ? h * 0.27 : 0;
    var arm = Math.min(w * 0.09, w * 0.16);
    var seatX = arm + sw;
    var seatY = backHeight + sw;
    var seatW = Math.max(1, w - seatX * 2);
    var seatH = Math.max(1, h - seatY - sw);
    var parts = [];

    parts.push(roundedRect(0, 0, w, h, radius, fill, ink, sw));

    if (hasBack) {
      parts.push(roundedRect(sw, sw, w - sw * 2, backHeight - sw, radius * 0.7, detail));
    }

    if (arm > 0.5) {
      parts.push(roundedRect(sw, Math.max(sw, backHeight), arm, Math.max(1, h - backHeight - sw), radius * 0.45, detail));
      parts.push(roundedRect(w - arm - sw, Math.max(sw, backHeight), arm, Math.max(1, h - backHeight - sw), radius * 0.45, detail));
    }

    parts.push(roundedRect(seatX, seatY, seatW, seatH, radius * 0.42, shade(fill, 0.08), detail, sw * 0.7));

    if (cushions > 1) {
      for (var i = 1; i < cushions; i += 1) {
        var x = seatX + (seatW / cushions) * i;
        parts.push(
          '<path d="M' + x + ' ' + (seatY + sw) + 'V' + (seatY + seatH - sw) +
          '" stroke="' + detail + '" stroke-width="' + sw * 0.7 + '" opacity="0.8"/>'
        );
      }
    }

    return parts.join('');
  }

  function chair(w, h, fill, detail, ink) {
    var sw = Math.max(0.6, Math.min(w, h) * 0.018);
    var radius = Math.min(w, h) * 0.1;
    var back = h * 0.24;
    var parts = [];

    parts.push(roundedRect(0, 0, w, h, radius, fill, ink, sw));
    parts.push(roundedRect(sw, sw, w - sw * 2, back, radius * 0.55, detail));
    parts.push(roundedRect(w * 0.14, back + sw * 1.5, w * 0.72, h - back - sw * 3, radius * 0.45, shade(fill, 0.08), detail, sw * 0.7));

    [0.16, 0.84].forEach(function (xRatio) {
      [0.16, 0.84].forEach(function (yRatio) {
        parts.push('<circle cx="' + w * xRatio + '" cy="' + h * yRatio + '" r="' + sw * 1.25 + '" fill="' + detail + '"/>');
      });
    });

    return parts.join('');
  }

  function bench(w, h, fill, detail, ink) {
    var sw = Math.max(0.6, Math.min(w, h) * 0.018);
    var radius = Math.min(w, h) * 0.12;
    var parts = [];
    parts.push(roundedRect(0, 0, w, h, radius, fill, ink, sw));
    parts.push(roundedRect(sw * 1.5, sw * 1.5, w - sw * 3, h - sw * 3, radius * 0.7, shade(fill, 0.07), detail, sw * 0.7));
    parts.push('<path d="M' + (w / 2) + ' ' + (sw * 2) + 'V' + (h - sw * 2) + '" stroke="' + detail + '" stroke-width="' + sw * 0.6 + '" opacity="0.7"/>');
    [0.12, 0.88].forEach(function (xRatio) {
      parts.push('<circle cx="' + w * xRatio + '" cy="' + h * 0.18 + '" r="' + sw + '" fill="' + detail + '"/>');
      parts.push('<circle cx="' + w * xRatio + '" cy="' + h * 0.82 + '" r="' + sw + '" fill="' + detail + '"/>');
    });
    return parts.join('');
  }

  function ottoman(w, h, fill, detail, ink) {
    var sw = Math.max(0.6, Math.min(w, h) * 0.018);
    var radius = Math.min(w, h) * 0.22;
    var parts = [];
    parts.push(roundedRect(0, 0, w, h, radius, fill, ink, sw));
    parts.push(roundedRect(sw * 1.4, sw * 1.4, w - sw * 2.8, h - sw * 2.8, radius * 0.8, shade(fill, 0.06), detail, sw * 0.6));
    [0.3, 0.5, 0.7].forEach(function (xRatio) {
      [0.3, 0.5, 0.7].forEach(function (yRatio) {
        parts.push('<circle cx="' + w * xRatio + '" cy="' + h * yRatio + '" r="' + sw * 0.75 + '" fill="' + detail + '" opacity="0.75"/>');
      });
    });
    return parts.join('');
  }

  function table(w, h, fill, detail, ink) {
    var sw = Math.max(0.6, Math.min(w, h) * 0.018);
    var leg = Math.min(w, h) * 0.09;
    var parts = [];
    parts.push(roundedRect(0, 0, w, h, Math.min(w, h) * 0.04, fill, ink, sw));
    parts.push(roundedRect(sw * 2, sw * 2, w - sw * 4, h - sw * 4, Math.min(w, h) * 0.025, 'none', detail, sw * 0.65));
    [[0, 0], [w - leg, 0], [0, h - leg], [w - leg, h - leg]].forEach(function (point) {
      parts.push('<rect x="' + point[0] + '" y="' + point[1] + '" width="' + leg + '" height="' + leg + '" fill="' + detail + '" opacity="0.9"/>');
    });
    return parts.join('');
  }

  function roundTable(w, h, fill, detail, ink) {
    var sw = Math.max(0.6, Math.min(w, h) * 0.018);
    var radius = Math.min(w, h) / 2;
    var parts = [];
    parts.push('<circle cx="' + (w / 2) + '" cy="' + (h / 2) + '" r="' + radius + '" fill="' + fill + '" stroke="' + ink + '" stroke-width="' + sw + '"/>');
    parts.push('<circle cx="' + (w / 2) + '" cy="' + (h / 2) + '" r="' + (radius - sw * 2.2) + '" fill="none" stroke="' + detail + '" stroke-width="' + sw * 0.65 + '"/>');
    parts.push('<circle cx="' + (w / 2) + '" cy="' + (h / 2) + '" r="' + sw * 1.1 + '" fill="' + detail + '"/>');
    return parts.join('');
  }

  function desk(w, h, fill, detail, ink) {
    var sw = Math.max(0.6, Math.min(w, h) * 0.018);
    var parts = [];
    parts.push(table(w, h, fill, detail, ink));
    parts.push(roundedRect(w * 0.66, h * 0.12, w * 0.28, h * 0.76, sw, detail));
    parts.push('<path d="M' + (w * 0.72) + ' ' + (h / 2) + 'H' + (w * 0.88) + '" stroke="' + ink + '" stroke-width="' + sw * 0.9 + '" stroke-linecap="round"/>');
    parts.push('<circle cx="' + (w * 0.22) + '" cy="' + (h * 0.28) + '" r="' + (sw * 1.3) + '" fill="none" stroke="' + detail + '" stroke-width="' + sw * 0.7 + '"/>');
    return parts.join('');
  }

  function shelf(w, h, fill, detail, ink) {
    var sw = Math.max(0.6, Math.min(w, h) * 0.018);
    var parts = [];
    parts.push(roundedRect(0, 0, w, h, Math.min(w, h) * 0.04, fill, ink, sw));
    parts.push('<path d="M' + (w / 3) + ' ' + sw + 'V' + (h - sw) + 'M' + (w * 2 / 3) + ' ' + sw + 'V' + (h - sw) + '" stroke="' + detail + '" stroke-width="' + sw * 0.8 + '"/>');
    var bookColors = [shade(fill, -0.3), shade(fill, 0.18), shade(fill, -0.12), shade(fill, 0.3)];
    [0.08, 0.42, 0.76].forEach(function (xRatio, section) {
      for (var i = 0; i < 3; i += 1) {
        var bookW = w * 0.055;
        var bookH = h * (0.35 + (i % 2) * 0.15);
        parts.push(
          '<rect x="' + (w * xRatio + i * bookW * 1.25) + '" y="' + (h * 0.15) + '" width="' + bookW +
          '" height="' + bookH + '" fill="' + bookColors[(section + i) % bookColors.length] + '" opacity="0.9"/>'
        );
      }
    });
    return parts.join('');
  }

  function wardrobe(w, h, fill, detail, ink) {
    var sw = Math.max(0.6, Math.min(w, h) * 0.018);
    var parts = [];
    parts.push(roundedRect(0, 0, w, h, Math.min(w, h) * 0.04, fill, ink, sw));
    parts.push('<path d="M' + (w / 2) + ' ' + sw + 'V' + (h - sw) + '" stroke="' + ink + '" stroke-width="' + sw * 0.9 + '"/>');
    parts.push(roundedRect(sw * 1.6, sw * 1.6, w / 2 - sw * 2.4, h - sw * 3.2, sw * 0.6, 'none', detail, sw * 0.65));
    parts.push(roundedRect(w / 2 + sw * 0.8, sw * 1.6, w / 2 - sw * 2.4, h - sw * 3.2, sw * 0.6, 'none', detail, sw * 0.65));
    parts.push('<circle cx="' + (w / 2 - sw * 2) + '" cy="' + (h / 2) + '" r="' + (sw * 0.9) + '" fill="' + ink + '"/>');
    parts.push('<circle cx="' + (w / 2 + sw * 2) + '" cy="' + (h / 2) + '" r="' + (sw * 0.9) + '" fill="' + ink + '"/>');
    return parts.join('');
  }

  function sideboard(w, h, fill, detail, ink) {
    var sw = Math.max(0.6, Math.min(w, h) * 0.018);
    var parts = [];
    parts.push(roundedRect(0, 0, w, h, Math.min(w, h) * 0.04, fill, ink, sw));
    for (var i = 1; i < 3; i += 1) {
      parts.push('<path d="M' + (w / 3) * i + ' ' + sw + 'V' + (h - sw) + '" stroke="' + detail + '" stroke-width="' + sw * 0.8 + '"/>');
    }
    [1, 3, 5].forEach(function (part) {
      parts.push('<circle cx="' + (w / 6) * part + '" cy="' + (h / 2) + '" r="' + (sw * 0.8) + '" fill="' + ink + '" opacity="0.8"/>');
    });
    return parts.join('');
  }

  function media(w, h, fill, detail, ink) {
    var sw = Math.max(0.6, Math.min(w, h) * 0.018);
    var parts = [];
    parts.push(roundedRect(0, 0, w, h, Math.min(w, h) * 0.05, fill, ink, sw));
    parts.push(roundedRect(w * 0.2, h * 0.18, w * 0.6, h * 0.14, sw * 0.6, ink));
    parts.push(roundedRect(w * 0.27, h * 0.6, w * 0.46, h * 0.12, sw * 0.5, detail));
    parts.push('<path d="M' + (w * 0.08) + ' ' + (h * 0.78) + 'H' + (w * 0.92) + '" stroke="' + detail + '" stroke-width="' + sw * 0.6 + '" opacity="0.8"/>');
    return parts.join('');
  }

  function bed(w, h, fill, detail, ink) {
    var sw = Math.max(0.6, Math.min(w, h) * 0.018);
    var radius = Math.min(w, h) * 0.045;
    var pillowY = h * 0.09;
    var pillowH = h * 0.14;
    var parts = [];
    parts.push(roundedRect(0, 0, w, h, radius, fill, ink, sw));
    parts.push(roundedRect(sw * 1.5, h * 0.33, w - sw * 3, h * 0.64, radius * 0.7, detail));
    parts.push('<path d="M' + (sw * 2) + ' ' + (h * 0.36) + 'H' + (w - sw * 2) + '" stroke="' + ink + '" stroke-width="' + sw * 0.55 + '" opacity="0.45"/>');

    if (w > h * 0.65) {
      parts.push(roundedRect(w * 0.1, pillowY, w * 0.36, pillowH, pillowH * 0.25, '#fbf8f1', detail, sw * 0.55));
      parts.push(roundedRect(w * 0.54, pillowY, w * 0.36, pillowH, pillowH * 0.25, '#fbf8f1', detail, sw * 0.55));
    } else {
      parts.push(roundedRect(w * 0.14, pillowY, w * 0.72, pillowH, pillowH * 0.25, '#fbf8f1', detail, sw * 0.55));
    }

    parts.push(roundedRect(w * 0.08, h * 0.72, w * 0.84, h * 0.2, sw * 0.7, shade(fill, 0.12), detail, sw * 0.55));
    return parts.join('');
  }

  function nightstand(w, h, fill, detail, ink) {
    var sw = Math.max(0.6, Math.min(w, h) * 0.018);
    var parts = [];
    parts.push(roundedRect(0, 0, w, h, Math.min(w, h) * 0.05, fill, ink, sw));
    parts.push('<path d="M' + sw + ' ' + (h * 0.56) + 'H' + (w - sw) + '" stroke="' + detail + '" stroke-width="' + sw * 0.8 + '"/>');
    parts.push('<circle cx="' + (w / 2) + '" cy="' + (h * 0.3) + '" r="' + (sw * 0.8) + '" fill="' + ink + '"/>');
    return parts.join('');
  }

  function dresser(w, h, fill, detail, ink) {
    var sw = Math.max(0.6, Math.min(w, h) * 0.018);
    var parts = [];
    parts.push(roundedRect(0, 0, w, h, Math.min(w, h) * 0.04, fill, ink, sw));
    [0.5].forEach(function (yRatio) {
      parts.push('<path d="M' + sw + ' ' + (h * yRatio) + 'H' + (w - sw) + '" stroke="' + detail + '" stroke-width="' + sw * 0.8 + '"/>');
    });
    [0.25, 0.75].forEach(function (yRatio) {
      [0.25, 0.75].forEach(function (xRatio) {
        parts.push('<circle cx="' + (w * xRatio) + '" cy="' + (h * yRatio) + '" r="' + (sw * 0.7) + '" fill="' + ink + '" opacity="0.75"/>');
      });
    });
    return parts.join('');
  }

  function island(w, h, fill, detail, ink) {
    var sw = Math.max(0.6, Math.min(w, h) * 0.018);
    var parts = [];
    parts.push(roundedRect(0, 0, w, h, Math.min(w, h) * 0.04, fill, ink, sw));
    parts.push(roundedRect(sw * 2, sw * 2, w - sw * 4, h - sw * 4, sw * 0.7, 'none', detail, sw * 0.7));

    parts.push('<ellipse cx="' + (w * 0.24) + '" cy="' + (h * 0.5) + '" rx="' + (w * 0.11) + '" ry="' + (h * 0.22) + '" fill="' + shade(fill, 0.35) + '" stroke="' + detail + '" stroke-width="' + sw * 0.7 + '"/>');
    parts.push('<path d="M' + (w * 0.24) + ' ' + (h * 0.2) + 'v' + (h * 0.08) + '" stroke="' + ink + '" stroke-width="' + sw * 1.1 + '" stroke-linecap="round"/>');

    [0.62, 0.78].forEach(function (xRatio) {
      [0.34, 0.66].forEach(function (yRatio) {
        parts.push('<circle cx="' + (w * xRatio) + '" cy="' + (h * yRatio) + '" r="' + (Math.min(w, h) * 0.075) + '" fill="none" stroke="' + ink + '" stroke-width="' + sw * 0.75 + '"/>');
      });
    });

    return parts.join('');
  }

  function counter(w, h, fill, detail, ink) {
    var sw = Math.max(0.6, Math.min(w, h) * 0.018);
    var parts = [];
    parts.push(roundedRect(0, 0, w, h, Math.min(w, h) * 0.03, fill, ink, sw));
    parts.push(roundedRect(sw * 2, sw * 2, w - sw * 4, h - sw * 4, sw * 0.6, 'none', detail, sw * 0.7));
    parts.push('<ellipse cx="' + (w * 0.18) + '" cy="' + (h * 0.5) + '" rx="' + (w * 0.07) + '" ry="' + (h * 0.22) + '" fill="' + shade(fill, 0.35) + '" stroke="' + detail + '" stroke-width="' + sw * 0.65 + '"/>');
    parts.push('<path d="M' + (w * 0.18) + ' ' + (h * 0.2) + 'v' + (h * 0.08) + '" stroke="' + ink + '" stroke-width="' + sw + '" stroke-linecap="round"/>');

    [0.55, 0.7, 0.85].forEach(function (xRatio) {
      parts.push('<circle cx="' + (w * xRatio) + '" cy="' + (h * 0.5) + '" r="' + (Math.min(w, h) * 0.12) + '" fill="none" stroke="' + ink + '" stroke-width="' + sw * 0.7 + '"/>');
    });

    return parts.join('');
  }

  function fridge(w, h, fill, detail, ink) {
    var sw = Math.max(0.6, Math.min(w, h) * 0.018);
    var parts = [];
    parts.push(roundedRect(0, 0, w, h, Math.min(w, h) * 0.06, fill, ink, sw));
    parts.push('<path d="M' + sw + ' ' + (h * 0.3) + 'H' + (w - sw) + '" stroke="' + detail + '" stroke-width="' + sw * 0.8 + '"/>');
    parts.push('<path d="M' + (w * 0.84) + ' ' + (h * 0.12) + 'v' + (h * 0.12) + 'M' + (w * 0.84) + ' ' + (h * 0.4) + 'v' + (h * 0.42) + '" stroke="' + ink + '" stroke-width="' + sw * 1.1 + '" stroke-linecap="round"/>');
    return parts.join('');
  }

  function cooktop(w, h, fill, detail, ink) {
    var sw = Math.max(0.6, Math.min(w, h) * 0.018);
    var parts = [];
    parts.push(roundedRect(0, 0, w, h, Math.min(w, h) * 0.04, fill, ink, sw));
    [0.3, 0.7].forEach(function (xRatio) {
      [0.3, 0.7].forEach(function (yRatio) {
        parts.push('<circle cx="' + (w * xRatio) + '" cy="' + (h * yRatio) + '" r="' + (Math.min(w, h) * 0.13) + '" fill="none" stroke="' + detail + '" stroke-width="' + sw * 0.9 + '"/>');
        parts.push('<circle cx="' + (w * xRatio) + '" cy="' + (h * yRatio) + '" r="' + (Math.min(w, h) * 0.04) + '" fill="' + detail + '"/>');
      });
    });
    parts.push('<path d="M' + (w * 0.32) + ' ' + (h * 0.92) + 'H' + (w * 0.68) + '" stroke="' + detail + '" stroke-width="' + sw * 0.8 + '" stroke-linecap="round"/>');
    return parts.join('');
  }

  function bathtub(w, h, fill, detail, ink) {
    var sw = Math.max(0.6, Math.min(w, h) * 0.018);
    var radius = Math.min(w, h) * 0.22;
    var parts = [];
    parts.push(roundedRect(0, 0, w, h, radius, fill, ink, sw));
    parts.push(roundedRect(sw * 2.5, sw * 2.5, w - sw * 5, h - sw * 5, radius * 0.8, shade(fill, 0.35), detail, sw * 0.7));
    parts.push('<circle cx="' + (w * 0.5) + '" cy="' + (h * 0.52) + '" r="' + (Math.min(w, h) * 0.06) + '" fill="none" stroke="' + detail + '" stroke-width="' + sw * 0.65 + '"/>');
    parts.push('<path d="M' + (w * 0.5) + ' ' + (h * 0.08) + 'v' + (h * 0.08) + '" stroke="' + ink + '" stroke-width="' + sw * 1.1 + '" stroke-linecap="round"/>');
    return parts.join('');
  }

  function shower(w, h, fill, detail, ink) {
    var sw = Math.max(0.6, Math.min(w, h) * 0.018);
    var parts = [];
    parts.push(roundedRect(0, 0, w, h, Math.min(w, h) * 0.02, fill, ink, sw));
    parts.push('<path d="M' + (w / 2) + ' 0V' + h + 'M0 ' + (h / 2) + 'H' + w + '" stroke="' + detail + '" stroke-width="' + sw * 0.6 + '" opacity="0.7"/>');
    parts.push('<circle cx="' + (w / 2) + '" cy="' + (h / 2) + '" r="' + (Math.min(w, h) * 0.06) + '" fill="none" stroke="' + detail + '" stroke-width="' + sw * 0.7 + '"/>');
    parts.push('<path d="M' + (w - sw * 1.5) + ' 0V' + h + '" stroke="' + ink + '" stroke-width="' + sw * 1.4 + '" opacity="0.55"/>');
    parts.push('<circle cx="' + (w * 0.2) + '" cy="' + (h * 0.2) + '" r="' + (Math.min(w, h) * 0.07) + '" fill="none" stroke="' + ink + '" stroke-width="' + sw * 0.7 + '"/>');
    return parts.join('');
  }

  function toilet(w, h, fill, detail, ink) {
    var sw = Math.max(0.6, Math.min(w, h) * 0.018);
    var parts = [];
    parts.push(roundedRect(w * 0.12, 0, w * 0.76, h * 0.28, sw * 0.6, fill, ink, sw));
    parts.push('<ellipse cx="' + (w / 2) + '" cy="' + (h * 0.63) + '" rx="' + (w * 0.4) + '" ry="' + (h * 0.29) + '" fill="' + fill + '" stroke="' + ink + '" stroke-width="' + sw + '"/>');
    parts.push('<ellipse cx="' + (w / 2) + '" cy="' + (h * 0.63) + '" rx="' + (w * 0.28) + '" ry="' + (h * 0.21) + '" fill="none" stroke="' + detail + '" stroke-width="' + sw * 0.7 + '"/>');
    parts.push('<circle cx="' + (w / 2) + '" cy="' + (h * 0.14) + '" r="' + (sw * 0.8) + '" fill="' + ink + '" opacity="0.7"/>');
    return parts.join('');
  }

  function vanity(w, h, fill, detail, ink) {
    var sw = Math.max(0.6, Math.min(w, h) * 0.018);
    var parts = [];
    parts.push(roundedRect(0, 0, w, h, Math.min(w, h) * 0.04, fill, ink, sw));
    parts.push('<ellipse cx="' + (w / 2) + '" cy="' + (h * 0.55) + '" rx="' + (w * 0.24) + '" ry="' + (h * 0.22) + '" fill="' + shade(fill, 0.32) + '" stroke="' + detail + '" stroke-width="' + sw * 0.7 + '"/>');
    parts.push('<path d="M' + (w / 2) + ' ' + (h * 0.2) + 'v' + (h * 0.08) + '" stroke="' + ink + '" stroke-width="' + sw + '" stroke-linecap="round"/>');
    parts.push('<path d="M' + (w * 0.1) + ' ' + (h * 0.9) + 'H' + (w * 0.9) + '" stroke="' + detail + '" stroke-width="' + sw * 0.6 + '" opacity="0.7"/>');
    return parts.join('');
  }

  function rug(w, h, fill, detail, ink) {
    var sw = Math.max(0.6, Math.min(w, h) * 0.018);
    var parts = [];
    parts.push(roundedRect(0, 0, w, h, Math.min(w, h) * 0.02, fill, ink, sw));
    parts.push(roundedRect(sw * 3, sw * 3, w - sw * 6, h - sw * 6, 0, 'none', detail, sw * 0.7));
    parts.push(roundedRect(sw * 6, sw * 6, w - sw * 12, h - sw * 12, 0, 'none', detail, sw * 0.5, 'stroke-dasharray="' + (sw * 3) + ' ' + (sw * 2) + '"'));
    for (var i = 1; i < 4; i += 1) {
      parts.push('<path d="M' + (w * i / 4) + ' ' + (sw * 8) + 'V' + (h - sw * 8) + '" stroke="' + detail + '" stroke-width="' + sw * 0.45 + '" opacity="0.55"/>');
    }
    return parts.join('');
  }

  function plant(w, h, fill, detail, ink) {
    var sw = Math.max(0.6, Math.min(w, h) * 0.018);
    var cx = w / 2;
    var cy = h / 2;
    var radius = Math.min(w, h) * 0.24;
    var parts = [];
    parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + radius + '" fill="' + shade(fill, -0.08) + '" stroke="' + ink + '" stroke-width="' + sw + '"/>');
    parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + (radius * 0.45) + '" fill="' + shade(fill, 0.2) + '"/>');

    for (var i = 0; i < 6; i += 1) {
      var angle = (Math.PI * 2 / 6) * i - Math.PI / 2;
      var leafX = cx + Math.cos(angle) * radius * 0.95;
      var leafY = cy + Math.sin(angle) * radius * 0.95;
      parts.push('<ellipse cx="' + leafX + '" cy="' + leafY + '" rx="' + (radius * 0.55) + '" ry="' + (radius * 0.24) + '" transform="rotate(' + (angle * 180 / Math.PI) + ' ' + leafX + ' ' + leafY + ')" fill="' + fill + '" opacity="0.9"/>');
    }

    return parts.join('');
  }

  function lamp(w, h, fill, detail, ink) {
    var sw = Math.max(0.6, Math.min(w, h) * 0.018);
    var cx = w / 2;
    var cy = h / 2;
    var radius = Math.min(w, h) * 0.42;
    var parts = [];
    parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + radius + '" fill="' + fill + '" stroke="' + ink + '" stroke-width="' + sw + '"/>');
    parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + (radius * 0.62) + '" fill="none" stroke="' + shade(fill, 0.32) + '" stroke-width="' + sw * 0.8 + '"/>');
    parts.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + (radius * 0.16) + '" fill="' + shade(fill, 0.32) + '"/>');
    return parts.join('');
  }

  function shapeMarkup(shape, w, h, fill, detail, ink) {
    switch (shape) {
      case 'sofa':
        return upholstered(w, h, fill, detail, ink, 3, true);
      case 'armchair':
        return upholstered(w, h, fill, detail, ink, 1, true);
      case 'chair':
        return chair(w, h, fill, detail, ink);
      case 'bench':
        return bench(w, h, fill, detail, ink);
      case 'ottoman':
        return ottoman(w, h, fill, detail, ink);
      case 'table':
        return table(w, h, fill, detail, ink);
      case 'round-table':
        return roundTable(w, h, fill, detail, ink);
      case 'desk':
        return desk(w, h, fill, detail, ink);
      case 'shelf':
        return shelf(w, h, fill, detail, ink);
      case 'wardrobe':
        return wardrobe(w, h, fill, detail, ink);
      case 'sideboard':
        return sideboard(w, h, fill, detail, ink);
      case 'media':
        return media(w, h, fill, detail, ink);
      case 'bed':
        return bed(w, h, fill, detail, ink);
      case 'nightstand':
        return nightstand(w, h, fill, detail, ink);
      case 'dresser':
        return dresser(w, h, fill, detail, ink);
      case 'island':
        return island(w, h, fill, detail, ink);
      case 'counter':
        return counter(w, h, fill, detail, ink);
      case 'fridge':
        return fridge(w, h, fill, detail, ink);
      case 'cooktop':
        return cooktop(w, h, fill, detail, ink);
      case 'bathtub':
        return bathtub(w, h, fill, detail, ink);
      case 'shower':
        return shower(w, h, fill, detail, ink);
      case 'toilet':
        return toilet(w, h, fill, detail, ink);
      case 'vanity':
        return vanity(w, h, fill, detail, ink);
      case 'rug':
        return rug(w, h, fill, detail, ink);
      case 'plant':
        return plant(w, h, fill, detail, ink);
      case 'lamp':
        return lamp(w, h, fill, detail, ink);
      default:
        return roundedRect(0, 0, w, h, Math.min(w, h) * 0.08, fill, ink, Math.max(0.6, Math.min(w, h) * 0.018));
    }
  }

  /**
   * Render a furniture piece into a local 0,0 → width,height box.
   * The caller applies position and rotation.
   */
  function renderTopView(item, width, height, color) {
    var w = Math.max(0.1, number(width, item.widthCm));
    var h = Math.max(0.1, number(height, item.depthCm));
    var fill = color || item.color || '#d5d1c7';
    var detail = shade(fill, -0.16);
    var ink = shade(fill, -0.42);
    return shapeMarkup(item.shape, w, h, fill, detail, ink);
  }

  function icon(item) {
    var maxWidth = 44;
    var maxHeight = 30;
    var scale = Math.min(maxWidth / item.widthCm, maxHeight / item.depthCm);
    var width = item.widthCm * scale;
    var height = item.depthCm * scale;
    var x = (48 - width) / 2;
    var y = (36 - height) / 2;

    return (
      '<svg viewBox="0 0 48 36" aria-hidden="true" focusable="false">' +
      '<g transform="translate(' + x + ' ' + y + ')">' +
      renderTopView(item, width, height, item.color) +
      '</g></svg>'
    );
  }

  NS.furniture = {
    CATEGORIES: CATEGORIES,
    ITEMS: ITEMS,
    getItem: getItem,
    shade: shade,
    renderTopView: renderTopView,
    icon: icon
  };
})();
