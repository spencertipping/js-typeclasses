// JavaScript minimalistic cross-platform library
// Created by Spencer Tipping, licensed under the terms of the MIT source code license.

// Overview
//
// Many actions performed with JavaScript require some form of browser detection. For instance, DOM level-2 event handlers are handled differently on IE than on
// Firefox, AJAX requests are created with different constructors on IE, and obtaining mouse coordinates for mouse events varies as well. This file provides
// facilities to handle these disparities in a minimalistic, low-footprint way.
//
// This file depends on typeclass.js.

    var xp = {};

// AJAX requests
//
// The big thing to do about AJAX requests is to produce a reliable factory for them. After that, there is not much platform-specific behavior that needs to be
// worried about.

    xp.ajax_class = tc.class_generator (() => {
      try {return new XMLHttpRequest ();}                   catch (e) {}
      try {return new ActiveXObject ("Msxml2.XMLHTTP");}    catch (e) {}
      try {return new ActiveXObject ("Microsoft.XMLHTTP");} catch (e) {}

      return null;
    });

// Events
//
// The API for managing events provides a number of interesting issues. One of the worst is figuring out which mouse button was pressed. Another bad one is
// trying to find the coordinates of a mousedown or mouseup event, which can be done reliably only by a lot of finagling. To help with this, this typeclass can
// be added to an event object.

    xp.detects_mouse_button = tc.typeclass.create ().add_member ("is_left_button", function () {
      return this.button < 2;
    }                                              ).add_member ("is_right_button", function () {
      return this.button == 2;
    });

    xp.targeted_event = tc.typeclass.create ().add_member ("actual_target", function () {
      var result = this.target || this.srcElement;
      if (result.nodeType == 3) return result.parentNode;
      else                      return result;
    });

    xp.stoppable_event = tc.typeclass.create ().add_member ("stop", function () {
      (this.stopPropagation && (this.stopPropagation () || true)) || (this.cancelBubble = true);
    });

    xp.accurately_positioned = tc.typeclass.create ().add_member ("real_x", function () {
      // Cross-browser adaptation algorithm courtesy of www.quirksmode.org.
      return this.pageX || (this.clientX + document.body.scrollLeft + document.documentElement.scrollLeft);
    }                                               ).add_member ("real_y", function () {
      return this.pageY || (this.clientY + document.body.scrollTop  + document.documentElement.scrollTop);
    });

    xp.event_wrapper = tc.typeclass.create ().brings (xp.detects_mouse_button, xp.targeted_event, xp.stoppable_event, xp.accurately_positioned);
