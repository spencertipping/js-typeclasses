// JavaScript typeclass implementation
// Created by Spencer Tipping, licensed under the terms of the MIT source code license.

// Overview
//
// A typeclass is a collection of methods and attributes that apply to an object of a given type. So, for instance, if we have some object X, it is unclear
// whether a given operation is supported because we have no information about its type. However, given that X is an integer, the expression "X + 3" becomes
// meaningful. Asserting that an object belongs to a given type makes available methods and attributes reflecting that assertion. Since JavaScript has no
// variable-level type information (i.e. it is dynamically typed), these assertions apply to individual objects and bypass the prototype system.

   var tc = {

// The Typeclass typeclass
//
// In the spirit of reflection, I'm defining a typeclass that represents the operations that can be performed on typeclasses. First, typeclasses can be
// installed and removed from objects -- this entails doing some typeclass-specific stuff if the typeclass requires it and then automatically adding or removing
// methods. Next, typeclasses can be checked for compatibility. This is important because some typeclasses have prerequisites; one example of a real-world
// typeclass with prerequisites is a bijection to the integers; this requires that the type be ordinal.
//
// One rule of typeclasses is that methods and properties specified statically cannot be replaced; that is, if you have an object that is joining a typeclass
// and the object and typeclass both define some value, then an error will be produced indicating that the typeclass causes a collision. The purpose of a
// typeclass is to /extend/ an object's functionality, but never to change it. As such, there is no method overloading and no value clobbering.

     typeclass_t: {
       add: function (obj) {

       },

       remove: function (obj) {

       },

       has_conflicts: function (obj) {

       },

       has_prerequisites: function (obj) {
         
       }
     }

 };