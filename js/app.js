/**
 * Main Application code for a Javascript based Google Authenticator Port
 * Account details are stored locally on the users browser in local storage
 *
 * This version written specifically for Firefox OS phones.
 *
 * @Version: 0.1 Copyright Tim Swann
 *
 * @License:  Creative Commons, Attribution Share-Alike
 * http://creativecommons.org/licenses/by-sa/3.0/deed.en_US
 *
 * See http://faffyman.github.io/ffos-otp-auth/ for more information
 * ---------------------------------------------------------------------------------
 * Much of the work in this application is taken from previous work by "Gerard Braad"
 * See his web based HTML5 Gauth app on github
 * https://github.com/gbraad/html5-google-authenticator
 * http://gauth.apps.gbraad.nl/
 */

// Store our account names & keys in local storage
// TODO
// Use jssha to symmetrically encrypt the keys with our chosen encryption key
// ---------------------------------------------------------------------------

var StorageService = function() {
    // LocalStorage uses file IO and blocks the main thread to retrieve and save data
    // See note at https://hacks.mozilla.org/category/firefox-os/as/complete/

    var _cache= {};

    var sync = function () {
        for (var key in _cache) {
            if (_cache.hasOwnProperty(key)) {
                localStorage.setItem(key,_cache[key]);
            }
        }
    }

    var setObject = function(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
        // also set it in the cache object
        _cache[key] = JSON.stringify(value);
    }

    var getObject = function(key) {

        if (!_cache[key]) {
          _cache[key] =  localStorage.getItem(key);
        }
        var value =  _cache[key];
        return value && JSON.parse(value);
    }

    var isSupported = function() {
        return typeof (Storage) !== "undefined";
    }

    // exposed functions
    return {
        isSupported: isSupported,
        getObject: getObject,
        setObject: setObject
    }
}



// JavaScript implementation of the base32 hash that is used by OTP systems.
// Originally based on the JavaScript implementation as provided by Russell Sayers on his Tin Isles blog:
// http://blog.tinisles.com/2011/10/google-authenticator-one-time-password-algorithm-in-javascript/
// ------------------------------------------------------------------------------------

var KeyUtilities = function() {

    var dec2hex = function(s) {
        return (s < 15.5 ? '0' : '') + Math.round(s).toString(16);
    }

    var hex2dec = function(s) {
        return parseInt(s, 16);
    }

    var base32tohex = function(base32) {
        var base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        var bits = "";
        var hex = "";

        for (var i = 0; i < base32.length; i++) {
            var val = base32chars.indexOf(base32.charAt(i).toUpperCase());
            bits += leftpad(val.toString(2), 5, '0');
        }

        for (var i = 0; i + 4 <= bits.length; i += 4) {
            var chunk = bits.substr(i, 4);
            hex = hex + parseInt(chunk, 2).toString(16);
        }

        return hex;
    }

    var leftpad = function(str, len, pad) {
        if (len + 1 >= str.length) {
            str = Array(len + 1 - str.length).join(pad) + str;
        }
        return str;
    }

    // Generate a OTP from a given secret
    var generate = function(secret) {
        var key = base32tohex(secret);
        var epoch = Math.round(new Date().getTime() / 1000.0);
        var time = leftpad(dec2hex(Math.floor(epoch / 30)), 16, '0');

        // external library for SHA functionality
        var hmacObj = new jsSHA(time, "HEX");
        var hmac = hmacObj.getHMAC(key, "HEX", "SHA-1", "HEX");

        if (hmac != 'KEY MUST BE IN BYTE INCREMENTS') {
            var offset = hex2dec(hmac.substring(hmac.length - 1));
        }

        var otp = (hex2dec(hmac.substr(offset * 2, 8)) & hex2dec('7fffffff')) + '';
        return (otp).substr(otp.length - 6, 6).toString();
    }

    // exposed functions
    return {
        generate: generate
    }
}
// ------------------------------------------------------------------------------------


