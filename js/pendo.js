(function loadPendo(apiKey) {
  if (!apiKey || apiKey === "YOUR_PENDO_API_KEY") {
    window.__pendoReady = false;
    return;
  }

  (function (p, e, n, d, o) {
    var v, w, x, y, z;
    o = p[d] = p[d] || {};
    o._q = o._q || [];
    v = ["initialize", "identify", "updateOptions", "pageLoad", "track", "trackAgent"];
    for (w = 0, x = v.length; w < x; ++w)
      (function (m) {
        o[m] =
          o[m] ||
          function () {
            o._q[m === v[0] ? "unshift" : "push"]([m].concat([].slice.call(arguments, 0)));
          };
      })(v[w]);
    y = e.createElement(n);
    y.async = !0;
    y.src = "https://cdn.pendo.io/agent/static/" + apiKey + "/pendo.js";
    z = e.getElementsByTagName(n)[0];
    z.parentNode.insertBefore(y, z);
  })(window, document, "script", "pendo");

  window.__pendoReady = true;
})('94cd93f4-7b59-4c58-88df-36b4a00149aa');

function pendoVisitorPayload(session) {
  return {
    visitor: {
      id: session.visitorId,
      email: session.email,
      full_name: session.name,
      role: session.role,
    },
    account: {
      id: window.APP_CONFIG.accountId,
      name: window.APP_CONFIG.accountName,
      planLevel: "qa",
    },
  };
}

function initPendo(session) {
  if (!window.__pendoReady || typeof window.pendo === "undefined") return;
  window.pendo.initialize(pendoVisitorPayload(session));
}

function identifyPendo(session) {
  if (!window.__pendoReady || typeof window.pendo === "undefined") return;
  window.pendo.identify(pendoVisitorPayload(session));
}

function trackPendo(event, metadata) {
  if (!window.__pendoReady || typeof window.pendo === "undefined") return;
  window.pendo.track(event, metadata || {});
}
