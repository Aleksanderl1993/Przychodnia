(function () {
    var app = angular.module('crmApp', ['ngRoute', 'crmService', 'ngMessages', 'ng-breadcrumbs']);

    app.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {

        $routeProvider
            .when('/clients', {
                controller: 'PatientsListController',
                templateUrl: 'views/clients-list.html',
                label: 'Lista pacjentów'
            })
            .when('/clients/:clientId', {
                controller: 'ClientDetailsController',
                templateUrl: 'views/client-details.html',
                label: 'Karta pacjenta'
            })
            .when('/sectors', {
                controller: 'SectorsController',
                templateUrl: 'views/simple-list.html',
                label: 'Lista specjalizacji'
            })
            .when('/users', {
                controller: 'UsersController',
                templateUrl: 'views/simple-list.html',
                label: 'Lista specjalistów'
            })
            .otherwise({
                redirectTo: '/clients'
            })
        ;

        /*$locationProvider.html5Mode({
         enabled: true,
         requireBase: false
         });*/
    }]);

    app.controller('MainController', ['$scope', 'routeChecker', 'breadcrumbs', function ($scope, routeChecker, breadcrumbs) {
            $scope.routeChecker = routeChecker;
            $scope.breadcrumbs = breadcrumbs;
    }]);

    app.controller('SectorsController', ['$scope', 'sectors', function ($scope, sectors) {
        $scope.items = [];
        $scope.filterBy = {};
        $scope.listHeading = 'Lista branż';

        sectors.getSectors(function (sectors) {
            $scope.items = sectors;
        });
    }]);

    app.controller('UsersController', ['$scope', 'users', function ($scope, users) {
        $scope.items = [];
        $scope.filterBy = {};
        $scope.listHeading = 'Lista specjalistów';


        users.getUsers(function (users) {
            $scope.items = users;
        });
    }]);



    app.controller('PatientsListController', ['$scope', 'clients', 'users', 'sectors', function ($scope, clients, users, sectors) {
        $scope.clients = [];
        $scope.users = [];
        $scope.sectors = [];


        $scope.orderByColumn = 'id';
        $scope.orderByDir = false;

        $scope.filterBy = {};

        clients.getClients(function (clients) {
            $scope.clients = clients;
            // console.log($scope.clients);
        });

        users.getUsers(function (users) {
            $scope.users = users;
            // console.log($scope.users);
        });

        sectors.getSectors(function (sectors) {
            $scope.sectors = sectors;
            // console.log($scope.sectors);
        });


        $scope.changeOrder = function (columnName) {

            if ($scope.orderByColumn == columnName) {
                $scope.orderByDir = !$scope.orderByDir;
            } else {
                $scope.orderByColumn = columnName;
                $scope.orderByDir = false;
            }
        };

        $scope.isOrderedBy = function (columnName) {
            return ($scope.orderByColumn == columnName)
        };

        $scope.isOrderedReverse = function () {
            return !$scope.orderByDir;
        }

    }]);

    app.controller('ClientDetailsController', ['$scope', 'clients', '$routeParams', 'users', 'sectors', '$timeout', 'timeline', '$location', function ($scope, clients, $routeParams, users, sectors, $timeout, timeline, $location) {
        $scope.client = {};
        $scope.users = [];
        $scope.sectors = [];

        $scope.timeline = [];
        $scope.timelineEvent = {};
        $scope.eventTypes = timeline.getEventTypes();
        $scope.nevEventCreatedMsg = false;
        $scope.timelineHelper = timeline.getTimeoutHelper();

        $scope.patientNotFound = false;
        $scope.showSavePatientMessage = false;

        if ('new' !== $routeParams.clientId) {
            clients.getClient(
                $routeParams.clientId,
                function (data) {
                    $scope.client = data;

                    timeline.getPatientTimeline($scope.client.id, function (timeline) {
                        $scope.timeline = timeline;
                        // console.log($scope.timeline);
                    });

                },
                function (data, status) {
                    if (404 == status) {
                        $scope.patientNotFound = true;
                    }
                }
            );
        }


        users.getUsers(function (users) {
            $scope.users = users;
        });

        sectors.getSectors(function (sectors) {
            $scope.sectors = sectors;
        });


        $scope.saveClientData = function () {

            if ($scope.clientForm.$invalid) return;


            if ('new' == $routeParams.clientId) {

                clients.saveNewClient($scope.client, function (client) {

                    $location.path('./clients' + client.id);
                    // $location.path('./clients/');

                });

            } else {
                clients.updateClient($scope.client.id, $scope.client, function (data) {
                    $scope.showSavePatientMessage = true;

                    $timeout(function () {

                        $scope.showSavePatientMessage = false;

                    }, 5000)
                });
            }


        };


        $scope.addEventTimeline = function () {
            if ($scope.eventForm.$invalid) return;

            timeline.addTimelineEvent($scope.client.id, $scope.timelineEvent, function (timeline) {
                $scope.timeline = timeline;
                $scope.timelineEvent = {};

                $scope.nevEventCreatedMsg = true;
                $scope.eventForm.$setUntouched();
                $scope.eventForm.$submitted = false;

                $timeout(function () {
                    $scope.nevEventCreatedMsg = false;
                }, 5000);

            });
        };

        $scope.deleteClient = function () {
            if (!$scope.client.id) return;

            if (!confirm('Czy na pewno chcesz usunąć pacjenta z bazy danych?')) return;

            clients.deleteClient($scope.client.id, function () {
                alert('Pacjent został poprawnie usunięty z bazy danych.');
                $location.path('./#/clients');
            })

        };

    }]);

})();