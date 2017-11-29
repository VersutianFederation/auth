function signOut() {
    // reset cookie
    document.cookie = "__Secure-token=; secure; domain=versutian.site; max-age=3600; expires=" + new Date(0).toUTCString();
    // sign out from firebase auth
    firebase.auth().signOut();
}

function app() {
    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyBmCjNVn97PxEFbrnaLQAxwx8FiEQQ77t4",
        authDomain: "versutianpolls.firebaseapp.com",
        databaseURL: "https://versutianpolls.firebaseio.com",
        projectId: "versutianpolls",
        storageBucket: "versutianpolls.appspot.com",
        messagingSenderId: "123573167787"
    };
    firebase.initializeApp(config);

    // user's nation display name
    var nationName = "Unknown Nation";
    // lowercase name with underscores, for database and internal logic
    var internalName;
    var verificationCode;
    // main content
    var content = document.getElementById('content');

    function request(url, callback, xml) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                // check if we are on NS API cooldown
                if (url.startsWith('https://www.nationstates.net/cgi-bin/api.cgi?nation=')) {
                    // notify the user that they're on API cooldown
                    if (xhr.status === 429) {
                        // notify the user once
                        if (!nsBan) {
                            alert('You have been banned for ' + xhr.getResponseHeader('x-retry-after') + ' seconds by the NationStates API');
                            nsBan = true;
                        }
                        // don't callback, we didn't data
                        return;
                    } else {
                        // reset ban notification tracker
                        nsBan = false;
                    }
                }
                // give our callback XML if it requested it
                callback(xml ? xhr.responseXML : xhr.responseText);
            }
        };
        xhr.send();
    }

    function denyCode() {
        // user did not input valid verification code
        $('#spinner').remove();
        document.getElementById('verification-code-group').classList.add('has-warning');
        document.getElementById('verification-code-feedback').innerHTML = '<div class="form-control-feedback">Your verification code was not approved. Generate a new code.</div>';
    }

    function verify() {
        // reset form warnings
        document.getElementById('nation-name-feedback').innerHTML = '';
        document.getElementById('nation-name-group').classList.remove('has-warning');
        document.getElementById('verification-code-feedback').innerHTML = '';
        document.getElementById('verification-code-group').classList.remove('has-warning');
        // set nation name
        nationName = document.getElementById('nation-name').value;
        // check if user entered a nation name
        if (nationName === null || nationName.length < 2) {
            document.getElementById('nation-name-group').classList.add('has-warning');
            document.getElementById('nation-name-feedback').innerHTML = '<div class="form-control-feedback">Something\'s not right about that nation name.</div>';
            return;
        }
        // set internal name
        internalName = nationName.toLowerCase().replace(/ /g, "_");
        verificationCode = document.getElementById('verification-code').value;
        // check if user entered a verification code
        if (verificationCode === null || verificationCode === "") {
            denyCode();
            return;
        } else {
            var response = document.createElement('div');
            response.innerHTML = '<div class="text-center" id="spinner"><span class="fa fa-circle-o-notch fa-spin fa-3x fa-fw"></span><span class="sr-only">Loading...</span></div></section>';
            content.appendChild(response);
            // check with api sign in if code is valid
            request("https://api.versutian.site/token?nation=" + internalName + "&token=" + verificationCode, function(tokenRes) {
                if (tokenRes != 0) {
                    firebase.auth().signInWithCustomToken(tokenRes).catch(function(error) {
                        $('#spinner').remove();
                        response.innerHTML += error.message;
                    });
                } else {
                    denyCode();
                }
            }, false);
        }
    }

    function loginEmbed() {
        // embed the login page
        document.getElementById('ns-embed').src = "https://nationstates.net/page=login";
        document.getElementById('embed-switch').removeEventListener('click', loginEmbed, false);
        document.getElementById('embed-text').innerHTML = '<p>Once you have logged in, <button id="embed-switch" class="btn btn-secondary btn-sm">verify your nation</button></p>';
        document.getElementById('embed-switch').addEventListener('click', verifyEmbed);
    }

    function verifyEmbed() {
        // embed the verification page
        document.getElementById('ns-embed').src = "https://embed.nationstates.net/page=verify_login#proof_of_login_checksum";
        document.getElementById('embed-switch').removeEventListener('click', verifyEmbed, false);
        document.getElementById('embed-text').innerHTML = '<p>If there is an error, or you need to switch nations, <button id="embed-switch" class="btn btn-secondary btn-sm">login first</button></p>';
        document.getElementById('embed-switch').addEventListener('click', loginEmbed);
    }

    function collapseHeader() {
        document.getElementById('header-toggle').removeEventListener('click', collapseHeader, false);
        document.getElementById('header-toggle').innerHTML = '<span class="fa fa-arrow-down" aria-hidden="true"></span> Expand <span class="fa fa-arrow-down" aria-hidden="true"></span>';
        document.getElementById('header-additional').style.display = 'none';
        document.getElementById('header').classList.remove('jumbotron');
        document.getElementById('header').classList.remove('jumbotron-fluid');
        document.getElementById('header').style.paddingTop = "1rem";
        document.getElementById('header').style.paddingBottom = "1rem";
        document.getElementById('header-toggle').addEventListener('click', expandHeader, false);
    }
    
    function expandHeader() {
        document.getElementById('header-toggle').removeEventListener('click', expandHeader, false);
        document.getElementById('header-toggle').innerHTML = '<span class="fa fa-arrow-up" aria-hidden="true"></span> Collapse <span class="fa fa-arrow-up" aria-hidden="true"></span>';
        document.getElementById('header-additional').style.display = 'block';
        document.getElementById('header').classList.add('jumbotron');
        document.getElementById('header').classList.add('jumbotron-fluid');
        document.getElementById('header').style.paddingTop = null;
        document.getElementById('header').style.paddingBottom = null;
        document.getElementById('header-toggle').addEventListener('click', collapseHeader, false);
    }

    document.getElementById('header-toggle').addEventListener('click', collapseHeader);

    function showLoginForm() {
        // login form
        content.innerHTML = '<h1>Login with NationStates</h1><div id="login-form"><form><div class="form-group" id="nation-name-group"><input type="text" class="form-control form-control-lg" id="nation-name" aria-describedby="nationHelpBlock" placeholder="Nation name"><div id="nation-name-feedback"></div><p id="nationHelpBlock" class="form-text text-muted">Your nation\'s short name, as it is displayed on NationStates, for example, <b>Valturus</b>.</p></div></form><br><iframe src="https://embed.nationstates.net/page=verify_login#proof_of_login_checksum" style="border:none; height: 40vh; width: 100%" id="ns-embed"></iframe><div id="embed-text"><p>If there is an error, or you need to switch nations, <button id="embed-switch" class="btn btn-secondary btn-sm">login first</button></p><p>Alternatively, <a href="https://www.nationstates.net/page=verify_login#proof_of_login_checksum" target="_blank">visit the external NationStates page directly</a>.</p></div><br><form><div class="form-group" id="verification-code-group"><input type="text" class="form-control" id="verification-code" aria-describedby="codeHelpBlock" placeholder="Code"><div id="verification-code-feedback"></div><p id="codeHelpBlock" class="form-text text-muted">Copy the code you see from the NationStates.net page into this box.</p></div></form><br><button class="btn btn-primary" id="login-btn">Login</button></div><br><br>';
        document.getElementById('login-btn').addEventListener('click', verify);
        document.getElementById('embed-switch').addEventListener('click', loginEmbed);
    }

    firebase.auth().onAuthStateChanged(function (user) {
        // are we logged in?
        if (user) {
            user.getIdToken().then(function(token) {
                document.cookie = "__Secure-token=" + token + "; secure; domain=versutian.site; max-age=3600; expires=" + new Date(Date.now() + 3600000).toUTCString();
                content.innerHTML = '<p class="lead">Congratulations! You have successfully signed in and can use Versutian Federation websites.</p>';
                content.innerHTML += '<button id="signout-btn" class="btn btn-secondary btn-sm" onclick="signOut()">sign out</button><br><br>';
                content.innerHTML += '<p>Here are the available services: </p>';
                content.innerHTML += '<ul><li><a href="https://forums.versutian.site">Versutian Forums</a></li><li><a href="https://recruitment.versutian.site">Versutian Recruitment</a></li></ul>';
            });
        } else {
            showLoginForm();
        }
    });
}

// load the app when page has loaded
window.onload = function() {
    app();
}
