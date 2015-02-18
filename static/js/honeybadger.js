// Obfuscation? Honey badger don't care!

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
    xmlhttp.open("GET", honeybadger_reporting_url+"?submission_id="+honeybadger_submission_id+"&type="+type+"&msg="+escape(msg).replace('+', '%2B'), false);
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

honeybadger_things = snapshot();

// Check for new strings after 8 seconds
window.setTimeout(function(){
	result = compareThings(honeybadger_things, snapshot());
	for (i in result){
		if (result[i][1] == 'string'){
			honeybadger_log(result[i]);
		}
	}
}, 8000);

// Don't want these going off!
alert = function(){}
confirm = function(){return true}
prompt = function(){return 'Honeybadger Rul3z!!!'}
