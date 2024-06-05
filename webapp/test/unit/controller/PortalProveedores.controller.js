/*global QUnit*/

sap.ui.define([
	"commigracion/portalproveedores/controller/PortalProveedores.controller"
], function (Controller) {
	"use strict";

	QUnit.module("PortalProveedores Controller");

	QUnit.test("I should test the PortalProveedores controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
