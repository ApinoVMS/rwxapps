'use strict';

angular.module('movieDB.movie-service', [])
	.factory('movieAPIservice', ['$http', function($http){
		var movieAPI = {};

		movieAPI.getMovies = function() {
			var mov = $http.get("json/movies.json");
			console.log("Getting additional data for "+mov.length+" projects");
			for (var i = 0; i < mov.length; i++) {
				console.log("Calling Server to get file list for dir="+mov[i].original_title);
			};
			return mov;
		}

		movieAPI.getGenres = function() {
			return $http.get("json/genres.json");
		}

		return movieAPI;
	}]);