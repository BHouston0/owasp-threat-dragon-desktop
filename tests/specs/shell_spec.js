﻿'use strict';

describe('shell controller', function () {

    var $scope;
    var $controller;
    var $location;
    var $httpBackend;
    var $route;
    var $q;
    var mockElectron = {
        Menu: {
            buildFromTemplate: function() { },
            setApplicationMenu: function() { }
        },
        shell: {
            openExternal: function() {}
        },
        dialog: {
            open: function() {}
        }
    };
    var mockDatacontext = {
        close: function() {},
        update: function() {},
        saveAs: function() {}
    };
    var testMenu = 'test menu';
    var templateMenu;

    beforeEach(function () {

        spyOn(mockElectron.Menu, 'buildFromTemplate').and.returnValue(testMenu);
        spyOn(mockElectron.Menu, 'setApplicationMenu');
        angular.mock.module('app');
        angular.mock.module(function ($provide) {
            $provide.value('electron', mockElectron);
            $provide.value('datacontext', mockDatacontext);
        });

        angular.mock.inject(function ($rootScope, _$q_, _$controller_, _$httpBackend_, _$location_, _$route_) {
            $scope = $rootScope.$new();
            $q = _$q_;
            $controller = _$controller_;
            $httpBackend = _$httpBackend_;
            $httpBackend.expectGET().respond();
            $location = _$location_;
            $route = _$route_;
        });

        $controller('shell as vm', { $scope: $scope });
        $scope.$apply();

        templateMenu = mockElectron.Menu.buildFromTemplate.calls.argsFor(0)[0];
    });

    it('should be defined', function () {
        expect($scope.vm).toBeDefined();
    });

    it('should set the application menu for the window', function() {
        expect(mockElectron.Menu.buildFromTemplate).toHaveBeenCalled();
        expect(mockElectron.Menu.setApplicationMenu).toHaveBeenCalled();
        expect(mockElectron.Menu.setApplicationMenu.calls.argsFor(0)).toEqual([testMenu]);
    });

    //file:
    it('File menu first item should be create a new model', function() {
        var template = mockElectron.Menu.buildFromTemplate.calls.argsFor(0)[0];
        var subMenu = getSubMenu(template, 'File');
        expect(subMenu.submenu[0].label).toEqual('New');
        expect(subMenu.submenu[0].accelerator).toEqual('CmdOrCtrl+N');
        var click = subMenu.submenu[0].click;

        spyOn($scope, '$apply').and.callThrough();
        spyOn(mockDatacontext, 'close');
        click();
        expect($location.path()).toEqual('/threatmodel/new');
        expect($scope.$apply).toHaveBeenCalled();
        expect(mockDatacontext.close).toHaveBeenCalled();
    });

    it('File menu second item should be open a model - open a file', function() {
        var template = mockElectron.Menu.buildFromTemplate.calls.argsFor(0)[0];
        var subMenu = getSubMenu(template, 'File');
        expect(subMenu.submenu[1].label).toEqual('Open');
        expect(subMenu.submenu[1].accelerator).toEqual('CmdOrCtrl+O');
        var click = subMenu.submenu[1].click;
        var testFileName = 'test file name';
        var testFilenames = [testFileName];
        mockElectron.dialog.open = function(f) {
            f(testFilenames);
        }

        spyOn($scope, '$apply').and.callThrough();
        spyOn($location, 'path').and.callThrough();
        click();
        expect($location.path.calls.count()).toEqual(2);
        expect($location.path()).toEqual('/threatmodel/file');
        expect($scope.$apply).toHaveBeenCalled();
        expect(mockDatacontext.threatModelLocation).toEqual(testFileName);
    });

    it('File menu second item should be open a model - reload', function() {
        var template = mockElectron.Menu.buildFromTemplate.calls.argsFor(0)[0];
        var subMenu = getSubMenu(template, 'File');
        expect(subMenu.submenu[1].label).toEqual('Open');
        expect(subMenu.submenu[1].accelerator).toEqual('CmdOrCtrl+O');
        var click = subMenu.submenu[1].click;
        var testFileName = 'test file name';
        var testFilenames = [testFileName];
        mockElectron.dialog.open = function(f) {
            f(testFilenames);
        }

        spyOn($scope, '$apply').and.callThrough();
        spyOn($location, 'path').and.returnValue('/threatmodel/file');
        spyOn($route, 'reload').and.callThrough();
        click();
        expect($location.path.calls.count()).toEqual(1);
        expect($scope.$apply).toHaveBeenCalled();
        expect(mockDatacontext.threatModelLocation).toEqual(testFileName);
        expect($route.reload).toHaveBeenCalled();
    });

    it('File menu second item should be open a model - cancel', function() {
        var template = mockElectron.Menu.buildFromTemplate.calls.argsFor(0)[0];
        var subMenu = getSubMenu(template, 'File');
        expect(subMenu.submenu[1].label).toEqual('Open');
        expect(subMenu.submenu[1].accelerator).toEqual('CmdOrCtrl+O');
        var click = subMenu.submenu[1].click;
        var testFileName = 'test file name';
        var testFilenames = [testFileName];
        var testLocation = 'test location';
        mockDatacontext.threatModelLocation = testLocation;
        mockElectron.dialog.open = function(f, g) {
            g(testFilenames);
        }

        spyOn($scope, '$apply').and.callThrough();
        spyOn($location, 'path').and.returnValue('/threatmodel/file');
        click();
        expect($location.path).not.toHaveBeenCalled();
        expect($scope.$apply).not.toHaveBeenCalled();
        expect(mockDatacontext.threatModelLocation).toEqual(testLocation);
    });

    it('File menu third item should open the demo model', function() {
        var template = mockElectron.Menu.buildFromTemplate.calls.argsFor(0)[0];
        var subMenu = getSubMenu(template, 'File');
        expect(subMenu.submenu[2].label).toEqual('Open Demo Model');
        expect(subMenu.submenu[2].accelerator).toEqual('CmdOrCtrl+D');
        var click = subMenu.submenu[2].click;

        spyOn($scope, '$apply').and.callThrough();
        click();
        expect($location.path()).toEqual('/threatmodel/demo');
        expect($scope.$apply).toHaveBeenCalled();
    });

    it('File menu fourth item should save the model (datacontext)', function() {
        var template = mockElectron.Menu.buildFromTemplate.calls.argsFor(0)[0];
        var subMenu = getSubMenu(template, 'File');
        expect(subMenu.submenu[3].label).toEqual('Save');
        expect(subMenu.submenu[3].accelerator).toEqual('CmdOrCtrl+S');
        var click = subMenu.submenu[3].click;
        spyOn(mockDatacontext, 'update');
        click();
        expect(mockDatacontext.update).toHaveBeenCalled();
    });

    describe('fix for #43: https://github.com/mike-goodwin/owasp-threat-dragon-desktop/issues/43', function() {

        beforeEach(function() {

            $scope.vm.saveDiagram = function() {};
            spyOn($scope.vm, 'saveDiagram');

        });

        afterEach(function() {

            if ($scope.vm.saveDiagram) {
                delete $scope.vm.saveDiagram;
            }

        });
        
        it('File menu fourth item should save the model (view model)', function() {
            var template = mockElectron.Menu.buildFromTemplate.calls.argsFor(0)[0];
            var subMenu = getSubMenu(template, 'File');
            expect(subMenu.submenu[3].label).toEqual('Save');
            expect(subMenu.submenu[3].accelerator).toEqual('CmdOrCtrl+S');
            var click = subMenu.submenu[3].click;
            spyOn(mockDatacontext, 'update');
            spyOn($location, 'path').and.returnValue('/threatmodel/modelname/diagram/diagramid');
            click();
            expect(mockDatacontext.update).not.toHaveBeenCalled();
            expect($scope.vm.saveDiagram).toHaveBeenCalled();
        });

        it('File menu fourth item should save the model (datacontext - not a diagram path)', function() {
            var template = mockElectron.Menu.buildFromTemplate.calls.argsFor(0)[0];
            var subMenu = getSubMenu(template, 'File');
            expect(subMenu.submenu[3].label).toEqual('Save');
            expect(subMenu.submenu[3].accelerator).toEqual('CmdOrCtrl+S');
            var click = subMenu.submenu[3].click;
            spyOn(mockDatacontext, 'update');
            spyOn($location, 'path').and.returnValue('/threatmodel/modelname/notdiag/diagramid');
            click();
            expect(mockDatacontext.update).toHaveBeenCalled();
            expect($scope.vm.saveDiagram).not.toHaveBeenCalled();
        });

        it('File menu fourth item should save the model (datacontext - not a threatmodel path)', function() {
            var template = mockElectron.Menu.buildFromTemplate.calls.argsFor(0)[0];
            var subMenu = getSubMenu(template, 'File');
            expect(subMenu.submenu[3].label).toEqual('Save');
            expect(subMenu.submenu[3].accelerator).toEqual('CmdOrCtrl+S');
            var click = subMenu.submenu[3].click;
            spyOn(mockDatacontext, 'update');
            spyOn($location, 'path').and.returnValue('/notmodel/modelname/diagram/diagramid');
            click();
            expect(mockDatacontext.update).toHaveBeenCalled();
            expect($scope.vm.saveDiagram).not.toHaveBeenCalled();
        });

        it('File menu fourth item should save the model (datacontext - no vm method available)', function() {
            var template = mockElectron.Menu.buildFromTemplate.calls.argsFor(0)[0];
            var subMenu = getSubMenu(template, 'File');
            expect(subMenu.submenu[3].label).toEqual('Save');
            expect(subMenu.submenu[3].accelerator).toEqual('CmdOrCtrl+S');
            var click = subMenu.submenu[3].click;
            spyOn(mockDatacontext, 'update');
            delete $scope.vm.saveDiagram;
            spyOn($location, 'path').and.returnValue('/threatmodel/modelname/diagram/diagramid');
            click();
            expect(mockDatacontext.update).toHaveBeenCalled();
        });
    });

    it('File menu fifth item should be save as', function() {
        var template = mockElectron.Menu.buildFromTemplate.calls.argsFor(0)[0];
        var subMenu = getSubMenu(template, 'File');
        expect(subMenu.submenu[4].label).toEqual('Save As');
        var click = subMenu.submenu[4].click;
        spyOn(mockDatacontext, 'saveAs').and.returnValue($q.when(null));
        click();
        expect(mockDatacontext.saveAs).toHaveBeenCalled();
    });

    it('File menu sixth item should be close model', function() {
        var template = mockElectron.Menu.buildFromTemplate.calls.argsFor(0)[0];
        var subMenu = getSubMenu(template, 'File');
        expect(subMenu.submenu[5].label).toEqual('Close Model');
        expect(subMenu.submenu[5].accelerator).toEqual('CmdOrCtrl+F4');
        var click = subMenu.submenu[5].click;

        spyOn($scope, '$apply').and.callThrough();
        spyOn(mockDatacontext, 'close');
        click();
        expect($location.path()).toEqual('/');
        expect($scope.$apply).toHaveBeenCalled();
        expect(mockDatacontext.close).toHaveBeenCalled();
    });

    it('File menu seventh item should toggle developer tools', function() {
        var template = mockElectron.Menu.buildFromTemplate.calls.argsFor(0)[0];
        var subMenu = getSubMenu(template, 'File');
        expect(subMenu.submenu[6].label).toEqual('Toggle Developer Tools');
        expect(subMenu.submenu[6].accelerator).toEqual('Ctrl+Shift+I');

        var click = subMenu.submenu[6].click;
        var mockWindow = {
            webContents: {
                toggleDevTools: function() {}
            }
        };

        var toggleSpy = spyOn(mockWindow.webContents, 'toggleDevTools');
        click(null, mockWindow);
        expect(toggleSpy).toHaveBeenCalled();
        //fairly pointless test since the window will never be null in normal cases
        //but gets the branch coverage up
        toggleSpy.calls.reset();
        click(null, null);
        expect(toggleSpy).not.toHaveBeenCalled();

    });

    it('File menu eighth item should be a separator', function() {
        var template = mockElectron.Menu.buildFromTemplate.calls.argsFor(0)[0];
        var subMenu = getSubMenu(template, 'File');
        expect(subMenu.submenu[7].type).toEqual('separator');
    });

    it('File menu ninth item should be exit', function() {
        var template = mockElectron.Menu.buildFromTemplate.calls.argsFor(0)[0];
        var subMenu = getSubMenu(template, 'File');
        expect(subMenu.submenu[8].label).toEqual('Exit');
        expect(subMenu.submenu[8].role).toEqual('close');
    });

    //view:
    it('View menu first item should be Reload', function() {
        // todo: test menu action
        var template = mockElectron.Menu.buildFromTemplate.calls.argsFor(0)[0];
        var subMenu = getSubMenu(template, 'View');
        expect(subMenu.submenu[0].label).toEqual('Reload');
        expect(subMenu.submenu[0].accelerator).toEqual('CmdOrCtrl+R');

        var click = subMenu.submenu[0].click;
        var mockWindow = {
            reload: function() {}
        };
        var reloadSpy = spyOn(mockWindow, 'reload');
        click(null, mockWindow);
        expect(reloadSpy).toHaveBeenCalled();
        //fairly pointless test since the window will never be null in normal cases
        //but gets the branch coverage up
        reloadSpy.calls.reset();
        click(null, null);
        expect(reloadSpy).not.toHaveBeenCalled();

    });

    it('View menu second item should be a separator', function() {
        var template = mockElectron.Menu.buildFromTemplate.calls.argsFor(0)[0];
        var subMenu = getSubMenu(template, 'View');
        expect(subMenu.submenu[1].type).toEqual('separator');
    });

    it('View menu third item should be reset zoom', function() {
        var template = mockElectron.Menu.buildFromTemplate.calls.argsFor(0)[0];
        var subMenu = getSubMenu(template, 'View');
        expect(subMenu.submenu[2].role).toEqual('resetzoom');
        expect(subMenu.submenu[2].accelerator).toEqual('CmdOrCtrl+0');
    });

    it('View menu fourth item should be zoomin', function() {
        var template = mockElectron.Menu.buildFromTemplate.calls.argsFor(0)[0];
        var subMenu = getSubMenu(template, 'View');
        expect(subMenu.submenu[3].role).toEqual('zoomin');
        expect(subMenu.submenu[3].accelerator).toEqual('CmdOrCtrl+=');
    });

    it('View menu fifth item should be zoomout', function() {
        var template = mockElectron.Menu.buildFromTemplate.calls.argsFor(0)[0];
        var subMenu = getSubMenu(template, 'View');
        expect(subMenu.submenu[4].role).toEqual('zoomout');
        expect(subMenu.submenu[4].accelerator).toEqual('CmdOrCtrl+-');
    });

    it('View menu sixth item should be a separator', function() {
        var template = mockElectron.Menu.buildFromTemplate.calls.argsFor(0)[0];
        var subMenu = getSubMenu(template, 'View');
        expect(subMenu.submenu[5].type).toEqual('separator');
    });

    it('View menu seventh item should be togglefullscreen', function() {
        var template = mockElectron.Menu.buildFromTemplate.calls.argsFor(0)[0];
        var subMenu = getSubMenu(template, 'View');
        expect(subMenu.submenu[6].role).toEqual('togglefullscreen');
        expect(subMenu.submenu[6].accelerator).toEqual('CmdOrCtrl+F11');
    });

    //window:
    it('Window menu first item should be minimize', function() {
        var template = mockElectron.Menu.buildFromTemplate.calls.argsFor(0)[0];
        var subMenu = getSubMenu(template, 'Window');
        expect(subMenu.submenu[0].role).toEqual('minimize');
    });

    it('Window menu second item should be close', function() {
        var template = mockElectron.Menu.buildFromTemplate.calls.argsFor(0)[0];
        var subMenu = getSubMenu(template, 'Window');
        expect(subMenu.submenu[1].role).toEqual('close');
    });

    //Help:
    it('Help menu first item should browse to the documentation page', function() {
        var template = mockElectron.Menu.buildFromTemplate.calls.argsFor(0)[0];
        var subMenu = getSubMenu(template, 'Help');
        expect(subMenu.submenu[0].label).toEqual('Documentation');
        spyOn(mockElectron.shell, 'openExternal');
        subMenu.submenu[0].click();
        expect(mockElectron.shell.openExternal.calls.argsFor(0)).toEqual(['http://docs.threatdragon.org']);      
    });

    it('Help menu second item should browse to the GitHub issues page', function() {
        var template = mockElectron.Menu.buildFromTemplate.calls.argsFor(0)[0];
        var subMenu = getSubMenu(template, 'Help');
        expect(subMenu.submenu[1].label).toEqual('Submit an Issue');
        spyOn(mockElectron.shell, 'openExternal');
        subMenu.submenu[1].click();
        expect(mockElectron.shell.openExternal.calls.argsFor(0)).toEqual(['https://github.com/mike-goodwin/owasp-threat-dragon-desktop/issues/new']); 
    });

    it('Help menu third item should browse to the GitHub repo page', function() {
        var template = mockElectron.Menu.buildFromTemplate.calls.argsFor(0)[0];
        var subMenu = getSubMenu(template, 'Help');
        expect(subMenu.submenu[2].label).toEqual('Visit us on GitHub');
        spyOn(mockElectron.shell, 'openExternal');
        subMenu.submenu[2].click();
        expect(mockElectron.shell.openExternal.calls.argsFor(0)).toEqual(['https://github.com/mike-goodwin/owasp-threat-dragon-desktop']); 
    });

    function getSubMenu(template, label) {

        return template.find( function(item) {
            return item.label == label;
        });
    };
});