/* global NexT: true */

(function () {
  'use strict';

  var LS_KEY = 'next-language-history';

  function getHistory() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function saveHistory(code) {
    var history = getHistory();
    history[code] = Date.now();
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(history));
    } catch (e) {}
  }

  function getCurrentPath() {
    return window.location.pathname.replace(/\/+/g, '/');
  }

  function stripLangPrefix(path) {
    var parts = path.split('/').filter(Boolean);
    if (parts.length === 0) return '';
    var first = parts[0];
    var isLang = window.NEXT_LANGUAGES && window.NEXT_LANGUAGES.some(function (l) {
      return l.path === first;
    });
    if (isLang) {
      parts.shift();
    }
    return '/' + parts.join('/') + (parts.length > 0 && path.endsWith('/') ? '/' : (parts.length === 0 ? '/' : ''));
  }

  function buildUrl(langCode, langPath) {
    var stripped = stripLangPrefix(getCurrentPath());
    var base = (window.NEXT_BASE || '').replace(/\/$/, '');
    if (langCode === (window.NEXT_SITE_LANG || 'en')) {
      var cleanStripped = stripped === '/' ? '' : stripped;
      return base + cleanStripped;
    }
    var cleanStripped = stripped.replace(/^\//, '');
    return base + '/' + langPath + '/' + cleanStripped;
  }

  function renderList() {
    var $list = $('.language-switcher-list');
    if ($list.length === 0) return;

    var languages = $list.data('languages');
    var current = $list.data('current');
    var history = getHistory();

    var sorted = languages.slice().sort(function (a, b) {
      var ta = history[a.code] || 0;
      var tb = history[b.code] || 0;
      if (tb !== ta) return tb - ta;
      return a.name.localeCompare(b.name);
    });

    $list.empty();
    sorted.forEach(function (lang) {
      var cls = lang.code === current ? 'active' : '';
      $list.append(
        '<li class="' + cls + '">' +
          '<a href="' + buildUrl(lang.code, lang.path) + '" data-lang-code="' + lang.code + '">' +
            lang.name +
          '</a>' +
        '</li>'
      );
    });

    window.NEXT_LANGUAGES = languages;
    window.NEXT_SITE_LANG = $list.data('site-lang');
    window.NEXT_BASE = CONFIG.root || '';
  }

  function bindEvents() {
    $(document).on('click', '.language-switcher-trigger', function (e) {
      e.preventDefault();
      e.stopPropagation();
      $('.language-switcher-list').toggle();
    });

    $(document).on('click', function (e) {
      if (!$(e.target).closest('.language-switcher-wrapper').length) {
        $('.language-switcher-list').hide();
      }
    });

    $(document).on('click', '.language-switcher-list a', function (e) {
      var code = $(this).data('lang-code');
      saveHistory(code);
    });
  }

  function init() {
    renderList();
    bindEvents();
  }

  NexT.language = {
    init: init,
    getHistory: getHistory,
    saveHistory: saveHistory
  };

  $(document).ready(init);
})();