var KeysController = function() {
    var storageService;
    var keyUtilities;

    var init = function() {
        storageService = new StorageService();
        keyUtilities = new KeyUtilities();

        // Check if local storage is supported
        if (storageService.isSupported()) {
            // create a base example account
            if (!storageService.getObject('accounts')) {
                addAccount('alice@google.com', 'JBSWY3DPEHPK3PXP');
            }
            // update all pass keys on load
            updateKeys();
            setInterval(timerTick, 250);
        } else {
            // No support for localStorage
            $('#updatingIn').text("x");
            $('#accountsHeader').text("No Storage support");
        }

        // Bind to keypress event for the input
        $('#add').click(function () {
            var name = $('#keyAccount').val();
            var secret = $('#keySecret').val();

            // remove spaces from secret
            secret = secret.replace(/ /g, '');
            if(secret != '') {
                addAccount(name, secret);
            }
        });
    }

    // each key is only good for 30sec intervals
    // work out when to regenerate the keys.
    var timerTick = function() {
        var epoch = Math.round(new Date().getTime() / 1000.0);
        var countDown = 30 - (epoch % 30);
        if (epoch % 30 == 0) {
            updateKeys();
        }
        // show a countdown to next update
        countdown(countDown);

    }

    var countdown = function(sec) {
        var cSec = $("#canvas_seconds").get(0);
        var ctx = cSec.getContext("2d");

        ctx.clearRect(0, 0, cSec.width, cSec.height);
        ctx.beginPath();
        ctx.strokeStyle = '#FF4E00';

        ctx.shadowBlur    = 1;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowColor = '#555555';

        ctx.arc(11,11,10, deg(0), deg(6 * (sec*2) ) );
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = '1rem "Open Sans", Verdana, Helvetica';
        ctx.fillStyle = '#FF4E00';
        ctx.textAlign = 'center';
        ctx.fillText(sec, 11, 14);

        $('#canvas_seconds').text(sec);
        //$('#updatingIn').text(sec);

    }

    var deg = function (deg) {
        return (Math.PI/180)*deg - (Math.PI/180)*90
    }

    var updateKeys = function() {
        var accountList = $('#accounts');
        // Remove all except the first line
        accountList.find("li").remove();

        //get a list of active accounts
        $.each(storageService.getObject('accounts'), function (index, account) {
            var key = keyUtilities.generate(account.secret);

            // Construct HTML
            var delLink = $('<a href="#" class="icon icon-delete">X</a>');
            delLink.click(function () {
                deleteAccount(index)
            });
            var detLink = $('<h4>' + key + '</h4><p>' + account.name + '</p>');
            var accElem = $('<li>').append(detLink).append(delLink);
            // Add HTML element
            accountList.append(accElem);
        });
     //   accountList.listview('refresh');
    }

    var deleteAccount = function(index) {
        // Remove object by index
        if(confirm('Delete Account?')){
        var accounts = storageService.getObject('accounts');
        accounts.splice(index, 1);
        storageService.setObject('accounts', accounts);
        }
        updateKeys();
    }

    var addAccount = function(name, secret) {
        if(secret == '') {
            // Bailout
            return false;
        }

        // Construct JSON object
        var account = {
            'name': name,
            'secret': secret
        };

        // Persist new object
        var accounts = storageService.getObject('accounts');
        if (!accounts) {
            // if undefined create a new array
            accounts = [];
        }
        accounts.push(account);
        storageService.setObject('accounts', accounts);


        // Empty fields
        $('#keyAccount').val('');
        $('#keySecret').val('');

        updateKeys();

        return true;
    }

    return {
        init: init,
        addAccount: addAccount,
        deleteAccount: deleteAccount
    }

}



// Wait until the DOM is ready
$(function() {

    // Write your app here

    var keysController = new KeysController();
    keysController.init();

    // Bind buttons
    $('#addbtn, #backbtn, #add').click(function(){
        //toggle visibility of new-account-entry
        $('#new-account-entry').toggleClass('focus');
        return false;
    });



});