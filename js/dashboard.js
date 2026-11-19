/* ==========================================================================
   Roomify — Dashboard
   Renders saved rooms, empty state, templates and the create/delete flows.
   ========================================================================== */

(function () {
  'use strict';

  var NS = window.Roomify || {};

  if (!NS.catalog || !NS.storage || !NS.plan || !NS.ui) {
    console.error('[Roomify] Dashboard dependencies are missing.');
    return;
  }

  var catalog = NS.catalog;
  var storage = NS.storage;
  var plan = NS.plan;
  var ui = NS.ui;

  var elements = {
    storagePill: document.querySelector('[data-storage-pill]'),
    storageLabel: document.querySelector('[data-storage-label]'),
    storageAlert: document.querySelector('[data-storage-alert]'),
    storageAlertText: document.querySelector('[data-storage-alert-text]'),
    today: document.querySelector('[data-today]'),
    projectCount: document.querySelector('[data-project-count]'),
    emptyState: document.querySelector('[data-empty-state]'),
    emptyVisual: document.querySelector('[data-empty-visual]'),
    recentSection: document.querySelector('[data-recent-section]'),
    recentGrid: document.querySelector('[data-recent-grid]'),
    recentAside: document.querySelector('[data-recent-aside]'),
    allSection: document.querySelector('[data-all-section]'),
    allGrid: document.querySelector('[data-all-grid]'),
    allAside: document.querySelector('[data-all-aside]'),
    templateGrid: document.querySelector('[data-template-grid]'),
    newDialog: document.getElementById('new-project-dialog'),
    projectForm: document.querySelector('[data-project-form]'),
    projectType: document.querySelector('[data-project-type]'),
    widthInput: document.querySelector('[data-width]'),
    heightInput: document.querySelector('[data-height]'),
    floorGroup: document.querySelector('[data-floor-group]'),
    formError: document.querySelector('[data-form-error]'),
    deleteDialog: document.getElementById('delete-project-dialog'),
    deleteName: document.querySelector('[data-delete-name]'),
    confirmDelete: document.querySelector('[data-confirm-delete]')
  };

  var state = {
    projects: [],
    pendingDeleteId: null
  };

  var ICONS = {
    arrow:
      '<svg viewBox="0 0 18 18" fill="none" aria-hidden="true">' +
      '<path d="M3 9h12M10 4l5 5-5 5" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>',
    trash:
      '<svg viewBox="0 0 18 18" fill="none" aria-hidden="true">' +
      '<path d="M3.5 5h11M7 5V3.4h4V5M5.2 5l.7 9.4h6.2l.7-9.4" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>'
  };

  function escapeHTML(value) {
    return ui.escapeHTML(value);
  }

  function pad2(value) {
    return value < 10 ? '0' + value : String(value);
  }

  function formatArea(widthCm, heightCm) {
    var area = catalog.areaM2(widthCm, heightCm);
    return (Math.round(area * 10) / 10).toFixed(1).replace(/\.0$/, '');
  }

  function projectHref(id) {
    return 'editor.html?id=' + encodeURIComponent(id);
  }

  function objectSummary(project) {
    var count = project && Array.isArray(project.objects) ? project.objects.length : 0;
    if (!count) return 'Empty plan';
    return count + (count === 1 ? ' piece' : ' pieces');
  }

  function canSave() {
    return storage.isAvailable() && !storage.hasLoadError();
  }

  function storageMessage() {
    if (storage.hasLoadError()) {
      return 'Saved rooms could not be read, so saving is paused to protect them. Reload the page to try again.';
    }
    return 'Local storage is unavailable, so Roomify cannot save a room in this browser.';
  }

  function updateStorageStatus() {
    var available = storage.isAvailable();
    var loadError = storage.hasLoadError();
    var unhealthy = !available || loadError;

    if (elements.storagePill) {
      elements.storagePill.classList.toggle('storage-pill--warning', unhealthy);
      elements.storagePill.textContent = loadError
        ? 'Storage needs attention'
        : available
          ? 'Saved in this browser'
          : 'Storage unavailable';
    }

    if (elements.storageLabel) {
      elements.storageLabel.textContent = loadError
        ? 'Needs attention'
        : available
          ? 'In this browser'
          : 'Unavailable';
    }

    if (!elements.storageAlert || !elements.storageAlertText) return;

    if (!unhealthy) {
      elements.storageAlert.hidden = true;
      return;
    }

    if (loadError) {
      elements.storageAlertText.innerHTML =
        '<strong>Your saved rooms could not be read.</strong> To protect the existing data, Roomify has paused saving. Reload the page to try again, or clear this site’s data if you want a fresh start.';
    } else {
      elements.storageAlertText.innerHTML =
        '<strong>Local storage is unavailable.</strong> This browser is blocking the place Roomify keeps rooms. Allow site data or leave private browsing, then reload the studio.';
    }

    elements.storageAlert.hidden = false;
  }

  function ensureSaving() {
    if (canSave()) return true;

    updateStorageStatus();
    ui.toast(storageMessage(), { type: 'error', duration: 5200 });
    return false;
  }

  /* Room cards ------------------------------------------------------------ */

  function renderProjectCard(project) {
    var typeInfo = catalog.getRoomType(project.type) || { label: 'Room' };
    var floor = catalog.getFloor(project.room.floor);
    var href = projectHref(project.id);
    var name = escapeHTML(project.name);
    var badge = escapeHTML(typeInfo.label);
    var meta =
      project.room.widthCm + ' × ' + project.room.heightCm + ' cm · ' +
      formatArea(project.room.widthCm, project.room.heightCm) + ' m² · ' +
      escapeHTML(floor.label) + ' · ' + objectSummary(project);

    return (
      '<article class="project-card">' +
        '<a class="project-card__visual" href="' + escapeHTML(href) + '" aria-label="Open ' + name + '">' +
          plan.render(project) +
          '<span class="project-card__badge">' + badge + '</span>' +
        '</a>' +
        '<div class="project-card__body">' +
          '<div class="project-card__head">' +
            '<div>' +
              '<h3 class="project-card__title"><a href="' + escapeHTML(href) + '">' + name + '</a></h3>' +
              '<p class="project-card__meta">' + meta + '</p>' +
            '</div>' +
            '<button class="icon-btn project-card__delete" type="button" data-delete-id="' +
              escapeHTML(project.id) + '" aria-label="Delete ' + name + '" title="Delete room">' +
              ICONS.trash +
            '</button>' +
          '</div>' +
          '<div class="project-card__foot">' +
            '<span>Edited ' + escapeHTML(ui.formatRelativeDate(project.updatedAt)) + '</span>' +
            '<a class="project-card__open" href="' + escapeHTML(href) + '">Open room ' + ICONS.arrow + '</a>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }

  function renderDashboard() {
    var projects = storage.listProjects();
    state.projects = projects;

    if (elements.projectCount) {
      elements.projectCount.textContent = pad2(projects.length);
    }

    if (!projects.length) {
      if (elements.emptyState) elements.emptyState.hidden = false;
      if (elements.recentSection) elements.recentSection.hidden = true;
      if (elements.allSection) elements.allSection.hidden = true;
      if (elements.recentGrid) elements.recentGrid.innerHTML = '';
      if (elements.allGrid) elements.allGrid.innerHTML = '';
      return;
    }

    if (elements.emptyState) elements.emptyState.hidden = true;

    var recent = projects.slice(0, 3);

    if (elements.recentSection) elements.recentSection.hidden = false;
    if (elements.recentGrid) {
      elements.recentGrid.innerHTML = recent.map(renderProjectCard).join('');
    }
    if (elements.recentAside) {
      elements.recentAside.textContent = projects.length > 3
        ? 'Showing 3 of ' + projects.length
        : projects.length === 1
          ? 'Your only room so far'
          : 'All ' + projects.length + ' rooms';
    }

    var showAll = projects.length > 3;

    if (elements.allSection) elements.allSection.hidden = !showAll;
    if (elements.allGrid) {
      elements.allGrid.innerHTML = showAll ? projects.map(renderProjectCard).join('') : '';
    }
    if (elements.allAside) {
      elements.allAside.textContent = projects.length + ' rooms · newest first';
    }

    updateStorageStatus();
  }

  /* Templates ------------------------------------------------------------- */

  function renderTemplates() {
    if (!elements.templateGrid) return;

    elements.templateGrid.innerHTML = catalog.TEMPLATES.map(function (template) {
      var typeInfo = catalog.getRoomType(template.type);
      if (!typeInfo) return '';

      var floor = catalog.getFloor(template.floor);
      var preview = {
        type: typeInfo.id,
        room: {
          widthCm: typeInfo.widthCm,
          heightCm: typeInfo.heightCm,
          floor: template.floor
        }
      };

      return (
        '<article class="template-card">' +
          '<div class="template-card__visual" aria-hidden="true">' +
            plan.render(preview, { hints: true }) +
          '</div>' +
          '<div class="template-card__head">' +
            '<h3 class="template-card__title">' + escapeHTML(typeInfo.label) + '</h3>' +
            '<span class="template-card__dims">' + typeInfo.widthCm + ' × ' + typeInfo.heightCm + ' cm</span>' +
          '</div>' +
          '<p class="template-card__note">' + escapeHTML(template.description) + ' · ' + escapeHTML(floor.label) + ' floor.</p>' +
          '<button class="template-card__action" type="button" aria-label="Use the ' +
            escapeHTML(typeInfo.label) + ' template" data-template-type="' +
            escapeHTML(typeInfo.id) + '" data-template-floor="' + escapeHTML(template.floor) + '">' +
            'Use template ' + ICONS.arrow +
          '</button>' +
        '</article>'
      );
    }).join('');
  }

  /* New-room dialog ------------------------------------------------------- */

  function buildFormOptions() {
    var fallbackType = catalog.getRoomType('living') || catalog.ROOM_TYPES[0];

    if (elements.projectType) {
      elements.projectType.innerHTML = catalog.ROOM_TYPES.map(function (type) {
        return '<option value="' + escapeHTML(type.id) + '">' + escapeHTML(type.label) + '</option>';
      }).join('');
    }

    if (elements.floorGroup) {
      elements.floorGroup.innerHTML = catalog.FLOORS.map(function (floor) {
        return (
          '<label class="swatch">' +
            '<input type="radio" name="floor" value="' + escapeHTML(floor.id) + '"' +
              (fallbackType && fallbackType.floor === floor.id ? ' checked' : '') + '>' +
            '<span class="swatch__chip" style="--swatch-color: ' + escapeHTML(floor.color) + '"></span>' +
            '<span class="swatch__label">' + escapeHTML(floor.label) + '</span>' +
          '</label>'
        );
      }).join('');
    }
  }

  function applyTypeDefaults(typeId) {
    var typeInfo = catalog.getRoomType(typeId);
    if (!typeInfo) return;

    if (elements.widthInput) elements.widthInput.value = String(typeInfo.widthCm);
    if (elements.heightInput) elements.heightInput.value = String(typeInfo.heightCm);

    if (elements.projectForm) {
      var floorInput = elements.projectForm.querySelector(
        'input[name="floor"][value="' + typeInfo.floor + '"]'
      );
      if (floorInput) floorInput.checked = true;
    }
  }

  function clearFieldErrors() {
    if (!elements.projectForm) return;
    elements.projectForm.querySelectorAll('.field--error').forEach(function (field) {
      field.classList.remove('field--error');
    });
  }

  function showFormError(message) {
    if (!elements.formError) return;
    elements.formError.textContent = message;
    elements.formError.hidden = false;
  }

  function resetForm() {
    if (!elements.projectForm) return;

    elements.projectForm.reset();
    clearFieldErrors();

    if (elements.formError) {
      elements.formError.textContent = '';
      elements.formError.hidden = true;
    }

    var firstType = catalog.ROOM_TYPES[0];
    if (elements.projectType && firstType) {
      elements.projectType.value = firstType.id;
      applyTypeDefaults(firstType.id);
    }
  }

  function openDialog(dialog) {
    if (!dialog || dialog.open) return;

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }

    document.body.classList.add('dialog-open');
  }

  function closeDialog(dialog) {
    if (dialog && dialog.open) {
      dialog.close();
    }
  }

  function openNewProject() {
    if (!ensureSaving()) return;

    resetForm();
    openDialog(elements.newDialog);

    window.setTimeout(function () {
      var nameInput = elements.projectForm && elements.projectForm.querySelector('[name="name"]');
      if (nameInput) nameInput.focus();
    }, 40);
  }

  function markInvalid(input) {
    if (!input) return;
    var wrapper = input.closest('.field__unit') || input.closest('.field');
    if (wrapper) wrapper.classList.add('field--error');
  }

  function handleCreate(event) {
    event.preventDefault();

    if (!ensureSaving()) return;

    clearFieldErrors();
    if (elements.formError) elements.formError.hidden = true;

    var width = Number(elements.widthInput ? elements.widthInput.value : NaN);
    var height = Number(elements.heightInput ? elements.heightInput.value : NaN);

    if (!Number.isFinite(width) || width < 150 || width > 1500) {
      markInvalid(elements.widthInput);
      showFormError('Set a room width between 150 and 1500 cm.');
      if (elements.widthInput) elements.widthInput.focus();
      return;
    }

    if (!Number.isFinite(height) || height < 150 || height > 1500) {
      markInvalid(elements.heightInput);
      showFormError('Set a room depth between 150 and 1500 cm.');
      if (elements.heightInput) elements.heightInput.focus();
      return;
    }

    var floorInput = elements.projectForm.querySelector('input[name="floor"]:checked');
    var nameInput = elements.projectForm.querySelector('[name="name"]');

    try {
      var project = storage.createProject({
        name: nameInput ? nameInput.value : '',
        type: elements.projectType ? elements.projectType.value : 'blank',
        widthCm: width,
        heightCm: height,
        floor: floorInput ? floorInput.value : 'oak'
      });

      closeDialog(elements.newDialog);
      window.location.href = projectHref(project.id);
    } catch (error) {
      console.warn('[Roomify] Could not create the room.', error);
      showFormError(error && error.message ? error.message : 'The room could not be saved. Try again.');
    }
  }

  /* Delete flow ----------------------------------------------------------- */

  function requestDelete(id) {
    if (!ensureSaving()) return;

    var project = state.projects.filter(function (item) {
      return item.id === id;
    })[0];

    if (!project) return;

    state.pendingDeleteId = project.id;
    if (elements.deleteName) elements.deleteName.textContent = project.name;
    openDialog(elements.deleteDialog);
  }

  function confirmDelete() {
    if (!state.pendingDeleteId) return;
    if (!ensureSaving()) return;

    try {
      var removed = storage.deleteProject(state.pendingDeleteId);

      if (!removed) {
        ui.toast('That room is no longer in your studio.', { type: 'error' });
        closeDialog(elements.deleteDialog);
        renderDashboard();
        return;
      }

      closeDialog(elements.deleteDialog);
      renderDashboard();
      ui.toast('Room removed from your studio.');
    } catch (error) {
      console.warn('[Roomify] Could not delete the room.', error);
      ui.toast(
        error && error.message ? error.message : 'The room could not be removed. Try again.',
        { type: 'error' }
      );
    }
  }

  /* Events ---------------------------------------------------------------- */

  function wireDialogs() {
    [elements.newDialog, elements.deleteDialog].forEach(function (dialog) {
      if (!dialog) return;

      dialog.addEventListener('close', function () {
        var anyOpen = (elements.newDialog && elements.newDialog.open) ||
          (elements.deleteDialog && elements.deleteDialog.open);

        if (!anyOpen) {
          document.body.classList.remove('dialog-open');
        }

        if (dialog === elements.deleteDialog) {
          state.pendingDeleteId = null;
        }
      });

      dialog.addEventListener('click', function (event) {
        if (event.target !== dialog) return;

        var rect = dialog.getBoundingClientRect();
        var outside = event.clientX < rect.left || event.clientX > rect.right ||
          event.clientY < rect.top || event.clientY > rect.bottom;

        if (outside) dialog.close();
      });
    });

    document.querySelectorAll('[data-dialog-close]').forEach(function (button) {
      button.addEventListener('click', function () {
        var dialog = button.closest('dialog');
        closeDialog(dialog);
      });
    });

    if (elements.projectForm) {
      elements.projectForm.addEventListener('submit', handleCreate);

      elements.projectType.addEventListener('change', function () {
        clearFieldErrors();
        applyTypeDefaults(elements.projectType.value);
      });

      elements.projectForm.addEventListener('input', function () {
        if (elements.formError) elements.formError.hidden = true;
        clearFieldErrors();
      });
    }

    if (elements.confirmDelete) {
      elements.confirmDelete.addEventListener('click', confirmDelete);
    }
  }

  function wirePageEvents() {
    document.addEventListener('click', function (event) {
      if (!(event.target instanceof Element)) return;

      var newTrigger = event.target.closest('[data-new-project]');
      if (newTrigger) {
        event.preventDefault();
        openNewProject();
        return;
      }

      var templateTrigger = event.target.closest('[data-template-type]');
      if (templateTrigger) {
        if (!ensureSaving()) return;

        var typeInfo = catalog.getRoomType(templateTrigger.getAttribute('data-template-type'));
        if (!typeInfo) return;

        try {
          var project = storage.createProject({
            name: typeInfo.defaultName,
            type: typeInfo.id,
            widthCm: typeInfo.widthCm,
            heightCm: typeInfo.heightCm,
            floor: templateTrigger.getAttribute('data-template-floor') || typeInfo.floor
          });
          window.location.href = projectHref(project.id);
        } catch (error) {
          console.warn('[Roomify] Could not start from the template.', error);
          ui.toast(
            error && error.message ? error.message : 'The room could not be created. Try again.',
            { type: 'error' }
          );
        }
        return;
      }

      var deleteTrigger = event.target.closest('[data-delete-id]');
      if (deleteTrigger) {
        requestDelete(deleteTrigger.getAttribute('data-delete-id'));
      }
    });
  }

  /* Init ------------------------------------------------------------------ */

  function init() {
    if (elements.today) {
      elements.today.textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
    }

    if (elements.emptyVisual) {
      elements.emptyVisual.insertAdjacentHTML(
        'afterbegin',
        plan.render(
          {
            type: 'blank',
            room: { widthCm: 400, heightCm: 500, floor: 'oak' }
          },
          { detail: true }
        )
      );
    }

    buildFormOptions();
    renderTemplates();
    renderDashboard();
    updateStorageStatus();
    wireDialogs();
    wirePageEvents();

    if (window.location.hash === '#templates') {
      var templates = document.getElementById('templates');
      if (templates) {
        window.requestAnimationFrame(function () {
          templates.scrollIntoView();
        });
      }
    }

    if (new URLSearchParams(window.location.search).get('new') === '1') {
      window.setTimeout(function () {
        openNewProject();
        try {
          var url = new URL(window.location.href);
          url.searchParams.delete('new');
          window.history.replaceState(null, '', url.href);
        } catch (error) {
          /* The dialog still works when the URL can't be tidied. */
        }
      }, 120);
    }
  }

  init();
})();
