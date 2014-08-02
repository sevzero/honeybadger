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
	$('.foldlink').click(function() {
		$(this).parent().find('.foldme').toggle('slide');
	});
});

$(document).ready(function() {
    inAnimation = 'fadeIn';
    outAnimation = 'fadeOut';
    $('.boringfoldlink').parent().find('.foldme').addClass('animated ' + inAnimation)
	$('.boringfoldlink').click(function() {
        switchClass($(this).parent().find('.foldme'), inAnimation, outAnimation, function(){});
	});
});

$(document).ready(function() {
	$('.showlink').click(function() {
		$(this).parent().find('.foldme').show('slide');
		$(this).hide('slide');
	});
});
