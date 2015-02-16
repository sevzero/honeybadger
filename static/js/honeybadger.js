// Obfuscation? Honey badger don't care!

honeybadger_eval = eval
honeybadger_write = document.write

MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

honeybadger_collect_dom_objects = ['IFRAME', 'APPLET', 'OBJECT', 'SCRIPT']

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

window.onerror = function(message, url, lineNumber) {
	honeybadger_log('error', lineNumber + ": " + message);
	return true;
};

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

eval = function(code){
	honeybadger_log("eval", code);
	try{
		return honeybadger_eval(code);
	}
	catch(e){
		return null;
	}
}

document.writeln = document.write = function(code){
	honeybadger_log("write", code);
	honeybadger_write(code);
}

alert = function(){}
confirm = function(){return true}
prompt = function(){return 'Honeybadger Rul3z!!!'}
