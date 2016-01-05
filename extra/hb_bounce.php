<?php
	echo $_SERVER['HTTP_REFERER'];
	if (isset($_SERVER['HTTP_REFERER']) && strpos($_SERVER['HTTP_REFERER'], '/analyse/') != -1){
		$parts = explode('analyse/', $_SERVER['HTTP_REFERER']);
		$submission_id = array_pop($parts);
		$base_url = $parts[0];
	}
	header('Location: ' . $base_url . 'report?submission_id=' . $submission_id . '&type=redirect&msg=' . urlencode($_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']));
?>
