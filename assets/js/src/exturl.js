/* global NexT: true, CONFIG: true */

(function () {
  'use strict';

  var Base64 = {
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    encode: function (e) {
      var t = "";
      var n, r, i, s, o, u, a;
      var f = 0;
      e = Base64._utf8_encode(e);
      while (f < e.length) {
        n = e.charCodeAt(f++);
        r = e.charCodeAt(f++);
        i = e.charCodeAt(f++);
        s = n >> 2;
        o = (n & 3) << 4 | r >> 4;
        u = (r & 15) << 2 | i >> 6;
        a = i & 63;
        if (isNaN(r)) { u = a = 64; }
        else if (isNaN(i)) { a = 64; }
        t = t + this._keyStr.charAt(s) + this._keyStr.charAt(o) + this._keyStr.charAt(u) + this._keyStr.charAt(a);
      }
      return t;
    },
    decode: function (e) {
      var t = "";
      var n, r, i;
      var s, o, u, a;
      var f = 0;
      e = e.replace(/[^A-Za-z0-9+/=]/g, "");
      while (f < e.length) {
        s = this._keyStr.indexOf(e.charAt(f++));
        o = this._keyStr.indexOf(e.charAt(f++));
        u = this._keyStr.indexOf(e.charAt(f++));
        a = this._keyStr.indexOf(e.charAt(f++));
        n = s << 2 | o >> 4;
        r = (o & 15) << 4 | u >> 2;
        i = (u & 3) << 6 | a;
        t = t + String.fromCharCode(n);
        if (u !== 64) { t = t + String.fromCharCode(r); }
        if (a !== 64) { t = t + String.fromCharCode(i); }
      }
      t = Base64._utf8_decode(t);
      return t;
    },
    _utf8_encode: function (e) {
      e = e.replace(/rn/g, "n");
      var t = "";
      for (var n = 0; n < e.length; n++) {
        var r = e.charCodeAt(n);
        if (r < 128) { t += String.fromCharCode(r); }
        else if (r > 127 && r < 2048) {
          t += String.fromCharCode(r >> 6 | 192);
          t += String.fromCharCode(r & 63 | 128);
        } else {
          t += String.fromCharCode(r >> 12 | 224);
          t += String.fromCharCode(r >> 6 & 63 | 128);
          t += String.fromCharCode(r & 63 | 128);
        }
      }
      return t;
    },
    _utf8_decode: function (e) {
      var t = "";
      var n = 0;
      var c1 = 0, c2 = 0, c3 = 0;
      while (n < e.length) {
        c1 = e.charCodeAt(n);
        if (c1 < 128) {
          t += String.fromCharCode(c1);
          n++;
        } else if (c1 > 191 && c1 < 224) {
          c2 = e.charCodeAt(n + 1);
          t += String.fromCharCode((c1 & 31) << 6 | c2 & 63);
          n += 2;
        } else {
          c2 = e.charCodeAt(n + 1);
          c3 = e.charCodeAt(n + 2);
          t += String.fromCharCode((c1 & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
          n += 3;
        }
      }
      return t;
    }
  };

  var SESSION_KEY = 'next-exturl-asked';
  var $currentDialog = null;
  var $lastFocused = null;

  function getSessionAsked() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function markSessionAsked(domain) {
    var asked = getSessionAsked();
    if (asked.indexOf(domain) === -1) {
      asked.push(domain);
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(asked));
      } catch (e) {}
    }
  }

  function isSessionAsked(domain) {
    return getSessionAsked().indexOf(domain) !== -1;
  }

  function extractDomain(url) {
    try {
      var a = document.createElement('a');
      a.href = url;
      return a.hostname || '';
    } catch (e) {
      return '';
    }
  }

  function isWhitelisted(domain) {
    var whitelist = (CONFIG && CONFIG.exturl_whitelist) || [];
    return whitelist.some(function (entry) {
      var d = entry.toLowerCase();
      var target = domain.toLowerCase();
      return target === d || target.length > d.length && target.slice(-(d.length + 1)) === '.' + d;
    });
  }

  function openUrl(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function removeDialog() {
    if ($currentDialog) {
      $currentDialog.remove();
      $currentDialog = null;
      $('body').css('overflow', '');
      if ($lastFocused) {
        try { $lastFocused.focus(); } catch (e) {}
        $lastFocused = null;
      }
    }
    $(document).off('keydown.exturl');
  }

  function confirmOpen(url, domain) {
    markSessionAsked(domain);
    removeDialog();
    openUrl(url);
  }

  function showDialog(url, domain) {
    $lastFocused = document.activeElement;

    var html =
      '<div class="exturl-overlay" role="dialog" aria-modal="true" aria-labelledby="exturl-title">' +
        '<div class="exturl-dialog" role="document">' +
          '<h2 id="exturl-title" class="exturl-title">即将离开本站</h2>' +
          '<p class="exturl-message">您将要访问外部链接：</p>' +
          '<p class="exturl-url" tabindex="0">' + url + '</p>' +
          '<div class="exturl-actions">' +
            '<button type="button" class="exturl-btn exturl-btn-cancel">取消</button>' +
            '<button type="button" class="exturl-btn exturl-btn-confirm">继续访问</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    $currentDialog = $(html).appendTo('body');
    $('body').css('overflow', 'hidden');

    $currentDialog.find('.exturl-btn-cancel').on('click', removeDialog);
    $currentDialog.find('.exturl-btn-confirm').on('click', function () {
      confirmOpen(url, domain);
    });
    $currentDialog.on('click', function (e) {
      if (e.target === this) removeDialog();
    });

    setTimeout(function () {
      $currentDialog.find('.exturl-btn-confirm').focus();
    }, 10);

    $(document).on('keydown.exturl', function (e) {
      if (e.key === 'Escape' || e.keyCode === 27) {
        e.preventDefault();
        removeDialog();
      } else if (e.key === 'Tab' || e.keyCode === 9) {
        var $focusable = $currentDialog.find(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if ($focusable.length === 0) return;
        var first = $focusable[0];
        var last = $focusable[$focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    });
  }

  function handleExtUrlClick(e) {
    e.preventDefault();
    var $this = $(this);
    var encoded = $this.attr('data-url');
    var url = encoded ? Base64.decode(encoded) : $this.attr('href');
    var domain = extractDomain(url);

    if (!url) return;

    if (isWhitelisted(domain)) {
      openUrl(url);
      return;
    }

    if (isSessionAsked(domain)) {
      openUrl(url);
      return;
    }

    showDialog(url, domain);
  }

  $(document).ready(function () {
    $(document).on('click', '.exturl', handleExtUrlClick);
  });

  NexT.exturl = {
    open: openUrl,
    isWhitelisted: isWhitelisted,
    decode: Base64.decode
  };
})();
