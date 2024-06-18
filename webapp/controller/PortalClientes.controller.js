sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/ui/model/odata/v2/ODataModel',
    'sap/ui/model/json/JSONModel',
    '../model/formatter',
    'sap/ui/export/library',
    "sap/m/MessageToast"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, ODataModel, JSONModel,formatter, exportLibrary, MessageToast) {
        "use strict";
        //	index.html?sap-ui-xx-viewCache=false#/clientes
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
            
            onSelectOferta: function() {
                this.getSplitAppObj().toDetail(this.createId("detailOferta"));
            },

            onSelectPedidos: function() {
                this.getSplitAppObj().toDetail(this.createId("detailPedidos"));
            },

            onSelectOfertaDET: function() {
                this.getSplitAppObj().toDetail(this.createId("detailOfertaDET"));
            },

            onSelectPedidosDET: function() {
                this.getSplitAppObj().toDetail(this.createId("detailPedidosDET"));
            },

            onPressed: function() {
                MessageToast.show("Data read successfully");
            },

            onPress: function() {
                var oModel = this.getView().getModel("purchaseOrder");
                // Leer datos
                oModel.read("/C_PurOrdItemEnh", {
                    success: function(oData) {
                        MessageToast.show("Data read successfully");
                    },
                    error: function(oError) {
                        MessageToast.show("Error reading Data");
                    }
                });
            },

            handleLinkPedido: function(evt) {
                var linkPedido = evt.getSource();
                var numPedido = linkPedido.getText();
                var that = this;
                
                //numPedido = '4500000252';

                this._oModel.read("/PedidoSet('" + numPedido +"')", {
                    urlParameters: {
                        "$expand": "PosicionSet,EntregaSet,FacturaSet,PagoSet",
                        "sap-lang":'S'
                    },
                    success: function(data, response) {
                        that._jsonModel.setProperty("/PedidoSeleccionado",data);
                        that.getView().setModel(that._jsonModel);                        
                    },
                    error: function(oError) {
                    }
                });

                this.getSplitAppObj().toDetail(this.createId("detailPedido"));

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
