/* global NexT: true */

(function () {
  'use strict';

  var THEME_KEY = 'next-theme';
  var THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

  function saveTheme(theme) {
    var data = {
      theme: theme,
      expires: Date.now() + THIRTY_DAYS
    };
    try {
      localStorage.setItem(THEME_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  function getStoredTheme() {
    try {
      var stored = JSON.parse(localStorage.getItem(THEME_KEY) || '{}');
      if (stored.theme && stored.expires && Date.now() <= stored.expires) {
        return stored.theme;
      }
    } catch (e) {}
    return null;
  }

  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme') || 'light';
    var next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    saveTheme(next);
    updateToggleIcon(next);
  }

  function updateToggleIcon(theme) {
    var $icon = $('.theme-toggle i');
    if ($icon.length) {
      $icon.removeClass('fa-moon-o fa-sun-o');
      $icon.addClass(theme === 'dark' ? 'fa-sun-o' : 'fa-moon-o');
    }
  }

  function init() {
    var stored = getStoredTheme();
    var theme = stored || getSystemTheme();
    applyTheme(theme);
    updateToggleIcon(theme);

    if (!stored) {
      var mql = window.matchMedia('(prefers-color-scheme: dark)');
      var listener = function (e) {
        if (!getStoredTheme()) {
          var newTheme = e.matches ? 'dark' : 'light';
          applyTheme(newTheme);
          updateToggleIcon(newTheme);
        }
      };
      if (mql.addEventListener) {
        mql.addEventListener('change', listener);
      } else if (mql.addListener) {
        mql.addListener(listener);
      }
    }

    $(document).on('click', '.theme-toggle', function (e) {
      e.preventDefault();
      toggleTheme();
    });
  }

  NexT.theme = {
    init: init,
    toggle: toggleTheme,
    get: function () {
      return document.documentElement.getAttribute('data-theme') || 'light';
    }
  };

  $(document).ready(init);
})();
