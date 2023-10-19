// ==UserScript==
// @name         Mlogjs Online Editor Ctrl-S to copy
// @version      0.1
// @description  As stated in title
// @author       You
// @match        *://mlogjs.github.io/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    document.addEventListener('keydown', function (e) {
        if(document.location.href.indexOf('editor') != -1 && e.ctrlKey && e.code == 'KeyS') {
            document.getElementsByClassName("bar-actions")[0].getElementsByTagName("button")[2].click()
            e.preventDefault()
            return false
        }
    }, false)
})();