import LocalStrategy from 'passport-local';
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

// Load user model
import User from '../app/models/user.model.js';
import Role from '../app/models/role.model.js';
import Language from '../app/models/language.model';
// Load subscriber model
// import Subscriber from '../app/models/subscriber.model.js';

var jwt = require('jsonwebtoken');
import config from './config.json'
import configAuth from './social.auth.config.js'

export default (passport) => {

  // Define length boundariess for expected parameters
  let bounds = {
    username: {
      minLength: 3,
      maxLength: 50
    },
    password: {
      minLength: 6,
      maxLength: 128
    },
    email: {
      minLength: 5,
      maxLength: 256
    }
  };

  // Function to check a string against a REGEX for email validity
  let validateEmail = (email) => {
    let re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    return re.test(email);
  };

  // Helper function to validate string length
  let checkLength = (string, min, max) => {

    // If the string is outside the passed in bounds...
    if (string.length > max || string.length < min)
      return false;
    else
      return true;
  };

  // # Passport Session Setup

  // *required for persistent login sessions*

  // Passport needs the ability to serialize and deserialize users out of
  // session data

  // ## Serialize User
  passport.serializeUser((user, done) => {

    let sessionUser = {

      _id: user._id,

      username: user.username,

      role: user.role
    };

    done(null, sessionUser);
  });

  // ## Deserialize User
  passport.deserializeUser((sessionUser, done) => {

    // The sessionUser object is different from the user mongoose
    // collection

    // It is actually req.session.passport.user and comes from the
    // session collection
    done(null, sessionUser);
  });

  // # Local Signup

  // We are using named strategies since we have one for login and one
  // for signup

  // By default, if there is no name, it would just be called 'local'

  passport.use('local-signup', new LocalStrategy({

      // By default, the local strategy uses username and password
      usernameField: 'username',

      passwordField: 'password',

      // Allow the entire request to be passed back to the callback
      passReqToCallback: true
    },

    (req, username, password, done, ) => {

      // ## Data Checks

      // If the length of the username string is too long/short,
      // invoke verify callback
      if (!checkLength(username, bounds.username.minLength, bounds.username.maxLength)) {

        // ### Verify Callback

        // Invoke `done` with `false` to indicate authentication
        // failure
        return done(null,
          false,

          // Return info message object
          {
            signupMessage: 'Invalid username length.'
          }
        );
      }

      // If the length of the password string is too long/short,
      // invoke verify callback
      if (!checkLength(password, bounds.password.minLength, bounds.password.maxLength)) {

        // ### Verify Callback

        // Invoke `done` with `false` to indicate authentication
        // failure
        return done(null,

          false,

          // Return info message object
          {
            signupMessage: 'Invalid password length.'
          }
        );
      }

      // If the length of the email string is too long/short,
      // invoke verify callback
      if (!checkLength(req.body.email, bounds.email.minLength, bounds.email.maxLength)) {

        // ### Verify Callback

        // Invoke `done` with `false` to indicate authentication
        // failure
        return done(null,

          false,

          // Return info message object
          {
            signupMessage: 'Invalid email length.'
          }
        );
      }

      // If the string is not a valid email...
      if (!validateEmail(req.body.email)) {

        // ### Verify Callback

        // Invoke `done` with `false` to indicate authentication
        // failure
        return done(null,

          false,

          // Return info message object
          {
            signupMessage: 'Invalid email address.'
          }
        );
      }

      // Asynchronous
      // User.findOne will not fire unless data is sent back
      process.nextTick(() => {

        // Find a user whose email or username is the same as the passed
        // in data

        // We are checking to see if the user trying to login already
        // exists
        User.findOne({

          // Model.find `$or` Mongoose condition
          $or: [{
              'username': username
            },
            {
              'email': req.body.email
            }
          ]
        }, (err, user) => {

          // If there are any errors, return the error
          if (err)
            return done(err);

          // If a user exists with either of those ...
          if (user) {

            // ### Verify Callback

            // Invoke `done` with `false` to indicate authentication
            // failure

            // return res.json({ signupMessage : 'That username/email is already ' +
            // 'taken.' });

            return done(null,

              false,

              // Return info message object
              {
                signupMessage: 'That username/email is already ' +
                  'taken.'
              }
            );



          } else {

            // If there is no user with that email or username...

            // Create the user
            let newUser = new User();

            // Set the user's local credentials

            // Combat case sensitivity by converting username and
            // email to lowercase characters
            newUser.local.username = username.toLowerCase();
            newUser.local.email = req.body.email.toLowerCase();
            newUser.role = req.body.role;
            newUser.first_name = req.body.first_name;
            newUser.last_name = req.body.last_name;
            newUser.designation = req.body.designation;
            newUser.is_enabled = req.body.is_enabled;

            // Hash password with model method
            newUser.local.password = newUser.generateHash(password);
            // newUser.role="admin";
            // Save the new user
            newUser.save((err) => {

              if (err)
                throw err;

              return done(null, newUser);
            });
          }
        });
      });
    }));

  // # Local Login

  // We are using named strategies since we have one for login and one
  // for signup

  // By default, if there is no name, it would just be called 'local'

  passport.use('local-login', new LocalStrategy({
      usernameField: 'username',
      passwordField: 'password',
      passReqToCallback: true
    },

    (req, username, password, done) => {
      if (!checkLength(username, bounds.username.minLength, bounds.email.maxLength)) {
        return done(null,
          false,

          {
            loginMessage: 'Invalid username/email length.'
          }
        );
      }
      if (!checkLength(password, bounds.password.minLength, bounds.password.maxLength)) {
        return done(null,

          false,

          {
            loginMessage: 'Invalid password length.'
          }
        );
      }

      User.findOne({

        $or: [{
            'local.username': username.toLowerCase()
          },
          {
            'local.email': username.toLowerCase()
          }
        ]
      }, (err, user) => {

        if (err)
          return done(err);
        if (!user) {

          return done(null, false, {
            loginMessage: 'That user was not found. ' +
              'Please enter valid user credentials.'
          });
        }

        if (!user.validPassword(password)) {

          return done(null, false, {
            loginMessage: 'Invalid password entered.'
          });
        }

        Role.findOne({
            _id: user.role
          })
          .populate({
            path: 'full_generation'
          })
          .populate({
            path: 'menu._id',
            select: 'name path '
          })
          .then((role) => {
            if (err) {
              return done(null, false, {
                loginMessage: 'No role is assigned'
              })
            } else {
              Language.find((err, languages) => {
                if (err) {
                  console.log()
                  res.send(err)
                }
                // res.json(languages)
                let newUserObject = {
                  _id: user._id,
                  first_name: user.first_name,
                  last_name: user.last_name,
                  languages: languages,
                  local: {
                    email: user.local.email,
                    password: user.local.password,
                    username: user.local.username,
                  },

                  role: {
                    _id: role._id,
                    created_at: role.created_at,
                    full_generation: role.full_generation,
                    name: role.name,
                    updated_at: role.updated_at,
                    menu: role.menu.map(mnu => {
                      return {
                        _id: mnu._id._id,
                        name: mnu._id.name,
                        path: mnu._id.path,
                        permissions: mnu.permissions
                      }
                    })
                  }
                };
                return done(null, newUserObject);
              })
            }
          })
      });
    }));

  //*********************Facebook Strategy*********************

  passport.use(new FacebookStrategy({
      clientID: configAuth.facebookAuth.clientID,
      clientSecret: configAuth.facebookAuth.clientSecret,
      callbackURL: configAuth.facebookAuth.callbackURL,
      profileFields: ['id', 'email', 'displayName', 'name', 'gender', 'photos']
    },

    // facebook will send back the token and profile
    function (token, refreshToken, profile, done) {

      // asynchronous
      let profileInfo = profile._json;

      process.nextTick(() => {
        Subscriber.findOne({
          $or: [{
              'facebook.id': profile.id
            },

            {
              'facebook.email': profile.email
            }
          ]
        }, (err, subscriber) => {
          if (err)
            return done(err);
          if (subscriber) {
            return done(null, subscriber);
          } else {
            let newSubscriber = new Subscriber();
            newSubscriber.facebook.id = profileInfo.id;
            newSubscriber.facebook.username = profileInfo.displayName;
            newSubscriber.facebook.email = profileInfo.email;
            newSubscriber.first_name = profileInfo.first_name;
            newSubscriber.last_name = profileInfo.last_name;
            newSubscriber.save((err) => {
              if (err) {
                throw err;
              }
              return done(null, newSubscriber);
            });
          }
        });
      });
    }
  ));


  //*********************GOOGLE Strategy*********************

  passport.use(new GoogleStrategy({
      clientID: configAuth.googleAuth.clientID,
      clientSecret: configAuth.googleAuth.clientSecret,
      callbackURL: configAuth.googleAuth.callbackURL,
    },
    function (accessToken, refreshToken, profile, done) {

      // asynchronous
      let profileInfo = profile._json;

      process.nextTick(() => {
        Subscriber.findOne({
          $or: [{
              'google.id': profile.id
            },
            {
              'google.email': profile.emails[0].value
            }
          ]
        }, (err, subscriber) => {
          if (err)
            return done(err);
          if (subscriber) {
            return done(null, subscriber);
          } else {
            let newSubscriber = new Subscriber();
            newSubscriber.google.id = profileInfo.id;
            newSubscriber.google.username = profileInfo.displayName;
            newSubscriber.google.email = profile.emails[0].value;
            newSubscriber.first_name = profileInfo.name.givenName;
            newSubscriber.last_name = profileInfo.name.familyName;
            newSubscriber.save((err) => {
              if (err) {
                throw err;
              }
              return done(null, newSubscriber);
            });
          }
        });
      });
    }
  ));

  // auth for admin local-auth-change-password

  passport.use('local-auth-change-password', new LocalStrategy({

    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true

  }, (req, username, password, done) => {
    if (!checkLength(username, bounds.username.minLength, bounds.email.maxLength)) {
      return done(null,
        false, {
          loginMessage: 'Invalid username/email length.'
        }
      );
    }
    if (!checkLength(password, bounds.password.minLength, bounds.password.maxLength)) {
      return done(null,

        false, {
          loginMessage: 'Invalid password length.'
        }
      );
    }

    User.findOne({
      $or: [

        {
          'local.username': username.toLowerCase()
        },
        {
          'local.email': username.toLowerCase()
        }
      ]
    }, (err, user) => {

      if (err)
        return done(err);
      if (!user) {

        return done(null, false, {
          loginMessage: 'That user was not found. ' +
            'Please enter valid user credentials.'
        });
      }
      if (!user.validPassword(password))
        return done(null, false, {
          loginMessage: 'Invalid password entered.'
        });
      else {

        let passwords = req.body.passwords.password;
        user.local.password = user.generateHash(passwords);
        user.save((err) => {
          if (err) {
            return done(err);
          } else {
            return done(null, user);
          }
        });

      }
    });
  }));


  // *************************LocalStrategy for Subscriber Signup*********

  passport.use('local-subscriber-signup', new LocalStrategy({
      usernameField: 'username',
      passwordField: 'password',
      passReqToCallback: true
    },

    (req, username, password, done, ) => {

      if (!checkLength(username, bounds.username.minLength, bounds.username.maxLength)) {
        return done(null,
          false, {
            signupMessage: 'Invalid username length.'
          }
        );
      }

      if (!checkLength(password, bounds.password.minLength, bounds.password.maxLength)) {
        return done(null,
          false, {
            signupMessage: 'Invalid password length.'
          }
        );
      }

      process.nextTick(() => {
        Subscriber.findOne({
          $or: [{
            'username': username
          }, {
            'phone_number': username
          }, {
            'email': username
          }
        ]
          
        }, (err, subscriber) => {
          if (err)
            return done(err);
          if (subscriber) {
            return done(null,
              false, {
                signupMessage: 'That phone/email is already ' +
                  'taken.'
              }
            );
          } else {
            let newSubscriber = new Subscriber();
            newSubscriber.first_name = req.body.first_name;
            newSubscriber.username = username;
            newSubscriber.is_verified = req.body.no_need_verify ? true : false;
            newSubscriber.created_by_admin = req.body.no_need_verify ? true : false;
            newSubscriber.email = req.body.email ? req.body.email : '';
            newSubscriber.phone_number = req.body.phone_number ? req.body.phone_number : '';
            newSubscriber.verification_code = req.body.provider == "local_phone" ? Math.floor(Math.random() * 89999 + 100000) : Math.floor(Math.random() * 89999 + 100000);
            newSubscriber.referral_code = (Date.now().toString(36) + Math.random().toString(36).substr(2, 5)).toUpperCase();
            newSubscriber.provider = req.body.provider;
            newSubscriber.password = newSubscriber.generateHash(password);

            newSubscriber.address = req.body.address;
            newSubscriber.qrCode = req.body.qrCode;
            newSubscriber.profession = req.body.profession;
            newSubscriber.message = req.body.message;

            newSubscriber.save((err) => {
              if (err)
                throw err;

              return done(null, newSubscriber);
            });
          }
        });
      });
    }));


  //*************************LocalStrategy for Subscriber Login*********//

  passport.use('local-subscriber-login', new LocalStrategy({

    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true

  }, (req, username, password, done) => {

    if (!checkLength(username, bounds.username.minLength, bounds.email.maxLength)) {
      return done(null,
        false, {
          loginMessage: 'Invalid phone/email length.'
        }
      );
    }
    if (!checkLength(password, bounds.password.minLength, bounds.password.maxLength)) {
      return done(null,

        false, {
          loginMessage: 'Invalid password length.'
        }
      );
    }
    Subscriber.findOne({
      'username': username // }, { phone_number: username }, { email: username }]
    }, (err, subscriber) => {
      if (err)
        return done(err);
      if (!subscriber) {
        Subscriber.findOne({
          phone_number: username
        }, (err, subscriber) => {
          if (err)
            return done(err);
          if (!subscriber) {
            Subscriber.findOne({
              email: username
            }, (err, subscriber) => {
              if (err)
                return done(err);
              if (!subscriber) {
                return done(null, false, {
                  loginMessage: 'That user was not found. ' +
                    'Please enter valid user credentials.',
                  status_code: 418
                });
              }
              if (!subscriber.validPassword(password))
                return done(null, false, {
                  loginMessage: 'Invalid password entered.',
                  status_code: 419
                });

              if (subscriber.is_close) {
                return done(null, false, {
                  loginMessage: "Your Account is closed, Please Contact BoiBazar.com team to re-open",
                  status_code: 421
                });
              } else if (!subscriber.is_verified) {
                if (isNaN(username)) {
                  return done(null, false, {
                    loginMessage: "Email is not verified. Please verify first",
                    subscriber_first_name: subscriber.first_name,
                    subscriber_email: subscriber.email,
                    subscriber_id: subscriber.id,
                    subscriber_username: subscriber.username,
                    subscriber_phone_number: subscriber.phone_number,
                    status_code: 4201
                  });
                } else {
                  return done(null, false, {
                    loginMessage: "Phone Number is not verified. Please verify first",
                    subscriber_first_name: subscriber.first_name,
                    subscriber_email: subscriber.email,
                    subscriber_id: subscriber.id,
                    subscriber_username: subscriber.username,
                    subscriber_phone_number: subscriber.phone_number,
                    status_code: 4202
                  });
                }
              } else {
                return done(null, subscriber);
              }
            })
          } else {

            console.log(password)
            if (!subscriber.validPassword(password))
              return done(null, false, {
                loginMessage: 'Invalid password entered.',
                status_code: 419
              });


            if (subscriber.is_close) {
              return done(null, false, {
                loginMessage: "Your Account is closed, Please Contact BoiBazar.com team to re-open",
                status_code: 421
              });
            } else if (!subscriber.is_verified) {
              if (isNaN(username)) {
                return done(null, false, {
                  loginMessage: "Email is not verified. Please verify first",
                  subscriber_first_name: subscriber.first_name,
                  subscriber_email: subscriber.email,
                  subscriber_id: subscriber.id,
                  subscriber_username: subscriber.username,
                  subscriber_phone_number: subscriber.phone_number,
                  status_code: 4201
                });
              } else {
                return done(null, false, {
                  loginMessage: "Phone Number is not verified. Please verify first",
                  subscriber_first_name: subscriber.first_name,
                  subscriber_email: subscriber.email,
                  subscriber_id: subscriber.id,
                  subscriber_username: subscriber.username,
                  subscriber_phone_number: subscriber.phone_number,
                  status_code: 4202
                });
              }
            } else {
              return done(null, subscriber);
            }
          }
        })
      } else {
        if (!subscriber.validPassword(password))
          return done(null, false, {
            loginMessage: 'Invalid password entered.',
            status_code: 419
          });

        if (subscriber.is_close) {
          return done(null, false, {
            loginMessage: "Your Account is closed, Please Contact BoiBazar.com team to re-open",
            status_code: 421
          });
        } else if (!subscriber.is_verified) {
          if (isNaN(username)) {
            return done(null, false, {
              loginMessage: "Email is not verified. Please verify first",
              subscriber_first_name: subscriber.first_name,
              subscriber_email: subscriber.email,
              subscriber_id: subscriber.id,
              subscriber_username: subscriber.username,
              subscriber_phone_number: subscriber.phone_number,
              status_code: 4201
            });
          } else {
            return done(null, false, {
              loginMessage: "Phone Number is not verified. Please verify first",
              subscriber_first_name: subscriber.first_name,
              subscriber_email: subscriber.email,
              subscriber_id: subscriber.id,
              subscriber_username: subscriber.username,
              subscriber_phone_number: subscriber.phone_number,
              status_code: 4202
            });
          }
        } else {
          return done(null, subscriber);
        }
      }

    });
  }));

};
