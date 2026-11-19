/* ==========================================================================
   Roomify — Local project storage
   Projects live in localStorage. No account, no server, no sync.
   ========================================================================== */

(function () {
  'use strict';

  var NS = (window.Roomify = window.Roomify || {});
  var STORAGE_KEY = 'roomify.projects.v1';
  var VERSION = 1;
  var MIN_DIMENSION = 150;
  var MAX_DIMENSION = 1500;

  var availability = null;
  var loadError = false;

  function isAvailable() {
    if (availability !== null) return availability;

    try {
      var probe = STORAGE_KEY + '.probe';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      availability = true;
    } catch (error) {
      console.warn('[Roomify] Local storage is unavailable in this browser.', error);
      availability = false;
    }

    return availability;
  }

  function emptyState() {
    return { version: VERSION, projects: [] };
  }

  function clampDimension(value, fallback) {
    var number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(MAX_DIMENSION, Math.max(MIN_DIMENSION, Math.round(number)));
  }

  function isValidDateString(value) {
    return typeof value === 'string' && !Number.isNaN(Date.parse(value));
  }

  function cleanName(value) {
    var name = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
    if (!name) return 'Untitled room';
    return name.slice(0, 80);
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return 'rm-' + window.crypto.randomUUID();
    }
    return 'rm-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  }

  function clampObjectDimension(value, fallback) {
    var number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(600, Math.max(20, Math.round(number)));
  }

  function normalizeRotation(value) {
    var number = Number(value);
    if (!Number.isFinite(number)) return 0;
    number = number % 360;
    if (number < 0) number += 360;
    return Math.round(number * 10) / 10;
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

  /**
   * Scale a rotated piece down until its footprint fits the room.
   * The 20 cm floor means extreme cases can still overflow, but every
   * normal room (150 cm and up) has enough space for the minimum size.
   */
  function fitObjectSize(widthCm, depthCm, rotation, roomWidth, roomHeight) {
    var footprint = rotatedFootprint(widthCm, depthCm, rotation);

    if (footprint.width <= roomWidth && footprint.height <= roomHeight) {
      return { widthCm: widthCm, depthCm: depthCm };
    }

    var scale = Math.min(roomWidth / footprint.width, roomHeight / footprint.height, 1);
    var nextWidth = Math.max(20, Math.floor(widthCm * scale));
    var nextDepth = Math.max(20, Math.floor(depthCm * scale));
    var guard = 0;

    while (guard < 1200) {
      footprint = rotatedFootprint(nextWidth, nextDepth, rotation);
      if (footprint.width <= roomWidth && footprint.height <= roomHeight) break;
      if (nextWidth <= 20 && nextDepth <= 20) break;

      if (nextWidth >= nextDepth && nextWidth > 20) {
        nextWidth -= 1;
      } else if (nextDepth > 20) {
        nextDepth -= 1;
      } else if (nextWidth > 20) {
        nextWidth -= 1;
      }

      guard += 1;
    }

    return { widthCm: nextWidth, depthCm: nextDepth };
  }

  function normalizeObject(raw, roomWidth, roomHeight) {
    if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' || !raw.id) {
      return null;
    }

    var widthCm = clampObjectDimension(raw.widthCm, 60);
    var depthCm = clampObjectDimension(raw.depthCm, 60);
    var rotation = normalizeRotation(raw.rotation);
    var fitted = fitObjectSize(widthCm, depthCm, rotation, roomWidth, roomHeight);
    widthCm = fitted.widthCm;
    depthCm = fitted.depthCm;

    var footprint = rotatedFootprint(widthCm, depthCm, rotation);
    var halfWidth = footprint.width / 2;
    var halfHeight = footprint.height / 2;

    var centerX = Number(raw.x);
    var centerY = Number(raw.y);

    if (!Number.isFinite(centerX)) {
      centerX = widthCm / 2;
    } else {
      centerX += widthCm / 2;
    }

    if (!Number.isFinite(centerY)) {
      centerY = depthCm / 2;
    } else {
      centerY += depthCm / 2;
    }

    if (halfWidth * 2 >= roomWidth) {
      centerX = roomWidth / 2;
    } else {
      centerX = Math.max(halfWidth, Math.min(roomWidth - halfWidth, centerX));
    }

    if (halfHeight * 2 >= roomHeight) {
      centerY = roomHeight / 2;
    } else {
      centerY = Math.max(halfHeight, Math.min(roomHeight - halfHeight, centerY));
    }

    var color = typeof raw.color === 'string' && /^#[0-9a-f]{6}$/i.test(raw.color)
      ? raw.color
      : null;

    var name = typeof raw.name === 'string' && raw.name.trim()
      ? raw.name.trim().replace(/\s+/g, ' ').slice(0, 80)
      : 'Furniture';

    return {
      id: raw.id.slice(0, 120),
      catalogId: typeof raw.catalogId === 'string' ? raw.catalogId.slice(0, 80) : '',
      name: name,
      x: Math.round((centerX - widthCm / 2) * 10) / 10,
      y: Math.round((centerY - depthCm / 2) * 10) / 10,
      widthCm: widthCm,
      depthCm: depthCm,
      rotation: rotation,
      color: color
    };
  }

  function normalizeObjects(raw, roomWidth, roomHeight) {
    if (!Array.isArray(raw)) return [];
    return raw.map(function (object) {
      return normalizeObject(object, roomWidth, roomHeight);
    }).filter(Boolean);
  }

  function normalizeProject(raw) {
    if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' || !raw.id) {
      return null;
    }

    var room = raw.room && typeof raw.room === 'object' ? raw.room : {};
    var widthCm = clampDimension(room.widthCm, 400);
    var heightCm = clampDimension(room.heightCm, 500);
    var createdAt = isValidDateString(raw.createdAt) ? raw.createdAt : new Date().toISOString();
    var updatedAt = isValidDateString(raw.updatedAt) ? raw.updatedAt : createdAt;

    return {
      id: raw.id,
      name: cleanName(raw.name),
      type: typeof raw.type === 'string' && raw.type ? raw.type : 'blank',
      room: {
        widthCm: widthCm,
        heightCm: heightCm,
        floor: typeof room.floor === 'string' && room.floor ? room.floor : 'oak',
        wall: typeof room.wall === 'string' && room.wall ? room.wall : 'ivory'
      },
      objects: normalizeObjects(raw.objects, widthCm, heightCm),
      createdAt: createdAt,
      updatedAt: updatedAt
    };
  }

  function readState() {
    loadError = false;

    if (!isAvailable()) {
      return emptyState();
    }

    var raw;
    try {
      raw = window.localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      console.warn('[Roomify] Could not access local storage.', error);
      availability = false;
      return emptyState();
    }

    if (!raw) {
      return emptyState();
    }

    try {
      var parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.projects)) {
        throw new Error('Unexpected project data shape.');
      }

      return {
        version: VERSION,
        projects: parsed.projects.map(normalizeProject).filter(Boolean)
      };
    } catch (error) {
      loadError = true;
      console.error('[Roomify] Saved projects could not be read.', error);
      return emptyState();
    }
  }

  function writeState(state) {
    if (!isAvailable()) {
      var unavailable = new Error('Local storage is unavailable.');
      unavailable.code = 'storage-unavailable';
      throw unavailable;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('[Roomify] Projects could not be saved.', error);
      var saveError = new Error('Projects could not be saved in this browser.');
      saveError.code = error && error.name === 'QuotaExceededError' ? 'storage-full' : 'storage-failed';
      throw saveError;
    }
  }

  function listProjects() {
    return readState().projects.slice().sort(function (a, b) {
      return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
    });
  }

  function getProject(id) {
    if (!id) return null;

    var projects = readState().projects;
    for (var i = 0; i < projects.length; i += 1) {
      if (projects[i].id === id) return projects[i];
    }
    return null;
  }

  /**
   * Create and persist a new project.
   * @param {{name?: string, type?: string, widthCm?: number, heightCm?: number, floor?: string}} input
   */
  function createProject(input) {
    var settings = input || {};
    var catalog = NS.catalog;
    var typeInfo = catalog ? catalog.getRoomType(settings.type) : null;
    var type = typeInfo ? typeInfo.id : 'blank';
    var now = new Date().toISOString();

    var widthCm = clampDimension(
      settings.widthCm,
      typeInfo ? typeInfo.widthCm : 400
    );
    var heightCm = clampDimension(
      settings.heightCm,
      typeInfo ? typeInfo.heightCm : 500
    );

    var floor = typeof settings.floor === 'string' ? settings.floor : (typeInfo ? typeInfo.floor : 'oak');
    if (catalog && !catalog.getFloor(floor)) {
      floor = 'oak';
    }

    var project = {
      id: createId(),
      name: cleanName(settings.name || (typeInfo ? typeInfo.defaultName : 'My room')),
      type: type,
      room: {
        widthCm: widthCm,
        heightCm: heightCm,
        floor: floor,
        wall: 'ivory'
      },
      objects: [],
      createdAt: now,
      updatedAt: now
    };

    var state = readState();
    state.projects.push(project);
    writeState(state);

    return project;
  }

  /**
   * Update a saved project without touching its identity or creation date.
   * @param {string} id
   * @param {{name?: string, room?: object, objects?: object[]}} patch
   */
  function updateProject(id, patch) {
    if (!id) return null;

    var state = readState();
    var index = -1;

    for (var i = 0; i < state.projects.length; i += 1) {
      if (state.projects[i].id === id) {
        index = i;
        break;
      }
    }

    if (index < 0) return null;

    var current = state.projects[index];
    var changes = patch && typeof patch === 'object' ? patch : {};
    var room = Object.assign({}, current.room, changes.room || {});

    if (NS.catalog && !NS.catalog.getFloor(room.floor)) {
      room.floor = current.room.floor;
    }

    var updated = normalizeProject({
      id: current.id,
      name: changes.name !== undefined ? changes.name : current.name,
      type: current.type,
      room: room,
      objects: changes.objects !== undefined ? changes.objects : current.objects,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString()
    });

    if (!updated) return null;

    state.projects[index] = updated;
    writeState(state);
    return updated;
  }

  function deleteProject(id) {
    if (!id) return false;

    var state = readState();
    var next = state.projects.filter(function (project) {
      return project.id !== id;
    });

    if (next.length === state.projects.length) return false;

    state.projects = next;
    writeState(state);
    return true;
  }

  NS.storage = {
    isAvailable: isAvailable,
    hasLoadError: function () {
      return loadError;
    },
    listProjects: listProjects,
    getProject: getProject,
    createProject: createProject,
    updateProject: updateProject,
    deleteProject: deleteProject
  };
})();
