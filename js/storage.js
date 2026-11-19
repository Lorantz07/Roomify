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

  function normalizeProject(raw) {
    if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' || !raw.id) {
      return null;
    }

    var room = raw.room && typeof raw.room === 'object' ? raw.room : {};
    var createdAt = isValidDateString(raw.createdAt) ? raw.createdAt : new Date().toISOString();
    var updatedAt = isValidDateString(raw.updatedAt) ? raw.updatedAt : createdAt;

    return {
      id: raw.id,
      name: cleanName(raw.name),
      type: typeof raw.type === 'string' && raw.type ? raw.type : 'blank',
      room: {
        widthCm: clampDimension(room.widthCm, 400),
        heightCm: clampDimension(room.heightCm, 500),
        floor: typeof room.floor === 'string' && room.floor ? room.floor : 'oak',
        wall: typeof room.wall === 'string' && room.wall ? room.wall : 'ivory'
      },
      objects: Array.isArray(raw.objects) ? raw.objects : [],
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
    deleteProject: deleteProject
  };
})();
