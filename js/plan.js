/* ==========================================================================
   Roomify — Generated SVG floor plans
   Used by the dashboard, template cards and the editor preview.
   ========================================================================== */

(function () {
  'use strict';

  var NS = (window.Roomify = window.Roomify || {});

  function escapeXml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function number(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function hintMarkup(typeId, x, y, w, h) {
    var stroke = '#6f806b';
    var dash = 'stroke-dasharray="4 5" stroke-width="1.1" fill="none" opacity="0.62"';
    var parts = [];
    var cx = x + w / 2;
    var cy = y + h / 2;

    if (typeId === 'bedroom') {
      parts.push(
        '<rect x="' + (x + w * 0.09) + '" y="' + (y + h * 0.09) + '" width="' + w * 0.4 + '" height="' + h * 0.46 + '" ' + dash + ' stroke="' + stroke + '"/>'
      );
      parts.push(
        '<path d="M' + (x + w * 0.14) + ' ' + (y + h * 0.2) + 'h' + w * 0.12 + 'M' + (x + w * 0.31) + ' ' + (y + h * 0.2) + 'h' + w * 0.12 + '" ' + dash + ' stroke="' + stroke + '"/>'
      );
      parts.push(
        '<rect x="' + (x + w * 0.54) + '" y="' + (y + h * 0.09) + '" width="' + w * 0.13 + '" height="' + h * 0.09 + '" ' + dash + ' stroke="' + stroke + '"/>'
      );
      parts.push(
        '<rect x="' + (x + w * 0.7) + '" y="' + (y + h * 0.4) + '" width="' + w * 0.2 + '" height="' + h * 0.47 + '" ' + dash + ' stroke="' + stroke + '"/>'
      );
    } else if (typeId === 'living') {
      parts.push(
        '<rect x="' + (x + w * 0.55) + '" y="' + (y + h * 0.12) + '" width="' + w * 0.32 + '" height="' + h * 0.16 + '" ' + dash + ' stroke="' + stroke + '"/>'
      );
      parts.push(
        '<rect x="' + (x + w * 0.11) + '" y="' + (y + h * 0.5) + '" width="' + w * 0.3 + '" height="' + h * 0.3 + '" ' + dash + ' stroke="' + stroke + '"/>'
      );
      parts.push(
        '<circle cx="' + (cx - w * 0.02) + '" cy="' + (cy + h * 0.12) + '" r="' + Math.min(w, h) * 0.12 + '" ' + dash + ' stroke="' + stroke + '"/>'
      );
      parts.push(
        '<rect x="' + (x + w * 0.06) + '" y="' + (y + h * 0.08) + '" width="' + w * 0.25 + '" height="' + h * 0.18 + '" ' + dash + ' stroke="' + stroke + '"/>'
      );
    } else if (typeId === 'kitchen') {
      parts.push(
        '<path d="M' + (x + w * 0.08) + ' ' + (y + h * 0.12) + 'h' + w * 0.84 + 'v' + h * 0.12 + 'H' + (x + w * 0.08) + 'Z" ' + dash + ' stroke="' + stroke + '"/>'
      );
      parts.push(
        '<rect x="' + (x + w * 0.42) + '" y="' + (y + h * 0.44) + '" width="' + w * 0.36 + '" height="' + h * 0.18 + '" ' + dash + ' stroke="' + stroke + '"/>'
      );
      parts.push(
        '<circle cx="' + (x + w * 0.26) + '" cy="' + (y + h * 0.18) + '" r="' + Math.min(w, h) * 0.055 + '" ' + dash + ' stroke="' + stroke + '"/>'
      );
      parts.push(
        '<circle cx="' + (x + w * 0.7) + '" cy="' + (y + h * 0.18) + '" r="' + Math.min(w, h) * 0.05 + '" ' + dash + ' stroke="' + stroke + '"/>'
      );
    } else if (typeId === 'workspace') {
      parts.push(
        '<rect x="' + (x + w * 0.16) + '" y="' + (y + h * 0.12) + '" width="' + w * 0.52 + '" height="' + h * 0.2 + '" ' + dash + ' stroke="' + stroke + '"/>'
      );
      parts.push(
        '<circle cx="' + (x + w * 0.42) + '" cy="' + (y + h * 0.47) + '" r="' + Math.min(w, h) * 0.09 + '" ' + dash + ' stroke="' + stroke + '"/>'
      );
      parts.push(
        '<rect x="' + (x + w * 0.76) + '" y="' + (y + h * 0.5) + '" width="' + w * 0.13 + '" height="' + h * 0.34 + '" ' + dash + ' stroke="' + stroke + '"/>'
      );
      parts.push(
        '<circle cx="' + (x + w * 0.2) + '" cy="' + (y + h * 0.7) + '" r="' + Math.min(w, h) * 0.08 + '" ' + dash + ' stroke="' + stroke + '"/>'
      );
    } else if (typeId === 'dining') {
      parts.push(
        '<rect x="' + (x + w * 0.26) + '" y="' + (y + h * 0.3) + '" width="' + w * 0.48 + '" height="' + h * 0.36 + '" ' + dash + ' stroke="' + stroke + '"/>'
      );
      [-1, 1].forEach(function (side) {
        parts.push(
          '<rect x="' + (x + w * 0.32) + '" y="' + (y + h * (side < 0 ? 0.18 : 0.68)) + '" width="' + w * 0.12 + '" height="' + h * 0.09 + '" ' + dash + ' stroke="' + stroke + '"/>'
        );
        parts.push(
          '<rect x="' + (x + w * 0.56) + '" y="' + (y + h * (side < 0 ? 0.18 : 0.68)) + '" width="' + w * 0.12 + '" height="' + h * 0.09 + '" ' + dash + ' stroke="' + stroke + '"/>'
        );
      });
    } else if (typeId === 'bathroom') {
      parts.push(
        '<rect x="' + (x + w * 0.08) + '" y="' + (y + h * 0.1) + '" width="' + w * 0.42 + '" height="' + h * 0.24 + '" rx="' + Math.min(w, h) * 0.07 + '" ' + dash + ' stroke="' + stroke + '"/>'
      );
      parts.push(
        '<circle cx="' + (x + w * 0.2) + '" cy="' + (y + h * 0.68) + '" r="' + Math.min(w, h) * 0.1 + '" ' + dash + ' stroke="' + stroke + '"/>'
      );
      parts.push(
        '<rect x="' + (x + w * 0.55) + '" y="' + (y + h * 0.52) + '" width="' + w * 0.34 + '" height="' + h * 0.34 + '" ' + dash + ' stroke="' + stroke + '"/>'
      );
    } else if (typeId === 'blank') {
      parts.push(
        '<path d="M' + (cx - 8) + ' ' + cy + 'h16M' + cx + ' ' + (cy - 8) + 'v16" stroke="' + stroke + '" stroke-width="1" opacity="0.4"/>'
      );
    }

    return parts.join('');
  }

  /**
   * Render a project's room as an inline SVG.
   * @param {object} project
   * @param {{detail?: boolean, hints?: boolean, className?: string}} [options]
   * @returns {string}
   */
  function render(project, options) {
    var settings = options || {};
    var detail = Boolean(settings.detail);
    var showHints = Boolean(settings.hints);
    var typeInfo = NS.catalog.getRoomType(project && project.type);
    var room = (project && project.room) || {};
    var floor = NS.catalog.getFloor(room.floor);

    var widthCm = number(room.widthCm, typeInfo ? typeInfo.widthCm : 400);
    var heightCm = number(room.heightCm, typeInfo ? typeInfo.heightCm : 500);
    var roomLabel = typeInfo ? typeInfo.label : 'Room';

    var viewWidth = detail ? 740 : 400;
    var viewHeight = detail ? 520 : 300;
    var margins = detail
      ? { top: 72, right: 76, bottom: 56, left: 76 }
      : { top: 34, right: 24, bottom: 24, left: 42 };

    var availableWidth = viewWidth - margins.left - margins.right;
    var availableHeight = viewHeight - margins.top - margins.bottom;
    var scale = Math.min(availableWidth / widthCm, availableHeight / heightCm);
    var roomWidth = widthCm * scale;
    var roomHeight = heightCm * scale;
    var x = margins.left + (availableWidth - roomWidth) / 2;
    var y = margins.top + (availableHeight - roomHeight) / 2;

    var wall = detail ? 7 : 3.5;
    var dimColor = '#8a8d85';
    var labelSize = detail ? 11 : 8.6;
    var dimTop = y - (detail ? 30 : 17);
    var dimLeft = x - (detail ? 30 : 17);

    var parts = [];
    parts.push(
      '<svg viewBox="0 0 ' + viewWidth + ' ' + viewHeight + '" role="img" aria-label="' +
      escapeXml(roomLabel + ' floor plan, ' + widthCm + ' by ' + heightCm + ' centimeters') +
      '"' + (settings.className ? ' class="' + escapeXml(settings.className) + '"' : '') + '>'
    );
    parts.push('<title>' + escapeXml(roomLabel + ' plan') + '</title>');

    // A quiet offset shadow beneath the room.
    parts.push(
      '<rect x="' + (x + 2) + '" y="' + (y + 3) + '" width="' + roomWidth + '" height="' + roomHeight +
      '" fill="#292b2a" opacity="0.06"/>'
    );

    // Floor, grain and walls.
    parts.push(
      '<rect x="' + x + '" y="' + y + '" width="' + roomWidth + '" height="' + roomHeight +
      '" fill="' + floor.color + '"/>'
    );

    var grainGap = detail ? 17 : 11;
    var grainX = x + wall / 2;
    var grainEnd = x + roomWidth - wall / 2;
    var grainY = y + grainGap;
    var grainOpacity = detail ? 0.28 : 0.2;
    while (grainY < y + roomHeight - wall / 2) {
      parts.push(
        '<path d="M' + grainX + ' ' + grainY + 'H' + grainEnd +
        '" stroke="' + floor.grain + '" stroke-width="0.7" opacity="' + grainOpacity + '"/>'
      );
      grainY += grainGap;
    }

    parts.push(
      '<rect x="' + x + '" y="' + y + '" width="' + roomWidth + '" height="' + roomHeight +
      '" fill="none" stroke="#3a3d39" stroke-width="' + wall + '"/>'
    );

    // Dimensions.
    parts.push(
      '<g stroke="' + dimColor + '" stroke-width="' + (detail ? 0.9 : 0.75) + '" fill="none">' +
      '<path d="M' + x + ' ' + (dimTop - 4) + 'v8M' + (x + roomWidth) + ' ' + (dimTop - 4) + 'v8"/>' +
      '<path d="M' + x + ' ' + dimTop + 'H' + (x + roomWidth) + '"/>' +
      '<path d="M' + (dimLeft - 4) + ' ' + y + 'h8M' + (dimLeft - 4) + ' ' + (y + roomHeight) + 'h8"/>' +
      '<path d="M' + dimLeft + ' ' + y + 'V' + (y + roomHeight) + '"/>' +
      '</g>'
    );

    parts.push(
      '<text x="' + (x + roomWidth / 2) + '" y="' + (dimTop - (detail ? 11 : 6)) +
      '" text-anchor="middle" font-family="DM Sans, Arial, sans-serif" font-size="' + labelSize +
      '" letter-spacing="0.05em" fill="' + dimColor + '">' + widthCm + ' cm</text>'
    );

    parts.push(
      '<text transform="translate(' + (dimLeft - (detail ? 11 : 7)) + ' ' + (y + roomHeight / 2) +
      ') rotate(-90)" text-anchor="middle" font-family="DM Sans, Arial, sans-serif" font-size="' + labelSize +
      '" letter-spacing="0.05em" fill="' + dimColor + '">' + heightCm + ' cm</text>'
    );

    if (showHints) {
      parts.push('<g>' + hintMarkup(project && project.type, x, y, roomWidth, roomHeight) + '</g>');
    }

    if (detail) {
      var centerX = x + roomWidth / 2;
      var centerY = y + roomHeight / 2;
      parts.push(
        '<g opacity="0.55">' +
        '<circle cx="' + centerX + '" cy="' + centerY + '" r="17" fill="none" stroke="#6f806b" stroke-width="0.9" stroke-dasharray="3 4"/>' +
        '<path d="M' + (centerX - 7) + ' ' + centerY + 'h14M' + centerX + ' ' + (centerY - 7) + 'v14" stroke="#6f806b" stroke-width="0.9"/>' +
        '<text x="' + centerX + '" y="' + (centerY + 37) + '" text-anchor="middle" font-family="DM Sans, Arial, sans-serif" font-size="9" letter-spacing="0.14em" fill="#6f806b">EMPTY PLAN</text>' +
        '</g>'
      );
    }

    // A small north mark on detailed plans.
    if (detail) {
      parts.push(
        '<g transform="translate(' + (viewWidth - 40) + ' 44)" opacity="0.7">' +
        '<path d="M0 18V0" stroke="' + dimColor + '" stroke-width="0.9"/>' +
        '<path d="M0 0 5 10H-5Z" fill="none" stroke="' + dimColor + '" stroke-width="0.9"/>' +
        '<text x="0" y="30" text-anchor="middle" font-family="DM Sans, Arial, sans-serif" font-size="8.5" letter-spacing="0.1em" fill="' + dimColor + '">N</text>' +
        '</g>'
      );
    }

    parts.push('</svg>');
    return parts.join('');
  }

  NS.plan = { render: render };
})();
