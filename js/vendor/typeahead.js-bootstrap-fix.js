/*!
 * Fix for the bad styling of typeahead.js with Bootstrap 3.x.
 * Taken from http://stackoverflow.com/questions/18059161/css-issue-on-twitter-typeahead-with-bootstrap-3.
 */
$('.typeahead.input-sm').siblings('input.tt-hint').addClass('hint-small');
$('.typeahead.input-lg').siblings('input.tt-hint').addClass('hint-large');