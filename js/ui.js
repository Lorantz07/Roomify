/* ==========================================================================
   Roomify — Small shared UI utilities
   Namespaced under window.Roomify to avoid global pollution.
   ========================================================================== */

(function () {
  'use strict';

  var NS = (window.Roomify = window.Roomify || {});

  var ICONS = {
    check:
      '<svg class="toast__icon" viewBox="0 0 18 18" fill="none" aria-hidden="true">' +
      '<circle cx="9" cy="9" r="7.25" stroke="currentColor" stroke-width="1.1"/>' +
      '<path d="m5.8 9 2.1 2.1 4.3-4.5" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>',
    error:
      '<svg class="toast__icon" viewBox="0 0 18 18" fill="none" aria-hidden="true">' +
      '<circle cx="9" cy="9" r="7.25" stroke="currentColor" stroke-width="1.1"/>' +
      '<path d="M9 5.5v4.2M9 12.3v.1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>' +
      '</svg>'
  };

  function ensureToastRegion() {
    var region = document.querySelector('.toast-region');
    if (region) return region;

    region = document.createElement('div');
    region.className = 'toast-region';
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'false');
    document.body.appendChild(region);
    return region;
  }

  /**
   * Display a short, non-blocking message.
   * @param {string} message
   * @param {{type?: "success"|"error", duration?: number}} [options]
   */
  function toast(message, options) {
    var settings = Object.assign({ type: 'success', duration: 3800 }, options || {});
    var region = ensureToastRegion();
    var node = document.createElement('div');
    var label = document.createElement('span');

    node.className = 'toast' + (settings.type === 'error' ? ' toast--error' : '');
    node.setAttribute('role', settings.type === 'error' ? 'alert' : 'status');
    node.innerHTML = settings.type === 'error' ? ICONS.error : ICONS.check;
    label.textContent = message;
    node.appendChild(label);
    region.appendChild(node);

    var removeTimer = window.setTimeout(function () {
      node.classList.add('toast--leaving');
      window.setTimeout(function () {
        node.remove();
      }, 260);
    }, settings.duration);

    node.addEventListener('click', function () {
      window.clearTimeout(removeTimer);
      node.remove();
    });
  }

  function toDate(value) {
    var date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  /**
   * "Today", "Yesterday", "4 days ago", or a short calendar date.
   */
  function formatRelativeDate(value) {
    var date = toDate(value);
    if (!date) return 'Recently';

    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    var difference = Math.round((today - target) / 86400000);

    if (difference <= 0) return 'Today';
    if (difference === 1) return 'Yesterday';
    if (difference < 7) return difference + ' days ago';

    var sameYear = date.getFullYear() === now.getFullYear();
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: sameYear ? undefined : 'numeric'
    });
  }

  function formatLongDate(value) {
    var date = toDate(value);
    if (!date) return 'Unknown';
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  function setCurrentYear() {
    var year = String(new Date().getFullYear());
    document.querySelectorAll('[data-year]').forEach(function (node) {
      node.textContent = year;
    });
  }

  function escapeHTML(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  setCurrentYear();

  NS.ui = {
    toast: toast,
    formatRelativeDate: formatRelativeDate,
    formatLongDate: formatLongDate,
    escapeHTML: escapeHTML
  };
})();
