// JavaScript typeclass implementation
// Created by Spencer Tipping, licensed under the terms of the MIT source code license.

// Overview
//
// A typeclass is a collection of methods and attributes that apply to an object of a given type. So, for instance, if we have some object X, it is unclear
// whether a given operation is supported because we have no information about its type. However, given that X is an integer, the expression "X + 3" becomes
// meaningful. Asserting that an object belongs to a given type makes available methods and attributes reflecting that assertion. Since JavaScript has no
// variable-level type information (i.e. it is dynamically typed), these assertions apply to individual objects and bypass the prototype system.

   var tc = {};

// The Attachable typeclass
//
// In the spirit of reflection, I'm defining a typeclass that represents the operations that can be performed on typeclasses. First, typeclasses can be
// installed and removed from objects -- this entails doing some typeclass-specific stuff if the typeclass requires it and then automatically adding or removing
// methods. Next, typeclasses can be checked for compatibility. This is important because some typeclasses have prerequisites; one example of a real-world
// typeclass with prerequisites is a bijection to the integers; this requires that the type be ordinal.
//
// One rule of typeclasses is that methods and properties specified statically cannot be replaced; that is, if you have an object that is joining a typeclass
// and the object and typeclass both define some value, then an error will be produced indicating that the typeclass causes a collision. The purpose of a
// typeclass is to /extend/ an object's functionality, but never to change it. As such, there is no method overloading and no value clobbering.
//
// That said, we need to build up to the point where checking makes sense. Each typeclass belongs to the 'typeclass' typeclass. This will make more sense in
// code than in English.

    tc.bind = function (f, t) {
      return function () {return f.apply (t, arguments);};
    };

    tc.attachable = {
      members: {
        attach: function (obj) {
          // Naively assume that we're not causing problems. The /this/ reference will be bound to the object directly, not to one of the objects here.
          for (var k in this.members)
            if (this.members[k].constructor === Function) obj[k] = tc.bind (this.members[k], obj);
            else                                          obj[k] = this.members[k];
        },

        detach: function (obj) {
          // Assume that the members did not overwrite anything. Later on we will implement checking.
          for (var k in this.members) delete obj[k];
        }
      }
    };

    // The attachable typeclass is itself attachable. This is the only bootstrapped component; everything else is legitimately within the framework.
    tc.bind (tc.attachable.members.attach, tc.attachable) (tc.attachable);

// The AddableWithHooks typeclass
//
// This typeclass allows hooks to be set when it is attached or detached from an object. The hooks have the option of throwing an error or triggering other
// actions, but their return values are discarded.

    tc.addable_with_hooks = {
      members: {
        add: function () {
          for (var i = 0, l = arguments.length; i < l; ++i) {
            for (var j = 0, lh = this.before_add_hooks.length; j < lh; ++j)
              this.before_add_hooks[j].apply (this, [arguments[i]]);

            this.attach (arguments[i]);

            for (var j = 0, lh = this.after_add_hooks.length; j < lh; ++j)
              this.after_add_hooks[j].apply (this, [arguments[i]]);
          }
        },

        remove: function () {
          for (var i = 0, l = arguments.length; i < l; ++i) {
            for (var j = 0, lh = this.before_remove_hooks.length; j < lh; ++j)
              this.before_remove_hooks[j].apply (this, [arguments[i]]);

            this.detach (arguments[i]);

            for (var j = 0, lh = this.after_remove_hooks.length; j < lh; ++j)
              this.after_remove_hooks[j].apply (this, [arguments[i]]);
          }
        }
      }
    };

    tc.attachable.attach (tc.addable_with_hooks);
    tc.addable_with_hooks.attach (tc.addable_with_hooks);

    // The arrays are initialized by this constructor.
    tc.addable_with_hooks.before_add_hooks = [function (obj) {
      obj.before_add_hooks    = obj.before_add_hooks    || [];
      obj.after_add_hooks     = obj.after_add_hooks     || [];
      obj.before_remove_hooks = obj.before_remove_hooks || [];
      obj.after_remove_hooks  = obj.after_remove_hooks  || [];
    }];

    tc.addable_with_hooks.after_add_hooks = [];

    tc.addable_with_hooks.add (tc.attachable, tc.addable_with_hooks);

// Introspection
//
// A typeclass needs to be able to determine (1) whether it has already been installed on an object, and (2) whether it collides with an object. These
// operations are called "introspection."

    tc.is_introspective = {
      members: {
        collides_with: function (obj) {
          for (var k in this.members) if (obj[k] !== undefined) return true;
          return false;
        },

        implemented_on: function (obj) {
          // Note that if another equivalent typeclass provides these methods or members, that's OK. All we care about is whether the members
          // exist. Realistically, we have no good way of determining whether the typeclass has actually been installed without installing some form of explicit
          // RTTI because functions are opaquely bound and values may have been altered.
          //
          // One exception: The empty typeclass is not implemented on anything. This is because the only reason one would have an empty typeclass is to
          // provide a constructor, which is a legitimate use. In this case, we cannot make any assumptions about whether the typeclass has been applied to an
          // object, so we must re-apply.
          var any_members = false;
          for (var k in this.members) if ((any_members = true) && obj[k] === undefined) return false;
          return any_members;
        }
      }
    };

    // Something of a kludge here because we need to keep updating all of the typeclass parts. Later on, all of these elements will be unified into a proper
    // Typeclass type.
    tc.attachable.add (tc.is_introspective);
    tc.addable_with_hooks.add (tc.is_introspective);
    tc.is_introspective.add (tc.attachable, tc.addable_with_hooks, tc.is_introspective);

