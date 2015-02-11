function switchClass(element, class1, class2, callback){
    if (element.hasClass(class1)){
        element.removeClass(class1);
        element.addClass(class2);
        callback(element);
    }
    else if (element.hasClass(class2)){
        element.removeClass(class2);
        element.addClass(class1);
        callback(element);
    }
}

$(document).ready(function() {
	$(".clickable").click(function() {
		$(".clickable").removeClass("success");
		$(this).addClass("success");
		$(this).find("input:radio").prop('checked',true);
	});
});

