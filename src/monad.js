// JavaScript monad implementation
// Created by Spencer Tipping, licensed under the terms of the MIT source code license.

// Overview
//
// Haskell's monadic framework can be implemented nicely with the typeclass library. While there is no abstract Monad type as in Haskell, there can be concrete
// implementations that specify the bind and return operators. There are some differences in the protocol that these monads use. First, these monads bind the
// /this/ object of the binding function to the return function of the monad typeclass. This is important because the bind function must be allowed to use the
// /return/ operator of the appropriate monad, and ideally one bind function should be generic across monadic types. Second, the names are different from those
// in Haskell. Instead of using >>= for bind and /return/ for return, I am using the mbind and mreturn methods.

    var mn = {};

// Basic monadic conventions
//
// When you add a monadic typeclass to an object O, O will gain a field called 'monadic_typeclass' that is used to keep track of which monadic typeclass it
// belongs to. (It goes away if/when you remove the monad.) This is used to give the mbind method a way to pass the typeclass to its bound function.

    mn.monadic_typeclass = tc.class_generator (tc.class_generator).add_constructor (function () {
      // The /this/ here is the new monadic typeclass. It accepts as a constructor parameter the new instance of that typeclass. Inside the constructor, the
      // /this/ object is the thing that the monadic typeclass is being added to.
      this.add_constructor (function (monadic_typeclass) {
        this.monadic_typeclass = monadic_typeclass;
      });

      this.add_destructor (function () {
        delete this.monadic_typeclass;
      });

      this.add_member ("mbind",   this.constructor_args.mbind);
      this.add_member ("mreturn", this.constructor_args.mreturn);
    });

// Standard monads
//
// An array monad behaves exactly like the List monad in Haskell. Maybe monads behave the same as well, except that the value may be extracted. This is OK
// because monads are not assumed to insulate processes against stateful behavior (though they may serve this purpose).
//
// The error monad is very cool. It catches any errors that come out of the bind function and stops attempting further processing when one is received. It
// allows retrieval of the value and of the error as well.

    mn.array_monad = mn.monadic_typeclass ({
      mbind: function (f) {
        var result = [];
        for (var i = 0, l = this.length; i < l; ++i)
          result = result.concat (f.apply (this.monadic_typeclass.mreturn, [this[i]]));
        return result;
      },
      
      mreturn: function (x) {
        return this.monadic_typeclass.create ([x]);
      }
    });

    mn.maybe_monad = mn.monadic_typeclass ({
      mbind: function (f) {
        if (this.value !== undefined) return f.apply (this.monadic_typeclass.mreturn, [this.value]);
        else                          return this;
      },

      mreturn: function (x) {
        var result = this.monadic_typeclass.create ();
        result.value = x;
        return result;
      }
    }).add_member ("extract", function () {return this.value;});

    mn.error_monad = mn.monadic_typeclass ({
      mbind: function (f) {
        if (this.error) return this;
        else
          try {return f.apply (this.monadic_typeclass.mreturn, [this.value]);}
          catch (e) {
            var result = this.monadic_typeclass.create ();
            result.error = e;
            return result;
          }
      },

      mreturn: function (x) {
        var result = this.monadic_typeclass.create ();
        result.value = x;
        return result;
      }
    }).add_member ("extract", function () {return this.value;}).
       add_member ("get_error", function () {return this.error;});
