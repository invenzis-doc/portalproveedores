sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/ui/model/odata/v2/ODataModel',
    'sap/ui/model/json/JSONModel',
    '../model/formatter',
    'sap/ui/export/library'
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, ODataModel, JSONModel,formatter, exportLibrary) {
        "use strict";
        //index.html?sap-ui-xx-viewCache=false#/clientes (al ejecutarlo como noflp)
        var EdmType = exportLibrary.EdmType;

        return Controller.extend("com.migracion.portalproveedores.controller.PortalClientes", {

            formatter:formatter,
                        
            onInit: function () { 
                //Seteo el proveedor para filtrar las entidades
                //this._oProveedor = "0000200595";
                this._oProveedor = "0000200542";
                
                //Dato hardcoded en el portal
                this._oSociedad = "AR10";
                //this._oProveedor = "0000200484";
                

                this._oModel = new ODataModel("/sap/opu/odata/sap/Z_PORTAL_PROVEEDORES_SRV", true);
                this._oModel.setHeaders({
                    "Accept":"application/pdf",
                    "Content-Type": "application/pdf"
                })
                var that = this;
                this._oModel.read("/SociedadSet", {
                    success: function(data, response) {
                        var jsonModel = new JSONModel();
                        jsonModel.setProperty("/SociedadSet",data.results);
                        that.getView().setModel(jsonModel);
                        that._jsonModel = jsonModel;
                                                                   
                    },
                    error: function(oError) {
                    }
                });
              				       
            },
            
            onSelectHome: function() {
                this.getSplitAppObj().toDetail(this.createId("detailHome"));
            },
            
            onSelectReportes: function() {
                this.getSplitAppObj().toDetail(this.createId("detailReportes"));
            },

            onSelectFacturas: function() {
                this.getSplitAppObj().toDetail(this.createId("detailFacturas"));
            },

            onSelectPagos: function() {
                this.getSplitAppObj().toDetail(this.createId("detailPagos"));
            },

            onSelectPedidos: function() {
                this.getSplitAppObj().toDetail(this.createId("detailPedidos"));
            },

            getSplitAppObj: function () {
                var result = this.byId("SplitContDemo");
                if (!result) {
                    Log.info("SplitApp object can't be found");
                }
                return result;
            }

        });
    });
