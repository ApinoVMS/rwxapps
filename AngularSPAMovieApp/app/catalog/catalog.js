'use strict';

angular.module("movieDB.catalog",['ui.bootstrap'])
	.controller('catalogCtrl', ['$scope', 'movieAPIservice', function ($scope, movieAPIservice) {

		//$scope.currentPage = 1;
		//$scope.pageSize = 12;
		//$scope.pageTitle = "catalogJS.pageTitle";

		movieAPIservice.getMovies().success(function(data){
			for (var i = 0; i < data.length; i++) {
				console.log("Calling Server to get file list for dir="+data[i].original_title);
			};
			$scope.movieList=data;
		});

		movieAPIservice.getGenres().success(function(data){
			$scope.genreList=data;
		});

	}])