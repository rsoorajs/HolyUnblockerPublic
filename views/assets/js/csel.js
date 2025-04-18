/* -----------------------------------------------
/* Authors: OlyB and Yoct
/* GNU Affero General Public License v3.0: https://www.gnu.org/licenses/agpl-3.0.en.html
/* Adapted and modified by Yoct.
/* Settings Menu
/* ----------------------------------------------- */

// Encase everything in a new scope so that variables are not accidentally
// attached to the global scope.
(() => {
// Determine the expiration date of a new cookie.
let date = new Date();
date.setFullYear(date.getFullYear() + 100);
date = date.toUTCString();

// All cookies should be secure and are intended to work in iframes.
const setCookie = (name, value) => {
    document.cookie =
      name +
      `=${encodeURIComponent(value)}; expires=${date}; SameSite=None; Secure;`;
  },
  removeCookie = (name) => {
    document.cookie =
      name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=None; Secure;';
  },
  readCookie = async (name) => {
    // Get the first cookie that has the same name.
    for (let cookie of document.cookie.split('; '))
      if (!cookie.indexOf(name + '='))
        // Return the cookie's stored content.
        return decodeURIComponent(cookie.slice(name.length + 1));
  },
  // Customize the page's title.
  pageTitle = (value) => {
    let tag =
      document.getElementsByTagName('title')[0] ||
      document.createElement('title');
    tag.innerHTML = value;
    document.head.appendChild(tag);
  },
  // Set the page's favicon to a new URL.
  pageIcon = (value) => {
    let tag =
      document.querySelector("link[rel*='icon']") ||
      document.createElement('link');
    tag.rel = 'icon';
    tag.href = value;
    document.head.appendChild(tag);
  },
  // Make a small stylesheet to override a setting from the main stylesheet.
  pageShowAds = () => {
    let advertising = document.createElement('style');
    advertising.id = 'advertising';
    advertising.innerText = '.ad { display:block; }';
    (
      document.head ||
      document.body ||
      document.documentElement ||
      document
    ).appendChild(advertising);
  },
  // Remove the stylesheet made by the function above, if it exists.
  pageHideAds = () => {
    (document.getElementById('advertising') || new Text()).remove();
  },
  // These titles and icons are used as autofill templates by settings.html.
  // The icon URLs and tab titles may need to be updated over time.
  presetIcons = Object.freeze({
    '': ' \n ',
    Google: 'Google \n https://www.google.com/favicon.ico',
    Bing: 'Bing \n https://www.bing.com/sa/simg/favicon-trans-bg-blue-mg-28.ico',
    'Google Drive':
      'Home - Google Drive \n https://ssl.gstatic.com/images/branding/product/2x/drive_2020q4_48dp.png',
    Gmail:
      'Inbox - Gmail \n https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico',
  }),
  // Choose the default transport mode, for proxying, based on the browser.
  // Firefox is not supported by epoxy yet, which is why this is implemented.
  defaultMode = /(?:Chrome|AppleWebKit)\//.test(navigator.userAgent)
    ? 'epoxy'
    : 'libcurl';

// Load a custom page title and favicon if it was previously stored.
readCookie('HBTitle').then((s) => {
  s != undefined && pageTitle(s);
});
readCookie('HBIcon').then((s) => {
  s != undefined && pageIcon(s);
});

// Load the UV transport mode that was last used, or use the default.
readCookie('HBTransport').then((s) => {
  let transportMode = document.querySelector(
    `#uv-transport-list input[value="${s || defaultMode}"]`
  );
  if (transportMode) transportMode.click();
});

// Ads are disabled by default. Load ads if ads were enabled previously.
// Change !== to === here if ads should be enabled by default.
readCookie('HBHideAds').then((s) => {
  s !== 'false'
    ? pageHideAds()
    : pageShowAds(((document.getElementById('hideads') || {}).checked = 0));
});

// Tor is disabled by default. Enable Tor if it was enabled previously.
readCookie('HBUseOnion').then((s) => {
  if (s === 'true') {
    let torCheck = document.getElementById('useonion') || {
      dispatchEvent: () => {},
    };
    torCheck.checked = 1;
    torCheck.dispatchEvent(new Event('change'));
  }
});

// All code below is used by the Settings UI in the navigation bar.
if (document.getElementById('csel')) {
  const attachEventListener = (selector, ...args) =>
      (
        document.getElementById(selector) || document.querySelector(selector)
      ).addEventListener(...args),
    focusElement = document
      .getElementsByClassName('dropdown-settings')[0]
      .parentElement.querySelector("a[href='#']");

  attachEventListener('.dropdown-settings .close-settings-btn', 'click', () => {
    document.activeElement.blur();
  });

  // Allow users to set a custom title with the UI.
  attachEventListener('titleform', 'submit', (e) => {
    e.preventDefault();
    e = e.target.firstElementChild;
    if (e.value) {
      pageTitle(e.value);
      setCookie('HBTitle', e.value);
      e.value = '';
    } else if (confirm('Reset the title to default?')) {
      // Allow users to reset the title to default if nothing is entered.
      focusElement.focus();
      removeCookie('HBTitle');
      pageTitle('Holy Unblocker LTS');
    }
  });

  // Allow users to set a custom favicon with the UI.
  attachEventListener('iconform', 'submit', (e) => {
    e.preventDefault();
    e = e.target.firstElementChild;
    if (e.value) {
      pageIcon(e.value);
      setCookie('HBIcon', e.value);
      e.value = '';
    } else if (confirm('Reset the icon to default?')) {
      //    Allow users to reset the favicon to default if nothing is entered.
      focusElement.focus();
      removeCookie('HBIcon');
      pageIcon('assets/img/icon.png');
    }
  });

  /*

  This is unused in the current settings menu.

  // Allow users to make a new about:blank tab and view the site from there.
  // An iframe of the current page is inserted into the new tab.
  attachEventListener("cselab", "click", () => {
    let win = window.open();
    let iframe = win.document.createElement("iframe");
    iframe.style = "width: 100%; height: 100%; border: none; overflow: hidden; margin: 0; padding: 0; position: fixed; top: 0; left: 0";
    iframe.src = location.href;
    win.document.body.appendChild(iframe);
  });
  */

  // Provides users with a handy set of title and icon autofill options.
  attachEventListener('icon-list', 'change', (e) => {
    let titleform = document.getElementById('titleform'),
      iconform = document.getElementById('iconform');
    [titleform.firstElementChild.value, iconform.firstElementChild.value] = (
      presetIcons[e.target.value] || ' \n '
    ).split(' \n ');
  });

  // Allow users to change the UV transport mode, for proxying, with the UI.
  const uvTransportList = document.getElementById('uv-transport-list');
  uvTransportList.querySelectorAll('input').forEach((element) => {
    element.addEventListener('change', (e) => {
      !uvTransportList.querySelector('input:checked') ||
      e.target.value === defaultMode
        ? removeCookie('HBTransport')
        : setCookie('HBTransport', e.target.value);

      // Only the libcurl transport mode supports Tor at the moment.
      let torCheck = document.getElementById('useonion');
      if (e.target.value !== 'libcurl' && torCheck.checked) torCheck.click();
    });
  });

  // Allow users to toggle ads with the UI.
  attachEventListener('hideads', 'change', (e) => {
    if (e.target.checked) {
      pageHideAds();
      setCookie('HBHideAds', 'true');
    } else {
      pageShowAds();
      setCookie('HBHideAds', 'false');
    }
  });

  /* Allow users to toggle onion routing in Ultraviolet with the UI. Only
   * the libcurl transport mode supports Tor at the moment, so ensure that
   * users are aware that they cannot use Tor with other modes.
   */
  attachEventListener('useonion', 'change', (e) => {
    let unselectedModes = document.querySelectorAll(
      '#uv-transport-list input:not([value=libcurl])'
    );
    if (e.target.checked) {
      let selectedMode = document.querySelector(
        '#uv-transport-list input[value=libcurl]'
      );
      unselectedModes.forEach((e) => {
        e.setAttribute('disabled', 'true');
      });
      selectedMode.click();
      setCookie('HBUseOnion', 'true');
    } else {
      unselectedModes.forEach((e) => {
        e.removeAttribute('disabled');
      });

      // Tor will likely never be enabled by default, so removing the cookie
      // here may be better than setting it to false.
      removeCookie('HBUseOnion');
    }
  });
}
})();
