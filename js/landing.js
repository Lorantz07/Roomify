/* ==========================================================================
   Roomify — Landing page interactions
   ========================================================================== */

(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Reveal elements as they enter the viewport. --------------------------- */
  var revealNodes = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));

  if (!('IntersectionObserver' in window) || prefersReducedMotion) {
    revealNodes.forEach(function (node) {
      node.classList.add('is-visible');
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );

    revealNodes.forEach(function (node) {
      revealObserver.observe(node);
    });
  }

  /* Animate the sample plan's furniture once it is in view. -------------- */
  var planIllustration = document.querySelector('.plan-illustration');

  if (planIllustration) {
    if (!('IntersectionObserver' in window) || prefersReducedMotion) {
      planIllustration.classList.add('is-visible');
    } else {
      var planObserver = new IntersectionObserver(
        function (entries, observer) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          });
        },
        { rootMargin: '0px 0px -12% 0px', threshold: 0.15 }
      );

      planObserver.observe(planIllustration);
    }
  }

  /* Inspiration filters. -------------------------------------------------- */
  var filterButtons = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
  var studiesContainer = document.querySelector('[data-studies]');
  var studies = Array.prototype.slice.call(document.querySelectorAll('.study'));
  var countLabel = document.querySelector('[data-study-count]');

  if (countLabel) {
    countLabel.setAttribute('aria-live', 'polite');
  }

  function updateStudyCount(total) {
    if (!countLabel) return;
    countLabel.textContent = String(total).padStart(2, '0') + (total === 1 ? ' study' : ' studies');
  }

  function applyFilter(value) {
    if (!studiesContainer) return;

    var visible = [];

    studies.forEach(function (study) {
      var matches = value === 'all' || study.getAttribute('data-category') === value;
      study.hidden = !matches;
      study.classList.remove('is-entering');
      if (matches) {
        visible.push(study);
      }
    });

    studiesContainer.setAttribute('data-view', value === 'all' ? 'all' : 'filtered');
    updateStudyCount(visible.length);

    if (!prefersReducedMotion) {
      window.requestAnimationFrame(function () {
        visible.forEach(function (study) {
          void study.offsetWidth;
          study.classList.add('is-entering');
        });
      });
    }
  }

  filterButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      var value = button.getAttribute('data-filter') || 'all';

      filterButtons.forEach(function (other) {
        var active = other === button;
        other.classList.toggle('is-active', active);
        other.setAttribute('aria-pressed', String(active));
      });

      applyFilter(value);
    });
  });
})();
