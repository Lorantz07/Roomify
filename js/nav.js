/* ==========================================================================
   Roomify — Header state, mobile menu and section awareness
   ========================================================================== */

(function () {
  'use strict';

  var header = document.querySelector('[data-header]');
  var menu = document.getElementById('menu-sheet');
  var openButton = document.querySelector('[data-menu-open]');
  var closeButton = document.querySelector('[data-menu-close]');
  var menuLinks = menu ? Array.prototype.slice.call(menu.querySelectorAll('a')) : [];

  if (header) {
    var updateHeader = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 10);
    };

    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
  }

  function openMenu() {
    if (!menu || !openButton) return;
    if (typeof menu.showModal !== 'function') return;

    menu.showModal();
    document.body.classList.add('menu-open');
    openButton.setAttribute('aria-expanded', 'true');

    if (closeButton) {
      closeButton.focus();
    }
  }

  function closeMenu() {
    if (!menu) return;
    if (menu.open) {
      menu.close();
    }
  }

  if (openButton) {
    openButton.addEventListener('click', openMenu);
  }

  if (closeButton) {
    closeButton.addEventListener('click', closeMenu);
  }

  if (menu) {
    menu.addEventListener('close', function () {
      document.body.classList.remove('menu-open');
      if (openButton) {
        openButton.setAttribute('aria-expanded', 'false');
      }
    });

    menu.addEventListener('click', function (event) {
      if (event.target === menu) {
        closeMenu();
      }
    });

    menuLinks.forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
  }

  /* Keep the landing navigation aware of the section in view. */
  var sectionLinks = Array.prototype.slice.call(document.querySelectorAll('[data-section-link]'));

  if (sectionLinks.length && 'IntersectionObserver' in window) {
    var linkBySection = {};

    sectionLinks.forEach(function (link) {
      linkBySection[link.getAttribute('data-section-link')] = link;
    });

    var sections = Object.keys(linkBySection)
      .map(function (id) {
        return document.getElementById(id);
      })
      .filter(Boolean);

    var setActive = function (id) {
      sectionLinks.forEach(function (link) {
        var active = link.getAttribute('data-section-link') === id;
        link.classList.toggle('is-active', active);
        if (active) {
          link.setAttribute('aria-current', 'true');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    };

    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && entry.target.id) {
            setActive(entry.target.id);
          }
        });
      },
      { rootMargin: '-32% 0px -56% 0px', threshold: 0 }
    );

    sections.forEach(function (section) {
      sectionObserver.observe(section);
    });
  }
})();
