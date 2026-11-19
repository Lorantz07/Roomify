/* ==========================================================================
   Roomify — Editor placeholder (Phase 1)
   Reads a saved room, renders its measured plan and details. No editing yet.
   ========================================================================== */

(function () {
  'use strict';

  var NS = window.Roomify || {};

  if (!NS.catalog || !NS.storage || !NS.plan || !NS.ui) {
    console.error('[Roomify] Editor dependencies are missing.');
    return;
  }

  var catalog = NS.catalog;
  var storage = NS.storage;
  var plan = NS.plan;
  var ui = NS.ui;

  var elements = {
    content: document.querySelector('[data-editor-content]'),
    missing: document.querySelector('[data-editor-missing]'),
    missingMessage: document.querySelector('[data-missing-message]'),
    crumb: document.querySelector('[data-crumb-current]'),
    saveState: document.querySelector('[data-save-state]'),
    plan: document.querySelector('[data-plan]'),
    name: document.querySelector('[data-project-name]'),
    type: document.querySelector('[data-project-type]'),
    floor: document.querySelector('[data-project-floor]'),
    dimensions: document.querySelector('[data-dimensions]'),
    area: document.querySelector('[data-area]'),
    floorDetail: document.querySelector('[data-floor-detail]'),
    created: document.querySelector('[data-created]'),
    updated: document.querySelector('[data-updated]')
  };

  function formatArea(widthCm, heightCm) {
    var area = catalog.areaM2(widthCm, heightCm);
    return (Math.round(area * 10) / 10).toFixed(1).replace(/\.0$/, '');
  }

  function showMissing(message, pageTitle) {
    if (elements.content) elements.content.hidden = true;
    if (elements.missing) elements.missing.hidden = false;
    if (elements.missingMessage) elements.missingMessage.textContent = message;
    if (elements.crumb) elements.crumb.textContent = 'Not found';
    if (elements.saveState) elements.saveState.hidden = true;

    document.title = (pageTitle || 'Room not found') + ' — Roomify';
  }

  function renderProject(project) {
    var typeInfo = catalog.getRoomType(project.type) || { label: 'Room' };
    var floor = catalog.getFloor(project.room.floor);
    var width = project.room.widthCm;
    var height = project.room.heightCm;

    if (elements.content) elements.content.hidden = false;
    if (elements.missing) elements.missing.hidden = true;
    if (elements.saveState) elements.saveState.hidden = false;

    if (elements.crumb) elements.crumb.textContent = project.name;
    if (elements.name) elements.name.textContent = project.name;
    if (elements.type) elements.type.textContent = typeInfo.label;
    if (elements.floor) elements.floor.textContent = floor.label + ' floor';
    if (elements.dimensions) elements.dimensions.textContent = width + ' × ' + height + ' cm';
    if (elements.area) elements.area.textContent = formatArea(width, height) + ' m²';
    if (elements.floorDetail) elements.floorDetail.textContent = floor.label;
    if (elements.created) elements.created.textContent = ui.formatLongDate(project.createdAt);
    if (elements.updated) elements.updated.textContent = ui.formatLongDate(project.updatedAt);

    if (elements.plan) {
      elements.plan.innerHTML = plan.render(project, { detail: true });
    }

    document.title = project.name + ' — Roomify';
  }

  function init() {
    var projectId = new URLSearchParams(window.location.search).get('id');

    if (!storage.isAvailable()) {
      showMissing(
        'Local storage is unavailable in this browser, so saved rooms cannot be opened. Allow site data or leave private browsing, then return to your studio.'
      );
      return;
    }

    if (!projectId) {
      showMissing('Open a saved room from your studio to see its measured plan.');
      return;
    }

    var project = storage.getProject(projectId);

    if (!project) {
      showMissing(
        storage.hasLoadError()
          ? 'Your saved rooms could not be read in this browser. Return to the studio, reload, and try again.'
          : 'This saved room may have been deleted, or it belongs to a different browser. Open a room from your studio to see its plan.'
      );
      return;
    }

    renderProject(project);
  }

  init();
})();