// Hooks to provide useful behavior
//
// Some examples of useful behavior are collision-detection, construction and destruction, and prerequisite inclusion or failure. Collision detection will
// determine whether there are any shadowing members being added by a typeclass and will raise an error to prevent overloading. This is important because a
// typeclass is never supposed to replace anything.
//
// Constructors, so to speak, and destructors, are just add_hooks and remove_hooks that are reverse-bound; that is, /this/ is the object and the typeclass is
// passed in as the parameter. How are constructor arguments passed? Later on, in the section about generator functions, I'll define the conventions used to
// store per-object constructor data. The short answer is that each object receives a hash when it is created, and this hash is stored for the object's
// lifetime. This is all handled in a standardized way, so accessing constructor arguments involves saying something like "this.constructor_args". Naturally,
// these parameters are passed by-name and not by-position.
//
// There are two ways prerequisites can be handled. Suppose typeclass B requires that an object have the methods specified by typeclass A. There can be an
// add_hook on typeclass B that adds A to the object first if necessary, which is quite a fine way to handle the situation. However, suppose the typeclass (here
// my usage diverges from Haskell's idea of a typeclass) is actually the implementation for something such as, for instance, ordering of a set, and a different
// typeclass is used depending on the type of the object. In this case, it is not necessarily obvious which typeclass to add to the object to satisfy the
// prerequisite, so the best choice may simply be to raise an error.
//
// The bottom line is that in general, you need to be aware of the prerequisites of a typeclass before using it and you should be prepared to manually extend
// the object beforehand using a separate typeclass.

    tc.detect_collisions = function (obj) {
      for (var k in this.members)
        if (obj[k] !== undefined) throw {error:     "tc.detect_collisions: Colliding attribute: " + k,
                                         obj:       obj,
                                         typeclass: this};
    };

    tc.requires = function () {
      var external_args = arguments;

      return function (obj) {
        // Takes any number of typeclasses and ensures that each one exists.
        for (var i = 0, l = external_args.length; i < l; ++i)
          if (! external_args[i].implemented_on (obj)) throw {error:     "tc.requires: Object did not implement required typeclass.",
                                                              object:    obj,
                                                              typeclass: external_args[i]};
      };
    };

    tc.brings = function () {
      var external_args = arguments;

      return function (obj) {
        for (var i = 0, l = external_args.length; i < l; ++i)
          if (! external_args[i].implemented_on (obj)) external_args[i].add (obj);
      };
    };

    tc.constructor = tc.destructor = function (f) {
      // Wraps f so that it can be used as an add_hook or remove_hook but it behaves as a constructor or destructor.
      return function (obj) {
        f.apply (obj, [this]);
      };
    };

// The Typeclass typeclass
//
// Finally we can combine all of this stuff to produce the Typeclass typeclass. This typeclass is not particularly different from other typeclasses, but it does
// provide some nice features such as integrated requisition processing, constructor and destructor support, and collision detection.

    tc.typeclass = {
      members: {
        brings:          function () {this.before_add_hooks.push (tc.brings.apply (this, arguments)); return this;},
        requires:        function () {this.before_add_hooks.push (tc.requires.apply (this, arguments)); return this;},
        add_constructor: function (f) {this.after_add_hooks.push (tc.constructor (f)); return this;},
        add_destructor:  function (f) {this.before_remove_hooks.push (tc.destructor (f)); return this;},
        add_member:      function (name, value) {this.members[name] = value; return this;},

        remove_member:   function (name) {
          var member = this.members[name];
          delete this.members[name];
          return member;
        },

        create:          function (obj) {
          // A convenient way to create an instance of a typeclass. The object is optional; if not provided, then a regular old Object will be used.
          if (! obj) obj = new Object ();
          this.add (obj);
          return obj;
        }
      }
    };

    // Some weird bootstrapping logic. First, we need to make sure that we can add the Typeclass typeclass to objects that should be typeclasses. Next, we need
    // to make sure it has add/remove hooks. Then, we need to add it to itself so that its constructor brings it along.
    tc.attachable.attach (tc.typeclass);
    tc.addable_with_hooks.add (tc.typeclass);
    tc.typeclass.attach (tc.typeclass);

    // OK, so build the typeclass from the ground up, and then make sure that it is a member of its own typeclass.
    tc.typeclass.brings (tc.attachable, tc.addable_with_hooks, tc.is_introspective);
    tc.typeclass.add_constructor (function () {
      if (! this.members) this.members = {};
    });
    tc.typeclass.add (tc.typeclass);

// Making things consistent
//
// Each one of the original attachable entities is in fact a real typeclass, or it should be. So we need to make that true now. After this, the Typeclass
// typeclass is properly implemented by all typeclasses in existence, and new typeclasses may be created by tc.typeclass.create.

    tc.typeclass.add (tc.attachable, tc.addable_with_hooks, tc.is_introspective);

// Classes and initializers
//
// When an object is created, its constructor_args attribute is set to the parameter hash given to the constructor function. Then, constructors have access to
// those parameters and may perform any additional initialization.

    tc.class_generator = function (base_class) {
      // This is tricky. The function created below will have a /this/ reference of Window. Since the function is itself a typeclass, it will have attributes
      // such as add_constructor, brings, requires, etc; however, a bound wrapper function will have no such attributes. So if the function were to use /this/ to
      // create() the resulting object, then the /this/ would have to refer to the bound result, which entails another binding ad infinitum. Rather than doing
      // this, we simply create an explicit reference and refer to it externally without a function binding.
      var result = tc.typeclass.create (function (args) {
        var new_object = (base_class || Object) ();
        new_object.constructor_args = args;
        return result.create (new_object);
      });

      return result;
    };
