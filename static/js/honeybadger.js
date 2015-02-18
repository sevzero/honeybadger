// Obfuscation? Honey badger don't care!

// Base64 function from http://stackoverflow.com/questions/246801/how-can-you-encode-a-string-to-base64-in-javascript#246813
var Base64 = {
	// private property
	_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

	// public method for encoding
	encode : function (input) {
		var output = "";
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0;
	
		input = Base64._utf8_encode(input);
	
		while (i < input.length) {
	
			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);
	
			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;
	
			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			} else if (isNaN(chr3)) {
				enc4 = 64;
			}
	
			output = output +
			Base64._keyStr.charAt(enc1) + Base64._keyStr.charAt(enc2) +
			Base64._keyStr.charAt(enc3) + Base64._keyStr.charAt(enc4);
	
		}
	
		return output;
	},

	// public method for decoding
	decode : function (input) {
		var output = "";
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;
	
		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
	
		while (i < input.length) {
	
			enc1 = Base64._keyStr.indexOf(input.charAt(i++));
			enc2 = Base64._keyStr.indexOf(input.charAt(i++));
			enc3 = Base64._keyStr.indexOf(input.charAt(i++));
			enc4 = Base64._keyStr.indexOf(input.charAt(i++));
	
			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;
	
			output = output + String.fromCharCode(chr1);
	
			if (enc3 != 64) {
				output = output + String.fromCharCode(chr2);
			}
			if (enc4 != 64) {
				output = output + String.fromCharCode(chr3);
			}
	
		}
	
		output = Base64._utf8_decode(output);
	
		return output;
	
	},

	// private method for UTF-8 encoding
	_utf8_encode : function (string) {
		string = string.replace(/\r\n/g,"\n");
		var utftext = "";
	
		for (var n = 0; n < string.length; n++) {
	
			var c = string.charCodeAt(n);
	
			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}
	
		}
	
		return utftext;
	},

	// private method for UTF-8 decoding
	_utf8_decode : function (utftext) {
		var string = "";
		var i = 0;
		var c = c1 = c2 = 0;
	
		while ( i < utftext.length ) {
	
			c = utftext.charCodeAt(i);
	
			if (c < 128) {
				string += String.fromCharCode(c);
				i++;
			}
			else if((c > 191) && (c < 224)) {
				c2 = utftext.charCodeAt(i+1);
				string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
				i += 2;
			}
			else {
				c2 = utftext.charCodeAt(i+1);
				c3 = utftext.charCodeAt(i+2);
				string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			}
	
		}
		return string;
	}
}

// We'll use these later
honeybadger_eval = eval
honeybadger_write = document.write

MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

// DOM changes we're interested in
honeybadger_collect_dom_objects = ['IFRAME', 'APPLET', 'OBJECT', 'SCRIPT']

// Logging function
function honeybadger_log(type, msg){
	var xmlhttp = null;
	if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
		xmlhttp=new XMLHttpRequest();
	}
	else{// code for IE6, IE5
		xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
	}
	xmlhttp.open("POST", honeybadger_reporting_url+"?submission_id="+honeybadger_submission_id+"&type="+type+"&msg="+Base64.encode(msg).replace('+', '%2B'), false)
	xmlhttp.send(null);
	return xmlhttp.responseText;
}

// Catch Errors
window.onerror = function(message, url, lineNumber) {
	honeybadger_log('error', lineNumber + ": " + message);
	return true;
};

// Catch DOM manipulations
if (window.MutationObserver){

	var observer = new MutationObserver(function(mutations){
		mutations.forEach(function(mutation) {
			if (mutation.type == "childList"){
				for (i = 0; i < mutation.addedNodes.length; i++){
					if (honeybadger_collect_dom_objects.indexOf(mutation.addedNodes[i].nodeName) != -1){
						honeybadger_log("dom",  mutation.addedNodes[i].nodeName + ':' + mutation.addedNodes[i].outerHTML);
					}
				}
			}
		});
	});

	observer.observe(document, {
		subtree: true,
		attributes: true,
		childList: true
	});

}
// Override evals
eval = function(code){
	honeybadger_log("eval", code);
	try{
		return honeybadger_eval(code);
	}
	catch(e){
		return null;
	}
}

// Override writes
document.writeln = document.write = function(code){
	honeybadger_log("write", code);
	honeybadger_write(code);
}


// Snapshot environment variables
function snapshot(){
	var things = {};
	for (thing in window){
		things[thing] = window[thing];
	}
	delete thing
	return things
}

// Compare environment variables
function compareThings(things1, things2){

	var changes = [];
	for (thing in things2){
		if (things1[thing] == undefined && things2[thing] != null && thing != 'honeybadger_things'){
			changes.push(Array(thing, typeof(things2[thing]), things2[thing]));
		}
	}

	delete thing
	return changes
}

// Check for new strings after 8 seconds
window.setTimeout(function(){
	result = compareThings(honeybadger_things, snapshot());
	for (i in result){
		if (result[i][1] == 'string'){
			honeybadger_log('var', result[i][0] + ':' + Base64.encode(result[i][2]));
		}
	}
}, 8000);

// Don't want these going off!
alert = function(){}
confirm = function(){return true}
prompt = function(){return 'Honeybadger Rul3z!!!'}

honeybadger_things = snapshot();
