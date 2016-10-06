define([
	'./Module'
], function(module) {
	return module.controller('Groupr.Controllers.Main', [
		'$scope',
		'$state',
		function MainController($scope, $state) {
			$scope.login = function() {
				$state.go('login');
			};
			$scope.signup = function() {
				$state.go('signup');
			};
		}
	]);
});