/* ==========================================================================
   Roomify — Interactive room editor
   A measured SVG plan with a furniture catalogue, direct manipulation,
   properties, undo/redo and debounced autosave to localStorage.
   ========================================================================== */

(function () {
  'use strict';

  var NS = window.Roomify || {};

  if (!NS.catalog || !NS.storage || !NS.ui || !NS.furniture) {
    console.error('[Roomify] Editor dependencies are missing.');
    return;
  }

  var catalog = NS.catalog;
  var storage = NS.storage;
  var ui = NS.ui;
  var furniture = NS.furniture;

  var MIN_ROOM = 150;
  var MAX_ROOM = 1500;
  var MIN_OBJECT = 20;
  var MAX_OBJECT = 600;
  var GRID = 5;
  var WALL_SNAP = 8;
  var HISTORY_LIMIT = 60;
  var SAVE_DELAY = 800;
  var NUDGE_DELAY = 500;

  var COLOR_PALETTE = [
    '#879783',
    '#b97961',
    '#c9a978',
    '#c8a087',
    '#9a7b58',
    '#3f423e',
    '#d5d1c7',
    '#f5f1e8'
  ];

  var mobileQuery = window.matchMedia('(max-width: 1020px)');

  var elements = {
    content: document.querySelector('[data-editor-content]'),
    missing: document.querySelector('[data-editor-missing]'),
    missingMessage: document.querySelector('[data-missing-message]'),
    crumb: document.querySelector('[data-crumb-current]'),
    saveState: document.querySelector('[data-save-state]'),
    saveText: document.querySelector('[data-save-text]'),
    saveInline: document.querySelector('[data-save-inline]'),
    board: document.querySelector('[data-board]'),
    boardWrap: document.querySelector('[data-board-wrap]'),
    boardEmpty: document.querySelector('[data-board-empty]'),
    stageName: document.querySelector('[data-stage-name]'),
    stageDims: document.querySelector('[data-stage-dims]'),
    selectionSummary: document.querySelector('[data-selection-summary]'),
    catalogPanel: document.querySelector('[data-catalog-panel]'),
    catalogToggle: document.querySelector('[data-catalog-toggle]'),
    catalogClose: document.querySelector('[data-catalog-close]'),
    catalogBackdrop: document.querySelector('[data-catalog-backdrop]'),
    catalogSearch: document.querySelector('[data-catalog-search]'),
    catalogFilters: document.querySelector('[data-catalog-filters]'),
    catalogList: document.querySelector('[data-catalog-list]'),
    catalogEmpty: document.querySelector('[data-catalog-empty]'),
    roomProps: document.querySelector('[data-room-props]'),
    objectProps: document.querySelector('[data-object-props]'),
    propsRoomName: document.querySelector('[data-props-room-name]'),
    propsRoomType: document.querySelector('[data-props-room-type]'),
    propsDims: document.querySelector('[data-props-dims]'),
    propsArea: document.querySelector('[data-props-area]'),
    propsFloor: document.querySelector('[data-props-floor]'),
    propsPieces: document.querySelector('[data-props-pieces]'),
    propsUpdated: document.querySelector('[data-props-updated]'),
    objectName: document.querySelector('[data-object-name]'),
    objectThumb: document.querySelector('[data-object-thumb]'),
    objectX: document.querySelector('[data-object-x]'),
    objectY: document.querySelector('[data-object-y]'),
    objectWidth: document.querySelector('[data-object-width]'),
    objectDepth: document.querySelector('[data-object-depth]'),
    objectRotation: document.querySelector('[data-object-rotation]'),
    colorRow: document.querySelector('[data-color-row]'),
    duplicate: document.querySelector('[data-duplicate]'),
    deleteObject: document.querySelector('[data-delete-object]'),
    undo: document.querySelector('[data-undo]'),
    redo: document.querySelector('[data-redo]'),
    snap: document.querySelector('[data-snap]'),
    zoomIn: document.querySelector('[data-zoom-in]'),
    zoomOut: document.querySelector('[data-zoom-out]'),
    zoomFit: document.querySelector('[data-zoom-fit]'),
    roomSettingsButtons: Array.prototype.slice.call(document.querySelectorAll('[data-room-settings]')),
    roomDialog: document.getElementById('room-settings-dialog'),
    roomForm: document.querySelector('[data-room-form]'),
    roomNameInput: document.querySelector('[data-room-name-input]'),
    roomWidthInput: document.querySelector('[data-room-width]'),
    roomHeightInput: document.querySelector('[data-room-height]'),
    roomFloorGroup: document.querySelector('[data-room-floor-group]'),
    roomError: document.querySelector('[data-room-error]')
  };

  var state = {
    project: null,
    name: '',
    room: { widthCm: 400, heightCm: 500, floor: 'oak', wall: 'ivory' },
    objects: [],
    selectedId: null,
    snap: true,
    zoom: 1,
    view: { x: 0, y: 0, w: 0, h: 0 },
    baseView: { x: 0, y: 0, w: 0, h: 0 },
    history: [],
    historyIndex: -1,
    dirty: false,
    saveStatus: 'saved',
    saveTimer: null,
    retryTimer: null,
    saveErrorShown: false,
    nudgeTimer: null,
    catalogOpen: false,
    category: 'all',
    search: '',
    drag: null,
    canvasFrame: null
  };

  /* Helpers --------------------------------------------------------------- */

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function round(value, decimals) {
    var power = Math.pow(10, decimals || 0);
    return Math.round(value * power) / power;
  }

  function formatCm(value) {
    var rounded = round(value, 1);
    return String(rounded);
  }

  function normalizeAngle(value) {
    var angle = Number(value);
    if (!Number.isFinite(angle)) return 0;
    angle = angle % 360;
    if (angle < 0) angle += 360;
    return round(angle, 1);
  }

  function cleanName(value) {
    var name = String(value || '').trim().replace(/\s+/g, ' ');
    return name ? name.slice(0, 80) : 'Untitled room';
  }

  function formatArea(widthCm, heightCm) {
    var area = catalog.areaM2(widthCm, heightCm);
    return (Math.round(area * 10) / 10).toFixed(1).replace(/\.0$/, '');
  }

  function pieceLabel(count) {
    return count + (count === 1 ? ' piece' : ' pieces');
  }

  function cloneObject(object) {
    return {
      id: object.id,
      catalogId: object.catalogId,
      name: object.name,
      x: object.x,
      y: object.y,
      widthCm: object.widthCm,
      depthCm: object.depthCm,
      rotation: object.rotation,
      color: object.color
    };
  }

  function snapshot() {
    return {
      name: state.name,
      room: {
        widthCm: state.room.widthCm,
        heightCm: state.room.heightCm,
        floor: state.room.floor,
        wall: state.room.wall
      },
      objects: state.objects.map(cloneObject)
    };
  }

  function getSelected() {
    if (!state.selectedId) return null;
    for (var i = 0; i < state.objects.length; i += 1) {
      if (state.objects[i].id === state.selectedId) return state.objects[i];
    }
    return null;
  }

  function getObject(id) {
    for (var i = 0; i < state.objects.length; i += 1) {
      if (state.objects[i].id === id) return state.objects[i];
    }
    return null;
  }

  function createObjectId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return 'rmo-' + window.crypto.randomUUID();
    }
    return 'rmo-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  }

  function objectItem(object) {
    var item = furniture.getItem(object.catalogId);
    if (item) return item;
    return {
      id: object.catalogId || 'custom',
      name: object.name,
      shape: 'rect',
      widthCm: object.widthCm,
      depthCm: object.depthCm,
      color: object.color || '#d5d1c7'
    };
  }

  function rotatedFootprint(widthCm, depthCm, rotation) {
    var radians = (rotation * Math.PI) / 180;
    var cos = Math.abs(Math.cos(radians));
    var sin = Math.abs(Math.sin(radians));
    return {
      width: widthCm * cos + depthCm * sin,
      height: widthCm * sin + depthCm * cos
    };
  }

  function rotatedExtents(object) {
    var footprint = rotatedFootprint(object.widthCm, object.depthCm, object.rotation);
    return {
      hx: footprint.width / 2,
      hy: footprint.height / 2
    };
  }

  /**
   * Position of the rotated footprint's top-left corner. Always inside
   * the room, so the properties panel never shows confusing negatives.
   */
  function objectPosition(object) {
    var extents = rotatedExtents(object);
    var centerX = object.x + object.widthCm / 2;
    var centerY = object.y + object.depthCm / 2;

    return {
      x: centerX - extents.hx,
      y: centerY - extents.hy,
      centerX: centerX,
      centerY: centerY,
      hx: extents.hx,
      hy: extents.hy
    };
  }

  function footprintFits(widthCm, depthCm, rotation) {
    var footprint = rotatedFootprint(widthCm, depthCm, rotation);
    return footprint.width <= state.room.widthCm + 0.01 &&
      footprint.height <= state.room.heightCm + 0.01;
  }

  function fitsAt(object, rotation) {
    return footprintFits(object.widthCm, object.depthCm, rotation);
  }

  /**
   * Largest width this piece can use at the current depth and rotation.
   */
  function maxWidthFor(depthCm, rotation) {
    var radians = (rotation * Math.PI) / 180;
    var cos = Math.abs(Math.cos(radians));
    var sin = Math.abs(Math.sin(radians));
    var limits = [];

    if (cos > 0.000001) {
      limits.push((state.room.widthCm - depthCm * sin) / cos);
    } else if (depthCm * sin > state.room.widthCm + 0.01) {
      return MIN_OBJECT - 1;
    }

    if (sin > 0.000001) {
      limits.push((state.room.heightCm - depthCm * cos) / sin);
    } else if (depthCm * cos > state.room.heightCm + 0.01) {
      return MIN_OBJECT - 1;
    }

    return limits.length ? Math.min.apply(null, limits) : MAX_OBJECT;
  }

  /**
   * Largest depth this piece can use at the current width and rotation.
   */
  function maxDepthFor(widthCm, rotation) {
    var radians = (rotation * Math.PI) / 180;
    var cos = Math.abs(Math.cos(radians));
    var sin = Math.abs(Math.sin(radians));
    var limits = [];

    if (sin > 0.000001) {
      limits.push((state.room.widthCm - widthCm * cos) / sin);
    } else if (widthCm * cos > state.room.widthCm + 0.01) {
      return MIN_OBJECT - 1;
    }

    if (cos > 0.000001) {
      limits.push((state.room.heightCm - widthCm * sin) / cos);
    } else if (widthCm * sin > state.room.heightCm + 0.01) {
      return MIN_OBJECT - 1;
    }

    return limits.length ? Math.min.apply(null, limits) : MAX_OBJECT;
  }

  /**
   * Keep the rotated footprint inside the room and write x/y back.
   */
  function placeCenter(object, cx, cy, useSnap) {
    var extents = rotatedExtents(object);
    var roomWidth = state.room.widthCm;
    var roomHeight = state.room.heightCm;

    if (useSnap) {
      cx = Math.round((cx - object.widthCm / 2) / GRID) * GRID + object.widthCm / 2;
      cy = Math.round((cy - object.depthCm / 2) / GRID) * GRID + object.depthCm / 2;

      if (extents.hx * 2 <= roomWidth) {
        if (Math.abs(cx - extents.hx) < WALL_SNAP) {
          cx = extents.hx;
        } else if (Math.abs(roomWidth - (cx + extents.hx)) < WALL_SNAP) {
          cx = roomWidth - extents.hx;
        }
      }

      if (extents.hy * 2 <= roomHeight) {
        if (Math.abs(cy - extents.hy) < WALL_SNAP) {
          cy = extents.hy;
        } else if (Math.abs(roomHeight - (cy + extents.hy)) < WALL_SNAP) {
          cy = roomHeight - extents.hy;
        }
      }
    }

    if (extents.hx * 2 >= roomWidth) {
      cx = roomWidth / 2;
    } else {
      cx = clamp(cx, extents.hx, roomWidth - extents.hx);
    }

    if (extents.hy * 2 >= roomHeight) {
      cy = roomHeight / 2;
    } else {
      cy = clamp(cy, extents.hy, roomHeight - extents.hy);
    }

    object.x = round(cx - object.widthCm / 2, 1);
    object.y = round(cy - object.depthCm / 2, 1);
  }

  /**
   * Shrink a piece so its rotated footprint fits the current room.
   * Returns true when the dimensions had to change.
   */
  function fitObjectInRoom(object) {
    var changed = false;
    var nextWidth = clamp(Math.round(object.widthCm), MIN_OBJECT, Math.min(MAX_OBJECT, state.room.widthCm));
    var nextDepth = clamp(Math.round(object.depthCm), MIN_OBJECT, Math.min(MAX_OBJECT, state.room.heightCm));

    if (nextWidth !== object.widthCm || nextDepth !== object.depthCm) {
      changed = true;
    }

    object.widthCm = nextWidth;
    object.depthCm = nextDepth;

    var footprint = rotatedFootprint(object.widthCm, object.depthCm, object.rotation);
    var scale = Math.min(
      state.room.widthCm / footprint.width,
      state.room.heightCm / footprint.height,
      1
    );

    if (scale < 1) {
      var scaledWidth = Math.max(MIN_OBJECT, Math.floor(object.widthCm * scale));
      var scaledDepth = Math.max(MIN_OBJECT, Math.floor(object.depthCm * scale));
      var guard = 0;

      while (guard < 1200) {
        footprint = rotatedFootprint(scaledWidth, scaledDepth, object.rotation);
        if (footprint.width <= state.room.widthCm + 0.01 &&
            footprint.height <= state.room.heightCm + 0.01) {
          break;
        }

        if (scaledWidth <= MIN_OBJECT && scaledDepth <= MIN_OBJECT) break;

        if (scaledWidth >= scaledDepth && scaledWidth > MIN_OBJECT) {
          scaledWidth -= 1;
        } else if (scaledDepth > MIN_OBJECT) {
          scaledDepth -= 1;
        } else if (scaledWidth > MIN_OBJECT) {
          scaledWidth -= 1;
        }

        guard += 1;
      }

      if (scaledWidth !== object.widthCm || scaledDepth !== object.depthCm) {
        changed = true;
      }

      object.widthCm = scaledWidth;
      object.depthCm = scaledDepth;
    }

    return changed;
  }

  /* Save status ----------------------------------------------------------- */

  var SAVE_LABELS = {
    saved: 'Saved locally',
    saving: 'Saving…',
    dirty: 'Unsaved changes',
    error: 'Couldn’t save'
  };

  function setSaveStatus(status) {
    state.saveStatus = status;

    if (elements.saveText) elements.saveText.textContent = SAVE_LABELS[status] || SAVE_LABELS.saved;
    if (elements.saveState) {
      elements.saveState.className = 'save-state' + (status === 'saved' ? '' : ' save-state--' + status);
      elements.saveState.title = status === 'error'
        ? 'Your latest changes could not be saved. Roomify will retry when you make another change.'
        : status === 'saved'
          ? 'Every change is saved in this browser.'
          : '';
    }
    if (elements.saveInline) {
      elements.saveInline.textContent = status === 'saved' ? 'Saved' : (SAVE_LABELS[status] || 'Saved');
      elements.saveInline.className = 'editor-save-inline' + (status === 'saved' ? '' : ' editor-save-inline--' + status);
    }
  }

  function markDirty() {
    state.dirty = true;
    setSaveStatus('dirty');

    if (state.saveTimer) window.clearTimeout(state.saveTimer);
    if (state.retryTimer) {
      window.clearTimeout(state.retryTimer);
      state.retryTimer = null;
    }

    state.saveTimer = window.setTimeout(saveNow, SAVE_DELAY);
  }

  function saveNow() {
    state.saveTimer = null;

    if (!state.project || !state.dirty) return;

    if (!storage.isAvailable() || storage.hasLoadError()) {
      setSaveStatus('error');
      if (!state.saveErrorShown) {
        state.saveErrorShown = true;
        ui.toast('This browser is not allowing Roomify to save. Allow site data and try again.', {
          type: 'error',
          duration: 5200
        });
      }
      return;
    }

    setSaveStatus('saving');

    try {
      var updated = storage.updateProject(state.project.id, {
        name: state.name,
        room: state.room,
        objects: state.objects
      });

      if (!updated) {
        throw new Error('This room is no longer in your studio.');
      }

      state.project = updated;
      state.dirty = false;
      state.saveErrorShown = false;
      setSaveStatus('saved');
      updateUpdatedLabel();
    } catch (error) {
      console.warn('[Roomify] The room could not be saved.', error);
      setSaveStatus('error');

      if (!state.saveErrorShown) {
        state.saveErrorShown = true;
        ui.toast(
          error && error.message ? error.message : 'The room could not be saved. Roomify will retry shortly.',
          { type: 'error', duration: 5200 }
        );
      }

      if (state.retryTimer) window.clearTimeout(state.retryTimer);
      state.retryTimer = window.setTimeout(saveNow, 5000);
    }
  }

  function flushSave() {
    if (state.saveTimer) {
      window.clearTimeout(state.saveTimer);
      state.saveTimer = null;
    }

    if (!state.project || !state.dirty) return;

    try {
      storage.updateProject(state.project.id, {
        name: state.name,
        room: state.room,
        objects: state.objects
      });
      state.dirty = false;
    } catch (error) {
      /* A page that is closing cannot recover from a failed save. */
    }
  }

  /* History --------------------------------------------------------------- */

  function pushHistory() {
    var next = snapshot();
    var current = state.history[state.historyIndex];

    if (current && JSON.stringify(current) === JSON.stringify(next)) {
      updateHistoryButtons();
      return;
    }

    state.history = state.history.slice(0, state.historyIndex + 1);
    state.history.push(next);

    if (state.history.length > HISTORY_LIMIT) {
      state.history.shift();
    }

    state.historyIndex = state.history.length - 1;
    updateHistoryButtons();
  }

  function applySnapshot(next) {
    var roomChanged = next.room.widthCm !== state.room.widthCm ||
      next.room.heightCm !== state.room.heightCm;

    state.name = next.name;
    state.room = {
      widthCm: next.room.widthCm,
      heightCm: next.room.heightCm,
      floor: next.room.floor,
      wall: next.room.wall
    };
    state.objects = next.objects.map(cloneObject);

    if (state.selectedId && !getObject(state.selectedId)) {
      state.selectedId = null;
    }

    if (roomChanged) resetView(false);

    renderAll();
    markDirty();
  }

  function undo() {
    flushNudge();
    if (state.historyIndex <= 0) return;

    state.historyIndex -= 1;
    applySnapshot(state.history[state.historyIndex]);
    updateHistoryButtons();
  }

  function redo() {
    flushNudge();
    if (state.historyIndex >= state.history.length - 1) return;

    state.historyIndex += 1;
    applySnapshot(state.history[state.historyIndex]);
    updateHistoryButtons();
  }

  function updateHistoryButtons() {
    if (elements.undo) elements.undo.disabled = state.historyIndex <= 0;
    if (elements.redo) elements.redo.disabled = state.historyIndex >= state.history.length - 1;
  }

  function flushNudge() {
    if (!state.nudgeTimer) return;
    window.clearTimeout(state.nudgeTimer);
    state.nudgeTimer = null;
    pushHistory();
  }

  /* View and zoom --------------------------------------------------------- */

  function baseView() {
    var pad = Math.max(34, Math.min(state.room.widthCm, state.room.heightCm) * 0.14);
    return {
      x: -pad,
      y: -pad,
      w: state.room.widthCm + pad * 2,
      h: state.room.heightCm + pad * 2
    };
  }

  function resetView(render) {
    state.baseView = baseView();
    state.view = {
      x: state.baseView.x,
      y: state.baseView.y,
      w: state.baseView.w,
      h: state.baseView.h
    };
    state.zoom = 1;
    applyViewBox();
    updateZoomLabel();

    if (render !== false) renderCanvas();
  }

  function applyViewBox() {
    if (!elements.board) return;
    elements.board.setAttribute(
      'viewBox',
      round(state.view.x, 2) + ' ' + round(state.view.y, 2) + ' ' +
      round(state.view.w, 2) + ' ' + round(state.view.h, 2)
    );
  }

  function updateZoomLabel() {
    if (elements.zoomFit) {
      elements.zoomFit.textContent = Math.round(state.zoom * 100) + '%';
      elements.zoomFit.title = 'Fit the room to the view';
    }
  }

  function clientToSvg(clientX, clientY) {
    if (!elements.board) return { x: 0, y: 0 };

    var point = elements.board.createSVGPoint();
    point.x = clientX;
    point.y = clientY;

    var matrix = elements.board.getScreenCTM();
    if (!matrix) return { x: 0, y: 0 };

    var transformed = point.matrixTransform(matrix.inverse());
    return { x: transformed.x, y: transformed.y };
  }

  function zoomAt(factor, clientX, clientY) {
    var nextZoom = clamp(state.zoom * factor, 0.35, 4);
    var applied = nextZoom / state.zoom;

    if (Math.abs(applied - 1) < 0.001) return;

    var rect = elements.board.getBoundingClientRect();
    var x = typeof clientX === 'number' ? clientX : rect.left + rect.width / 2;
    var y = typeof clientY === 'number' ? clientY : rect.top + rect.height / 2;
    var point = clientToSvg(x, y);

    var width = state.view.w / applied;
    var height = state.view.h / applied;

    state.view.x = point.x - (point.x - state.view.x) / applied;
    state.view.y = point.y - (point.y - state.view.y) / applied;
    state.view.w = width;
    state.view.h = height;
    state.zoom = nextZoom;

    applyViewBox();
    updateZoomLabel();
    scheduleCanvasRender();
  }

  /* Rendering ------------------------------------------------------------- */

  function scheduleCanvasRender() {
    if (state.canvasFrame) return;
    state.canvasFrame = window.requestAnimationFrame(function () {
      state.canvasFrame = null;
      renderCanvas();
    });
  }

  function selectionMarkup(object, scale) {
    var handleRadius = 7 / scale;
    var handleOffset = 30 / scale;
    var centerX = object.widthCm / 2;
    var centerY = object.depthCm / 2;

    return (
      '<g class="selection" transform="translate(' + object.x + ' ' + object.y + ') rotate(' +
      object.rotation + ' ' + centerX + ' ' + centerY + ')">' +
        '<rect class="selection__box" x="0" y="0" width="' + object.widthCm +
        '" height="' + object.depthCm + '" fill="none" pointer-events="none" ' +
        'vector-effect="non-scaling-stroke"/>' +
        '<path class="selection__stem" d="M' + centerX + ' 0V' + (-handleOffset) +
        '" fill="none" pointer-events="none" vector-effect="non-scaling-stroke"/>' +
        '<circle class="selection__handle" data-rotate-handle cx="' + centerX + '" cy="' +
        (-handleOffset) + '" r="' + handleRadius + '" vector-effect="non-scaling-stroke">' +
        '<title>Rotate ' + ui.escapeHTML(object.name) + '</title></circle>' +
      '</g>'
    );
  }

  function objectMarkup(object) {
    var item = objectItem(object);
    var fill = object.color || item.color || '#d5d1c7';
    var centerX = object.widthCm / 2;
    var centerY = object.depthCm / 2;

    return (
      '<g class="board-object" data-object-id="' + ui.escapeHTML(object.id) +
      '" transform="translate(' + object.x + ' ' + object.y + ') rotate(' + object.rotation +
      ' ' + centerX + ' ' + centerY + ')" filter="url(#editor-object-shadow)">' +
        '<rect x="0" y="0" width="' + object.widthCm + '" height="' + object.depthCm +
        '" fill="transparent"/>' +
        furniture.renderTopView(item, object.widthCm, object.depthCm, fill) +
      '</g>'
    );
  }

  function renderCanvas() {
    if (!elements.board) return;

    if (!state.view.w) resetView(false);

    var roomWidth = state.room.widthCm;
    var roomHeight = state.room.heightCm;
    var floor = catalog.getFloor(state.room.floor);
    var view = state.view;
    var rect = elements.board.getBoundingClientRect();
    var scale = Math.min(
      (rect.width || 820) / view.w,
      (rect.height || 620) / view.h
    );

    if (!Number.isFinite(scale) || scale <= 0) scale = 1;

    var dimFont = round(10 / scale, 2);
    var showMinorGrid = scale >= 0.85;

    var parts = [];
    parts.push(
      '<defs>' +
        '<pattern id="editor-floor-grain" width="48" height="18" patternUnits="userSpaceOnUse">' +
          '<path d="M0 9H48" stroke="' + floor.grain + '" stroke-width="0.55" opacity="0.26"/>' +
        '</pattern>' +
        '<pattern id="editor-grid-minor" width="' + GRID + '" height="' + GRID + '" patternUnits="userSpaceOnUse">' +
          '<path d="M' + GRID + ' 0H0V' + GRID + '" fill="none" stroke="#292b2a" stroke-opacity="0.11" ' +
          'stroke-width="1" vector-effect="non-scaling-stroke"/>' +
        '</pattern>' +
        '<pattern id="editor-grid-major" width="25" height="25" patternUnits="userSpaceOnUse">' +
          '<path d="M25 0H0V25" fill="none" stroke="#292b2a" stroke-opacity="0.17" ' +
          'stroke-width="1" vector-effect="non-scaling-stroke"/>' +
        '</pattern>' +
        '<clipPath id="editor-room-clip"><rect x="0" y="0" width="' + roomWidth +
        '" height="' + roomHeight + '"/></clipPath>' +
        '<filter id="editor-object-shadow" x="-30%" y="-30%" width="160%" height="160%">' +
          '<feDropShadow dx="0" dy="0.8" stdDeviation="0.8" flood-color="#292b2a" flood-opacity="0.2"/>' +
        '</filter>' +
      '</defs>'
    );

    // Quiet shadow beneath the room.
    parts.push(
      '<rect x="3" y="4" width="' + roomWidth + '" height="' + roomHeight +
      '" fill="#292b2a" opacity="0.07"/>'
    );

    // Floor and grain.
    parts.push('<rect x="0" y="0" width="' + roomWidth + '" height="' + roomHeight +
      '" fill="' + floor.color + '"/>');
    parts.push('<rect x="0" y="0" width="' + roomWidth + '" height="' + roomHeight +
      '" fill="url(#editor-floor-grain)"/>');

    // Grid.
    if (showMinorGrid) {
      parts.push('<rect x="0" y="0" width="' + roomWidth + '" height="' + roomHeight +
        '" fill="url(#editor-grid-minor)"/>');
    }
    parts.push('<rect x="0" y="0" width="' + roomWidth + '" height="' + roomHeight +
      '" fill="url(#editor-grid-major)"/>');

    // Furniture, clipped to the room.
    parts.push('<g clip-path="url(#editor-room-clip)">');
    state.objects.forEach(function (object) {
      parts.push(objectMarkup(object));
    });
    parts.push('</g>');

    // Walls.
    parts.push(
      '<rect x="0" y="0" width="' + roomWidth + '" height="' + roomHeight +
      '" fill="none" stroke="#3a3d39" stroke-width="3" vector-effect="non-scaling-stroke"/>'
    );

    // Dimensions outside the walls.
    var dimColor = '#8a8d85';
    parts.push(
      '<g fill="none" stroke="' + dimColor + '" stroke-width="1" opacity="0.85">' +
        '<path d="M0 -16H' + roomWidth + 'M0 -20v8M' + roomWidth + ' -20v8" ' +
        'vector-effect="non-scaling-stroke"/>' +
        '<path d="M-16 0V' + roomHeight + 'M-20 0h8M-20 ' + roomHeight + 'h8" ' +
        'vector-effect="non-scaling-stroke"/>' +
      '</g>'
    );
    parts.push(
      '<text x="' + roomWidth / 2 + '" y="' + (-25 - dimFont * 0.4) +
      '" text-anchor="middle" font-family="DM Sans, Arial, sans-serif" font-size="' + dimFont +
      '" letter-spacing="0.08em" fill="' + dimColor + '">' + roomWidth + ' cm</text>'
    );
    parts.push(
      '<text transform="translate(' + (-25 - dimFont * 0.4) + ' ' + roomHeight / 2 +
      ') rotate(-90)" text-anchor="middle" font-family="DM Sans, Arial, sans-serif" font-size="' +
      dimFont + '" letter-spacing="0.08em" fill="' + dimColor + '">' + roomHeight + ' cm</text>'
    );

    var selected = getSelected();
    if (selected) parts.push(selectionMarkup(selected, scale));

    elements.board.innerHTML = parts.join('');
    elements.board.setAttribute(
      'viewBox',
      round(view.x, 2) + ' ' + round(view.y, 2) + ' ' +
      round(view.w, 2) + ' ' + round(view.h, 2)
    );

    if (elements.boardEmpty) {
      elements.boardEmpty.hidden = state.objects.length > 0;
    }

    updateZoomLabel();
  }

  function updateUpdatedLabel() {
    if (!elements.propsUpdated) return;
    elements.propsUpdated.textContent = state.project
      ? ui.formatRelativeDate(state.project.updatedAt)
      : '—';
  }

  function renderRoomMeta() {
    var typeInfo = catalog.getRoomType(state.project ? state.project.type : '') || { label: 'Room' };
    var floor = catalog.getFloor(state.room.floor);
    var dimensions = state.room.widthCm + ' × ' + state.room.heightCm + ' cm';

    if (elements.crumb) elements.crumb.textContent = state.name;
    if (elements.stageName) elements.stageName.textContent = state.name;
    if (elements.stageDims) elements.stageDims.textContent = dimensions;
    if (elements.propsRoomName) elements.propsRoomName.textContent = state.name;
    if (elements.propsRoomType) {
      elements.propsRoomType.textContent = typeInfo.label + ' · ' + floor.label + ' floor';
    }
    if (elements.propsDims) elements.propsDims.textContent = dimensions;
    if (elements.propsArea) {
      elements.propsArea.textContent = formatArea(state.room.widthCm, state.room.heightCm) + ' m²';
    }
    if (elements.propsFloor) elements.propsFloor.textContent = floor.label;
    if (elements.propsPieces) elements.propsPieces.textContent = pieceLabel(state.objects.length);
    updateUpdatedLabel();

    if (elements.boardEmpty) {
      elements.boardEmpty.hidden = state.objects.length > 0;
    }

    document.title = state.name + ' — Roomify';
  }

  function setInputValue(input, value) {
    if (!input) return;
    if (document.activeElement === input) return;
    input.value = value;
  }

  function renderColorRow(selected) {
    if (!elements.colorRow) return;

    var item = objectItem(selected);
    var current = selected.color || item.color || '#d5d1c7';
    var swatches = COLOR_PALETTE.map(function (color) {
      var active = String(current).toLowerCase() === color.toLowerCase();
      return (
        '<button class="color-swatch' + (active ? ' is-active' : '') +
        '" type="button" data-color="' + color + '" style="background: ' + color +
        '" aria-label="Use colour ' + color + '" aria-pressed="' + (active ? 'true' : 'false') +
        '"></button>'
      );
    }).join('');

    elements.colorRow.innerHTML = swatches +
      '<input class="color-custom" type="color" value="' + current +
      '" data-color-custom aria-label="Choose a custom colour">';
  }

  function renderProperties() {
    var selected = getSelected();

    if (!selected) {
      if (elements.roomProps) elements.roomProps.hidden = false;
      if (elements.objectProps) elements.objectProps.hidden = true;
      if (elements.selectionSummary) elements.selectionSummary.textContent = 'Nothing selected';
      return;
    }

    if (elements.roomProps) elements.roomProps.hidden = true;
    if (elements.objectProps) elements.objectProps.hidden = false;

    var item = objectItem(selected);

    if (elements.objectName) elements.objectName.textContent = selected.name;
    if (elements.objectThumb) {
      elements.objectThumb.innerHTML = furniture.icon({
        id: item.id,
        name: selected.name,
        shape: item.shape,
        widthCm: selected.widthCm,
        depthCm: selected.depthCm,
        color: selected.color || item.color
      });
    }

    var position = objectPosition(selected);
    setInputValue(elements.objectX, formatCm(position.x));
    setInputValue(elements.objectY, formatCm(position.y));
    setInputValue(elements.objectWidth, String(selected.widthCm));
    setInputValue(elements.objectDepth, String(selected.depthCm));
    setInputValue(elements.objectRotation, formatCm(selected.rotation));

    renderColorRow(selected);

    if (elements.selectionSummary) {
      elements.selectionSummary.textContent =
        selected.name + ' selected · ' + selected.widthCm + ' × ' + selected.depthCm + ' cm';
    }
  }

  function renderAll() {
    renderCanvas();
    renderRoomMeta();
    renderProperties();
    updateHistoryButtons();
  }

  /* Catalogue ------------------------------------------------------------- */

  function renderCatalogFilters() {
    if (!elements.catalogFilters) return;

    elements.catalogFilters.innerHTML = furniture.CATEGORIES.map(function (category) {
      var active = state.category === category.id;
      return (
        '<button class="catalog-filter' + (active ? ' is-active' : '') +
        '" type="button" data-category="' + ui.escapeHTML(category.id) +
        '" aria-pressed="' + (active ? 'true' : 'false') + '">' +
        ui.escapeHTML(category.label) + '</button>'
      );
    }).join('');
  }

  function renderCatalogList() {
    if (!elements.catalogList) return;

    var query = state.search;
    var items = furniture.ITEMS.filter(function (item) {
      if (state.category !== 'all' && item.category !== state.category) return false;
      if (!query) return true;
      return (item.name + ' ' + item.category).toLowerCase().indexOf(query) !== -1;
    });

    if (!items.length) {
      elements.catalogList.innerHTML = '';
      if (elements.catalogEmpty) elements.catalogEmpty.hidden = false;
      return;
    }

    if (elements.catalogEmpty) elements.catalogEmpty.hidden = true;

    elements.catalogList.innerHTML = items.map(function (item) {
      return (
        '<button class="catalog-item" type="button" data-add-item="' + ui.escapeHTML(item.id) +
        '" aria-label="Add ' + ui.escapeHTML(item.name) + ', ' + item.widthCm + ' by ' +
        item.depthCm + ' centimetres">' +
          '<span class="catalog-item__icon">' + furniture.icon(item) + '</span>' +
          '<span class="catalog-item__name">' + ui.escapeHTML(item.name) + '</span>' +
          '<span class="catalog-item__dims">' + item.widthCm + ' × ' + item.depthCm + ' cm</span>' +
        '</button>'
      );
    }).join('');
  }

  function syncCatalogMode() {
    if (!elements.catalogPanel) return;

    if (mobileQuery.matches) {
      if (state.catalogOpen) {
        elements.catalogPanel.removeAttribute('inert');
        elements.catalogPanel.setAttribute('aria-hidden', 'false');
      } else {
        elements.catalogPanel.setAttribute('inert', '');
        elements.catalogPanel.setAttribute('aria-hidden', 'true');
      }
    } else {
      elements.catalogPanel.removeAttribute('inert');
      elements.catalogPanel.removeAttribute('aria-hidden');

      if (state.catalogOpen) {
        state.catalogOpen = false;
        elements.catalogPanel.classList.remove('is-open');
        if (elements.catalogBackdrop) {
          elements.catalogBackdrop.classList.remove('is-open');
          elements.catalogBackdrop.hidden = true;
        }
        if (elements.catalogToggle) elements.catalogToggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('catalog-open');
      }
    }
  }

  function openCatalog() {
    if (!mobileQuery.matches || !elements.catalogPanel) return;

    state.catalogOpen = true;
    elements.catalogPanel.classList.add('is-open');
    elements.catalogPanel.removeAttribute('inert');
    elements.catalogPanel.setAttribute('aria-hidden', 'false');

    if (elements.catalogBackdrop) {
      elements.catalogBackdrop.hidden = false;
      window.requestAnimationFrame(function () {
        elements.catalogBackdrop.classList.add('is-open');
      });
    }

    if (elements.catalogToggle) elements.catalogToggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('catalog-open');
  }

  function closeCatalog() {
    if (!elements.catalogPanel) return;

    state.catalogOpen = false;
    elements.catalogPanel.classList.remove('is-open');

    if (elements.catalogBackdrop) {
      elements.catalogBackdrop.classList.remove('is-open');
      elements.catalogBackdrop.hidden = true;
    }

    if (elements.catalogToggle) elements.catalogToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('catalog-open');

    if (mobileQuery.matches) {
      elements.catalogPanel.setAttribute('inert', '');
      elements.catalogPanel.setAttribute('aria-hidden', 'true');
    }
  }

  /* Object actions -------------------------------------------------------- */

  function selectObject(id) {
    state.selectedId = id;
    renderAll();
  }

  function addObject(item) {
    flushNudge();

    var width = clamp(Math.round(item.widthCm), MIN_OBJECT, Math.min(MAX_OBJECT, state.room.widthCm));
    var depth = clamp(Math.round(item.depthCm), MIN_OBJECT, Math.min(MAX_OBJECT, state.room.heightCm));
    var cascade = (state.objects.length % 6) * 12;

    var object = {
      id: createObjectId(),
      catalogId: item.id,
      name: item.name,
      x: 0,
      y: 0,
      widthCm: width,
      depthCm: depth,
      rotation: 0,
      color: item.color
    };

    placeCenter(
      object,
      state.room.widthCm / 2 + cascade,
      state.room.heightCm / 2 + cascade,
      false
    );

    state.objects.push(object);
    state.selectedId = object.id;
    pushHistory();
    markDirty();
    renderAll();

    if (mobileQuery.matches) closeCatalog();
    if (elements.board) elements.board.focus({ preventScroll: true });
  }

  function deleteSelected() {
    flushNudge();

    var object = getSelected();
    if (!object) return;

    state.objects = state.objects.filter(function (item) {
      return item.id !== object.id;
    });
    state.selectedId = null;

    pushHistory();
    markDirty();
    renderAll();
  }

  function duplicateSelected() {
    flushNudge();

    var source = getSelected();
    if (!source) return;

    var copy = cloneObject(source);
    copy.id = createObjectId();
    placeCenter(
      copy,
      source.x + source.widthCm / 2 + 14,
      source.y + source.depthCm / 2 + 14,
      false
    );

    state.objects.push(copy);
    state.selectedId = copy.id;

    pushHistory();
    markDirty();
    renderAll();
  }

  function rotateSelected(delta) {
    flushNudge();

    var object = getSelected();
    if (!object) return;

    var nextRotation = normalizeAngle(object.rotation + delta);

    if (!fitsAt(object, nextRotation)) {
      ui.toast('This piece cannot rotate that far inside the room. Move it or make it smaller first.', {
        type: 'error',
        duration: 4200
      });
      return;
    }

    object.rotation = nextRotation;
    placeCenter(object, object.x + object.widthCm / 2, object.y + object.depthCm / 2, false);

    pushHistory();
    markDirty();
    renderAll();
  }

  function nudgeSelected(dx, dy) {
    var object = getSelected();
    if (!object) return;

    placeCenter(
      object,
      object.x + object.widthCm / 2 + dx,
      object.y + object.depthCm / 2 + dy,
      false
    );

    markDirty();
    renderAll();

    if (state.nudgeTimer) window.clearTimeout(state.nudgeTimer);
    state.nudgeTimer = window.setTimeout(function () {
      state.nudgeTimer = null;
      pushHistory();
    }, NUDGE_DELAY);
  }

  function setObjectColor(color) {
    var object = getSelected();
    if (!object) return;
    if (!/^#[0-9a-f]{6}$/i.test(color)) return;

    object.color = color;
    pushHistory();
    markDirty();
    renderAll();
  }

  /* Room settings --------------------------------------------------------- */

  function buildRoomFloors() {
    if (!elements.roomFloorGroup) return;

    elements.roomFloorGroup.innerHTML = catalog.FLOORS.map(function (floor) {
      return (
        '<label class="swatch">' +
          '<input type="radio" name="room-floor" value="' + ui.escapeHTML(floor.id) + '">' +
          '<span class="swatch__chip" style="--swatch-color: ' + floor.color + '"></span>' +
          '<span class="swatch__label">' + ui.escapeHTML(floor.label) + '</span>' +
        '</label>'
      );
    }).join('');
  }

  function clearRoomErrors() {
    if (!elements.roomForm) return;
    elements.roomForm.querySelectorAll('.field--error').forEach(function (field) {
      field.classList.remove('field--error');
    });
    if (elements.roomError) {
      elements.roomError.textContent = '';
      elements.roomError.hidden = true;
    }
  }

  function markRoomInvalid(input) {
    if (!input) return;
    var wrapper = input.closest('.field__unit') || input.closest('.field');
    if (wrapper) wrapper.classList.add('field--error');
  }

  function showRoomError(message) {
    if (!elements.roomError) return;
    elements.roomError.textContent = message;
    elements.roomError.hidden = false;
  }

  function openRoomSettings() {
    if (!elements.roomDialog) return;

    clearRoomErrors();

    if (elements.roomNameInput) elements.roomNameInput.value = state.name;
    if (elements.roomWidthInput) elements.roomWidthInput.value = String(state.room.widthCm);
    if (elements.roomHeightInput) elements.roomHeightInput.value = String(state.room.heightCm);

    if (elements.roomFloorGroup) {
      var floorInput = elements.roomFloorGroup.querySelector(
        'input[name="room-floor"][value="' + state.room.floor + '"]'
      );
      if (floorInput) floorInput.checked = true;
    }

    if (typeof elements.roomDialog.showModal === 'function') {
      elements.roomDialog.showModal();
    } else {
      elements.roomDialog.setAttribute('open', '');
    }

    document.body.classList.add('dialog-open');

    window.setTimeout(function () {
      if (elements.roomNameInput) elements.roomNameInput.focus();
    }, 40);
  }

  function closeRoomSettings() {
    if (!elements.roomDialog) return;
    if (elements.roomDialog.open) elements.roomDialog.close();
  }

  function handleRoomSubmit(event) {
    event.preventDefault();

    clearRoomErrors();

    var width = Number(elements.roomWidthInput ? elements.roomWidthInput.value : NaN);
    var height = Number(elements.roomHeightInput ? elements.roomHeightInput.value : NaN);

    if (!Number.isFinite(width) || width < MIN_ROOM || width > MAX_ROOM) {
      markRoomInvalid(elements.roomWidthInput);
      showRoomError('Set a room width between 150 and 1500 cm.');
      if (elements.roomWidthInput) elements.roomWidthInput.focus();
      return;
    }

    if (!Number.isFinite(height) || height < MIN_ROOM || height > MAX_ROOM) {
      markRoomInvalid(elements.roomHeightInput);
      showRoomError('Set a room depth between 150 and 1500 cm.');
      if (elements.roomHeightInput) elements.roomHeightInput.focus();
      return;
    }

    var floorInput = elements.roomForm.querySelector('input[name="room-floor"]:checked');
    var nextFloor = catalog.getFloor(floorInput ? floorInput.value : state.room.floor).id;
    var adjusted = 0;

    state.name = cleanName(elements.roomNameInput ? elements.roomNameInput.value : '');
    state.room.widthCm = Math.round(width);
    state.room.heightCm = Math.round(height);
    state.room.floor = nextFloor;

    state.objects.forEach(function (object) {
      var centerX = object.x + object.widthCm / 2;
      var centerY = object.y + object.depthCm / 2;
      var changed = fitObjectInRoom(object);

      placeCenter(object, centerX, centerY, false);

      if (Math.abs(object.x + object.widthCm / 2 - centerX) > 0.2 ||
          Math.abs(object.y + object.depthCm / 2 - centerY) > 0.2) {
        changed = true;
      }

      if (changed) adjusted += 1;
    });

    closeRoomSettings();
    resetView(false);
    pushHistory();
    markDirty();
    renderAll();

    if (adjusted > 0) {
      ui.toast(
        pieceLabel(Math.min(adjusted, state.objects.length)) +
        ' moved or resized to stay inside the new room.'
      );
    }
  }

  /* Board interaction ----------------------------------------------------- */

  function startDrag(event) {
    if (event.button !== 0 && event.pointerType === 'mouse') return;

    var target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    var handle = target.closest('[data-rotate-handle]');
    if (handle && getSelected()) {
      flushNudge();
      event.preventDefault();

      var object = getSelected();
      var center = {
        x: object.x + object.widthCm / 2,
        y: object.y + object.depthCm / 2
      };
      var point = clientToSvg(event.clientX, event.clientY);
      var startAngle = Math.atan2(point.y - center.y, point.x - center.x) * (180 / Math.PI) + 90;

      state.drag = {
        type: 'rotate',
        pointerId: event.pointerId,
        id: object.id,
        center: center,
        startAngle: startAngle,
        startRotation: object.rotation,
        startClient: { x: event.clientX, y: event.clientY },
        blocked: false,
        changed: false,
        moved: false
      };

      bindDragListeners();
      return;
    }

    var objectNode = target.closest('[data-object-id]');
    if (objectNode) {
      flushNudge();
      event.preventDefault();

      var id = objectNode.getAttribute('data-object-id');
      var selected = getObject(id);
      if (!selected) return;

      state.selectedId = id;
      renderAll();
      if (elements.board) elements.board.focus({ preventScroll: true });

      state.drag = {
        type: 'move',
        pointerId: event.pointerId,
        id: id,
        center: {
          x: selected.x + selected.widthCm / 2,
          y: selected.y + selected.depthCm / 2
        },
        startPoint: clientToSvg(event.clientX, event.clientY),
        startClient: { x: event.clientX, y: event.clientY },
        moved: false
      };

      bindDragListeners();
      return;
    }

    event.preventDefault();

    var rect = elements.board.getBoundingClientRect();
    var matrix = elements.board.getScreenCTM();
    var unitsPerPixel = matrix && matrix.a ? 1 / matrix.a : 1;

    state.drag = {
      type: 'pan',
      pointerId: event.pointerId,
      startClient: { x: event.clientX, y: event.clientY },
      startView: { x: state.view.x, y: state.view.y },
      unitsPerPixel: unitsPerPixel,
      boardRect: rect,
      moved: false
    };

    bindDragListeners();
  }

  function bindDragListeners() {
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    if (elements.board) elements.board.classList.add('is-dragging');
  }

  function unbindDragListeners() {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
    if (elements.board) elements.board.classList.remove('is-dragging');
  }

  function onPointerMove(event) {
    var drag = state.drag;
    if (!drag || event.pointerId !== drag.pointerId) return;

    if (Math.abs(event.clientX - drag.startClient.x) +
        Math.abs(event.clientY - drag.startClient.y) > 3) {
      drag.moved = true;
    }

    if (drag.type === 'pan') {
      if (!drag.moved) return;
      event.preventDefault();

      state.view.x = drag.startView.x - (event.clientX - drag.startClient.x) * drag.unitsPerPixel;
      state.view.y = drag.startView.y - (event.clientY - drag.startClient.y) * drag.unitsPerPixel;
      applyViewBox();
      return;
    }

    if (!drag.moved) return;
    event.preventDefault();

    var object = getObject(drag.id);
    if (!object) return;

    var point = clientToSvg(event.clientX, event.clientY);

    if (drag.type === 'move') {
      var centerX = drag.center.x + (point.x - drag.startPoint.x);
      var centerY = drag.center.y + (point.y - drag.startPoint.y);

      placeCenter(object, centerX, centerY, state.snap && !event.altKey);
      scheduleCanvasRender();
      return;
    }

    if (drag.type === 'rotate') {
      var angle = Math.atan2(point.y - drag.center.y, point.x - drag.center.x) * (180 / Math.PI) + 90;
      var delta = angle - drag.startAngle;

      while (delta > 180) delta -= 360;
      while (delta < -180) delta += 360;

      var rotation = normalizeAngle(drag.startRotation + delta);
      if (!event.altKey) rotation = normalizeAngle(Math.round(rotation / 15) * 15);

      if (!fitsAt(object, rotation)) {
        drag.blocked = true;
        return;
      }

      drag.blocked = false;
      drag.changed = true;
      object.rotation = rotation;
      placeCenter(object, object.x + object.widthCm / 2, object.y + object.depthCm / 2, false);
      scheduleCanvasRender();
    }
  }

  function onPointerUp(event) {
    var drag = state.drag;
    if (!drag || event.pointerId !== drag.pointerId) return;

    unbindDragListeners();
    state.drag = null;

    if (drag.type === 'pan') {
      if (!drag.moved) selectObject(null);
      return;
    }

    if (drag.type === 'rotate' && drag.blocked && drag.moved) {
      ui.toast('This piece cannot rotate that far inside the room. Move it or make it smaller first.', {
        type: 'error',
        duration: 4200
      });
    }

    if (drag.moved && (drag.type !== 'rotate' || drag.changed)) {
      pushHistory();
      markDirty();
      renderAll();
    }
  }

  function onWheel(event) {
    event.preventDefault();

    var factor = Math.exp(-event.deltaY * 0.0012);
    zoomAt(factor, event.clientX, event.clientY);
  }

  /* Events ---------------------------------------------------------------- */

  function isTypingTarget(target) {
    if (!(target instanceof Element)) return false;
    if (target.isContentEditable) return true;
    return Boolean(target.closest('input, textarea, select'));
  }

  function hasOpenDialog() {
    return Boolean(document.querySelector('dialog[open]'));
  }

  function handleKeydown(event) {
    if (event.defaultPrevented) return;

    if (event.key === 'Escape') {
      if (hasOpenDialog()) return;

      if (state.catalogOpen) {
        event.preventDefault();
        closeCatalog();
        return;
      }

      if (state.selectedId) {
        event.preventDefault();
        selectObject(null);
      }
      return;
    }

    if (isTypingTarget(event.target) || hasOpenDialog()) return;

    var modifier = event.ctrlKey || event.metaKey;

    if (modifier && !event.altKey) {
      var key = event.key.toLowerCase();

      if (key === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }

      if (key === 'y') {
        event.preventDefault();
        redo();
        return;
      }

      if (key === 'd') {
        event.preventDefault();
        duplicateSelected();
        return;
      }
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (state.selectedId) {
        event.preventDefault();
        deleteSelected();
      }
      return;
    }

    if (event.key === '0') {
      event.preventDefault();
      resetView();
      return;
    }

    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      zoomAt(1.25);
      return;
    }

    if (event.key === '-') {
      event.preventDefault();
      zoomAt(0.8);
      return;
    }

    if (!state.selectedId) return;

    if (event.key === 'r' || event.key === 'R') {
      event.preventDefault();
      rotateSelected(event.shiftKey ? -15 : 15);
      return;
    }

    if (event.key.indexOf('Arrow') === 0) {
      event.preventDefault();
      var step = event.shiftKey ? 1 : GRID;

      if (event.key === 'ArrowLeft') nudgeSelected(-step, 0);
      else if (event.key === 'ArrowRight') nudgeSelected(step, 0);
      else if (event.key === 'ArrowUp') nudgeSelected(0, -step);
      else if (event.key === 'ArrowDown') nudgeSelected(0, step);
    }
  }

  function wireEvents() {
    if (elements.board) {
      elements.board.addEventListener('pointerdown', startDrag);
      elements.board.addEventListener('wheel', onWheel, { passive: false });
      elements.board.addEventListener('contextmenu', function (event) {
        event.preventDefault();
      });
    }

    if (elements.catalogToggle) {
      elements.catalogToggle.addEventListener('click', function () {
        if (state.catalogOpen) closeCatalog();
        else openCatalog();
      });
    }

    if (elements.catalogClose) {
      elements.catalogClose.addEventListener('click', closeCatalog);
    }

    if (elements.catalogBackdrop) {
      elements.catalogBackdrop.addEventListener('click', closeCatalog);
    }

    if (elements.catalogSearch) {
      elements.catalogSearch.addEventListener('input', function () {
        state.search = elements.catalogSearch.value.trim().toLowerCase();
        renderCatalogList();
      });
    }

    if (elements.catalogFilters) {
      elements.catalogFilters.addEventListener('click', function (event) {
        var button = event.target.closest('[data-category]');
        if (!button) return;

        state.category = button.getAttribute('data-category');
        renderCatalogFilters();
        renderCatalogList();
      });
    }

    if (elements.catalogList) {
      elements.catalogList.addEventListener('click', function (event) {
        var button = event.target.closest('[data-add-item]');
        if (!button) return;

        var item = furniture.getItem(button.getAttribute('data-add-item'));
        if (item) addObject(item);
      });
    }

    elements.roomSettingsButtons.forEach(function (button) {
      button.addEventListener('click', openRoomSettings);
    });

    if (elements.roomForm) {
      elements.roomForm.addEventListener('submit', handleRoomSubmit);
      elements.roomForm.addEventListener('input', function (event) {
        if (elements.roomError && !elements.roomError.hidden) clearRoomErrors();
        if (event.target && event.target.closest) {
          var field = event.target.closest('.field');
          if (field) field.classList.remove('field--error');
        }
      });
    }

    if (elements.roomDialog) {
      elements.roomDialog.addEventListener('close', function () {
        document.body.classList.remove('dialog-open');
      });

      elements.roomDialog.addEventListener('click', function (event) {
        if (event.target !== elements.roomDialog) return;

        var rect = elements.roomDialog.getBoundingClientRect();
        var outside = event.clientX < rect.left || event.clientX > rect.right ||
          event.clientY < rect.top || event.clientY > rect.bottom;

        if (outside) elements.roomDialog.close();
      });

      elements.roomDialog.querySelectorAll('[data-dialog-close]').forEach(function (button) {
        button.addEventListener('click', closeRoomSettings);
      });
    }

    if (elements.undo) elements.undo.addEventListener('click', undo);
    if (elements.redo) elements.redo.addEventListener('click', redo);
    if (elements.duplicate) elements.duplicate.addEventListener('click', duplicateSelected);
    if (elements.deleteObject) elements.deleteObject.addEventListener('click', deleteSelected);

    if (elements.snap) {
      elements.snap.addEventListener('click', function () {
        state.snap = !state.snap;
        elements.snap.classList.toggle('is-active', state.snap);
        elements.snap.setAttribute('aria-pressed', state.snap ? 'true' : 'false');
      });
    }

    if (elements.zoomIn) {
      elements.zoomIn.addEventListener('click', function () {
        zoomAt(1.25);
      });
    }

    if (elements.zoomOut) {
      elements.zoomOut.addEventListener('click', function () {
        zoomAt(0.8);
      });
    }

    if (elements.zoomFit) {
      elements.zoomFit.addEventListener('click', function () {
        resetView();
      });
    }

    var rotateButtons = document.querySelectorAll('[data-rotate]');
    rotateButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        rotateSelected(Number(button.getAttribute('data-rotate')));
      });
    });

    if (elements.objectX) {
      elements.objectX.addEventListener('change', function () {
        var object = getSelected();
        var value = Number(elements.objectX.value);
        if (!object || !Number.isFinite(value)) {
          renderProperties();
          return;
        }

        var position = objectPosition(object);
        placeCenter(object, value + position.hx, position.centerY, false);
        pushHistory();
        markDirty();
        renderAll();
        elements.objectX.value = formatCm(objectPosition(object).x);
      });
    }

    if (elements.objectY) {
      elements.objectY.addEventListener('change', function () {
        var object = getSelected();
        var value = Number(elements.objectY.value);
        if (!object || !Number.isFinite(value)) {
          renderProperties();
          return;
        }

        var position = objectPosition(object);
        placeCenter(object, position.centerX, value + position.hy, false);
        pushHistory();
        markDirty();
        renderAll();
        elements.objectY.value = formatCm(objectPosition(object).y);
      });
    }

    if (elements.objectWidth) {
      elements.objectWidth.addEventListener('change', function () {
        var object = getSelected();
        var value = Number(elements.objectWidth.value);
        if (!object || !Number.isFinite(value)) {
          renderProperties();
          return;
        }

        var centerX = object.x + object.widthCm / 2;
        var requested = clamp(Math.round(value), MIN_OBJECT, Math.min(MAX_OBJECT, state.room.widthCm));
        var maxWidth = Math.floor(maxWidthFor(object.depthCm, object.rotation));

        if (maxWidth < MIN_OBJECT) {
          if (fitObjectInRoom(object)) {
            ui.toast('This piece was reduced to fit the room at its current angle.', {
              type: 'error',
              duration: 4200
            });
          }
        } else if (requested > maxWidth) {
          object.widthCm = maxWidth;
          ui.toast('This piece can be at most ' + maxWidth + ' cm wide at this angle.', {
            type: 'error',
            duration: 4200
          });
        } else {
          object.widthCm = requested;
        }

        placeCenter(object, centerX, object.y + object.depthCm / 2, false);
        pushHistory();
        markDirty();
        renderAll();
        elements.objectWidth.value = String(object.widthCm);
      });
    }

    if (elements.objectDepth) {
      elements.objectDepth.addEventListener('change', function () {
        var object = getSelected();
        var value = Number(elements.objectDepth.value);
        if (!object || !Number.isFinite(value)) {
          renderProperties();
          return;
        }

        var centerY = object.y + object.depthCm / 2;
        var requested = clamp(Math.round(value), MIN_OBJECT, Math.min(MAX_OBJECT, state.room.heightCm));
        var maxDepth = Math.floor(maxDepthFor(object.widthCm, object.rotation));

        if (maxDepth < MIN_OBJECT) {
          if (fitObjectInRoom(object)) {
            ui.toast('This piece was reduced to fit the room at its current angle.', {
              type: 'error',
              duration: 4200
            });
          }
        } else if (requested > maxDepth) {
          object.depthCm = maxDepth;
          ui.toast('This piece can be at most ' + maxDepth + ' cm deep at this angle.', {
            type: 'error',
            duration: 4200
          });
        } else {
          object.depthCm = requested;
        }

        placeCenter(object, object.x + object.widthCm / 2, centerY, false);
        pushHistory();
        markDirty();
        renderAll();
        elements.objectDepth.value = String(object.depthCm);
      });
    }

    if (elements.objectRotation) {
      elements.objectRotation.addEventListener('change', function () {
        var object = getSelected();
        var value = Number(elements.objectRotation.value);
        if (!object || !Number.isFinite(value)) {
          renderProperties();
          return;
        }

        var nextRotation = normalizeAngle(value);

        if (!fitsAt(object, nextRotation)) {
          ui.toast('This piece does not fit at that angle inside the room.', {
            type: 'error',
            duration: 4200
          });
          elements.objectRotation.value = formatCm(object.rotation);
          return;
        }

        object.rotation = nextRotation;
        placeCenter(object, object.x + object.widthCm / 2, object.y + object.depthCm / 2, false);
        pushHistory();
        markDirty();
        renderAll();
        elements.objectRotation.value = formatCm(object.rotation);
      });
    }

    if (elements.colorRow) {
      elements.colorRow.addEventListener('click', function (event) {
        var swatch = event.target.closest('[data-color]');
        if (!swatch) return;
        setObjectColor(swatch.getAttribute('data-color'));
      });

      elements.colorRow.addEventListener('input', function (event) {
        if (!event.target.matches('[data-color-custom]')) return;

        var object = getSelected();
        if (!object) return;

        object.color = event.target.value;
        renderCanvas();
      });

      elements.colorRow.addEventListener('change', function (event) {
        if (!event.target.matches('[data-color-custom]')) return;

        pushHistory();
        markDirty();
        renderAll();
      });
    }

    document.addEventListener('keydown', handleKeydown);

    window.addEventListener('pagehide', flushSave);
    window.addEventListener('beforeunload', flushSave);

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        resizeTimer = null;
        renderCanvas();
      }, 120);
    });

    if (typeof mobileQuery.addEventListener === 'function') {
      mobileQuery.addEventListener('change', syncCatalogMode);
    } else if (typeof mobileQuery.addListener === 'function') {
      mobileQuery.addListener(syncCatalogMode);
    }
  }

  /* Missing room ---------------------------------------------------------- */

  function showMissing(message, pageTitle) {
    if (elements.content) elements.content.hidden = true;
    if (elements.missing) elements.missing.hidden = false;
    if (elements.missingMessage) elements.missingMessage.textContent = message;
    if (elements.crumb) elements.crumb.textContent = 'Not found';
    if (elements.saveState) elements.saveState.hidden = true;

    document.title = (pageTitle || 'Room not found') + ' — Roomify';
  }

  /* Init ------------------------------------------------------------------ */

  function loadProject(project) {
    state.project = project;
    state.name = project.name;
    state.room = {
      widthCm: project.room.widthCm,
      heightCm: project.room.heightCm,
      floor: project.room.floor,
      wall: project.room.wall
    };
    state.objects = project.objects.map(cloneObject);
    state.selectedId = null;
    state.history = [snapshot()];
    state.historyIndex = 0;
    state.dirty = false;

    if (elements.content) elements.content.hidden = false;
    if (elements.missing) elements.missing.hidden = true;
    if (elements.saveState) elements.saveState.hidden = false;

    renderCatalogFilters();
    renderCatalogList();
    buildRoomFloors();
    resetView(false);
    renderAll();
    setSaveStatus('saved');
    syncCatalogMode();

    window.requestAnimationFrame(function () {
      renderCanvas();
    });
  }

  function init() {
    var projectId = new URLSearchParams(window.location.search).get('id');

    if (!storage.isAvailable()) {
      showMissing(
        'Local storage is unavailable in this browser, so saved rooms cannot be opened. Allow site data or leave private browsing, then return to your studio.',
        'Storage unavailable'
      );
      return;
    }

    if (!projectId) {
      showMissing('Open a saved room from your studio to edit its plan.');
      return;
    }

    var project = storage.getProject(projectId);

    if (!project) {
      showMissing(
        storage.hasLoadError()
          ? 'Your saved rooms could not be read in this browser. Return to the studio, reload, and try again.'
          : 'This saved room may have been deleted, or it belongs to a different browser. Open a room from your studio to edit its plan.'
      );
      return;
    }

    wireEvents();
    loadProject(project);
  }

  init();
})();
