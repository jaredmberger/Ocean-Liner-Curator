// Ocean Liner Curator Diagnostics
// Save this code as /assets/olc-diagnostics.js

(function () {
"use strict";

window.OLC = window.OLC || {};

OLC.__errors = OLC.__errors || [];

window.addEventListener("error", function(e){
  OLC.__errors.push({
    type:"error",
    message:e.message,
    filename:e.filename,
    line:e.lineno,
    column:e.colno,
    stack:e.error && e.error.stack
  });
});

window.addEventListener("unhandledrejection", function(e){
  OLC.__errors.push({
    type:"promise",
    reason:e.reason,
    stack:e.reason && e.reason.stack
  });
});

OLC.getErrors = function(){
  return OLC.__errors;
};

OLC.clearErrors = function(){
  OLC.__errors.length = 0;
};

OLC.testLogger = function(){
  Promise.reject(new Error("OLC diagnostic test"));
};

OLC.diagnose = function(){

  const report = {
    headerMount: !!document.getElementById("site-header"),
    headerLoaded: !!document.querySelector(".site-header"),
    navLoaded: !!document.querySelector(".site-nav"),
    dropdowns: document.querySelectorAll(".nav-dropdown").length,
    shipData: typeof window.OLC_SHIP_URLS,
    shipCount: Array.isArray(window.OLC_SHIP_URLS) ? window.OLC_SHIP_URLS.length : 0,
    headerHTML: document.getElementById("site-header") ? document.getElementById("site-header").innerHTML.length : 0,
    errors: OLC.__errors
  };

  console.group("Ocean Liner Curator Diagnostics");
  console.table(report);

  if(report.errors.length){
    console.group("Captured Errors");
    console.table(report.errors);
    console.groupEnd();
  }

  console.groupEnd();

  return report;
};

console.log("OLC Diagnostics loaded. Run OLC.diagnose()");
})();