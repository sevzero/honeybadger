function addIdentification(msg){
	var identificationContainer = $('<div class="alert alert-info" role="alert"></div>');
	var icon = $('<span class="glyphicon glyphicon-record" aria-hidden="true"></span>');
	var identification = $('<span> Identification: ' + msg + '</span>');
	identificationContainer.append(icon);
	identificationContainer.append(identification);
	$('#identifications').append(identificationContainer);
}

identificationChecks = [
	{
		msg: "AnglerEK",
		check: function (){
			return $('#analysis').html().search(/var cryptKey = /) != -1;
		}
	},
];

$( document ).ready(function() {
	for (var i = 0; i < identificationChecks.length; i++){
		if (identificationChecks[i].check()){
			addIdentification(identificationChecks[i].msg);
		}
	}
});
