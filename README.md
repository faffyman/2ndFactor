2nd Factor
===========

´2nd Factor´is an authenticator for 2-factor logins.
It is compatabile with Google Authenticator, and any other 2-factor login that uses the same open source
[OATH algorithm] (http://www.openauthentication.org) to generate the [One-Time-Passwords](time_password) or OTP.

The Passwords are time-based and each one lasts for 30seconds.

A second factor login means that even if your password is compromised, by having 2-factor authentication activated
on your e.g. gmail account, an attacker cannot gain access without eth 2nd Factor.
It's this 2nd Facor that you carry in your pocket on your phone.


Firefox OS
------------

2nd Factor was built as an experiment in building webapps for the Firefox OS platform. However,
since it is HTML5 and Javascript it will work, or can be made to work with little effort on any modern browser.

### Local Storage

As it was built for Firefox OS phones, it uses local storage for storing the ´Secret Keys´ there is no server, and
therefore no communication from the app to the outside. Your keys stay on yor browser.

### Style

The app has been styled using Firefox OS building blocks and is deliberately made to look like a standard Firefox OS app.
But, as stated - it's just css, html and javascript - so have at it.


Credits
--------

### Gerard Braad

The actual creation of the base32 hashes necessary for OATH was done already. If you want a non-firefox OS app that does
the exact same - go download [gbraad](https://github.com/gbraad/)'s [HTML5 Google Authenticator](http://gauth.apps.gbraad.nl/) version which I used as the basis for this app - It's
a great piece of work, much more generic and will work on any browser.


* <https://github.com/gbraad/html5-google-authenticator>
* <http://gauth.apps.gbraad.nl/>

### Russel Sayers

JavaScript implementation of the base32 hash, originally based on the JavaScript implementation as provided by Russell Sayers on his Tin Isles blog:
<http://blog.tinisles.com/2011/10/google-authenticator-one-time-password-algorithm-in-javascript/>

### Brian Turek

JavaScript implementation of the SHA family of hashes.
Version 1.31 Copyright Brian Turek 2008-2012
Distributed under the BSD License
See <http://caligatio.github.com/jsSHA/> for more information

Finally
-------
The website for this is at github pages <http://faffyman.github.io/2ndFactor>

### License
Creative Commons, Attribution Share-Alike
<http://creativecommons.org/licenses/by-sa/3.0/deed.en_US>

