// JavaScript run-time type information library
// Created by Spencer Tipping, licensed under the terms of the MIT source code license.

// Overview
//
// The current typeclass implementation is naive about the way it handles adding a typeclass to an object. For instance, if you add a typeclass with no members,
// then its constructors are always run. Working within the framework, there isn't a very good way to circumvent these problems; however, by adding an RTTI
// attribute to an object, we can track which typeclasses are present and which ones are not.
//
// The underlying mechanism here is that we have an RTTI typeclass that implements the methods for the RTTI attribute of an object. So, for instance, it
// provides things like "added", "is_present", etc. Correspondingly, there is a typeclass that adds RTTI tracking to an object. To use it, you would say
// something like this:
//
//   var x = rtti.tracked.create (my_class ());
//
// Typeclasses that rely on the RTTI framework should bring() the RTTI tracker.

    var rtti = {};

// The RTTI-enabled typeclass
//
// Typeclasses defined in typeclass.js are not aware of RTTI, so they do not by default activate RTTI triggers. However, if you create an rtti_typeclass instead
// of a regular typeclass, then you get RTTI tracking for free. So, for instance, you can do this:
//
//   var r = rtti.typeclass.create ();
//   var i = r.create ();
//   i.rtti.is_present (r)  // => true
//
// Internally, one important step allows the algorithmic efficiency to jump from linear to constant-time. Each RTTI-enabled typeclass is assigned a unique
// string name so that a hash can be used to store RTTI information.

    rtti.unique_id = 0;

    rtti.typeclass = tc.typeclass.create ().add_constructor (function () {
      this.unique_id = String (++rtti.unique_id);
      this.brings (rtti.tracked);

      this.add_constructor (function (rtti_typeclass) {this.rtti.added   (rtti_typeclass);});
      this.add_destructor  (function (rtti_typeclass) {this.rtti.removed (rtti_typeclass);});
    });

// The RTTI tracker
//
// This object just needs to keep track of which typeclasses have been added and which ones haven't.

    rtti.tracker = tc.class_generator ().add_constructor (function () {
      if (! this.present_typeclasses) this.present_typeclasses = {};
    });

    rtti.tracker.add_member ("added",      function (t) {this.present_typeclasses[t.unique_id] = t;});
    rtti.tracker.add_member ("removed",    function (t) {delete this.present_typeclasses[t.unique_id];});
    rtti.tracker.add_member ("is_present", function (t) {return this.present_typeclasses[t.unique_id] !== undefined;});

// Tracking RTTI on an object
//
// Ensures that an object provides the rtti attribute.

    rtti.tracked = tc.typeclass.create ().add_constructor (function () {this.rtti = rtti.tracker ();});
    rtti.tracked.add_destructor                           (function () {delete this.rtti;});
