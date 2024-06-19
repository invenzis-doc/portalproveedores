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
                var that = this;
                //Inicializar los filtros de fecha
                var fechaHoy = new Date();
                var fechaHasta = this.formatFilterDate(fechaHoy)

                var fechaDesde = fechaHoy;
                fechaDesde.setMonth(fechaHoy.getMonth() - 4);
                fechaDesde = this.formatFilterDate(fechaDesde);
                
                that._oModel.read("/PedidoSet", {
                    urlParameters: {
                        "$filter": "Lifnr eq '" + that._oProveedor + "' and FechaDesde eq '"+ fechaDesde +"' and FechaHasta eq '"+ fechaHasta +"'" 
                    },
                    success: function(dataPedidos, responsePedidos) {
                        that._jsonModel.setProperty("/PedidoSet",dataPedidos.results);                                              
                    },
                    error: function(oError) {
                    }
                });      
            },

            onSelectPedidos: function() {
                this.getSplitAppObj().toDetail(this.createId("detailPedidos"));
                var that = this;
                //Inicializar los filtros de fecha
                var fechaHoy = new Date();
                var fechaHasta = this.formatFilterDate(fechaHoy)

                var fechaDesde = fechaHoy;
                fechaDesde.setMonth(fechaHoy.getMonth() - 4);
                fechaDesde = this.formatFilterDate(fechaDesde);
                
                that._oModel.read("/PedidoSet", {
                    urlParameters: {
                        "$filter": "Lifnr eq '" + that._oProveedor + "' and FechaDesde eq '"+ fechaDesde +"' and FechaHasta eq '"+ fechaHasta +"'" 
                    },
                    success: function(dataPedidos, responsePedidos) {
                        that._jsonModel.setProperty("/PedidoSet",dataPedidos.results);                                              
                    },
                    error: function(oError) {
                    }
                });      
            },

            onSelectOfertaDET: function() {
                this.getSplitAppObj().toDetail(this.createId("detailOfertaDET"));
                
            },

            onSelectPedidosDET: function() {
                this.getSplitAppObj().toDetail(this.createId("detailPedidosDET"));
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

                this.getSplitAppObj().toDetail(this.createId("detailPedidosDET"));

            },

            handleLinkOferta: function(evt) {
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

                this.getSplitAppObj().toDetail(this.createId("detailOfertaDET"));

            },

            getSplitAppObj: function () {
                var result = this.byId("SplitContDemo");
                if (!result) {
                    Log.info("SplitApp object can't be found");
                }
                return result;
            },

            formatFilterDate : function (date) {
                var dia = date.getDate().toString().padStart(2, '0');
                var mes = date.getMonth() + 1;
                mes = mes.toString().padStart(2, '0');
                var valorFechaHasta = date.getFullYear() + mes + dia;
                return (valorFechaHasta)
            }

        });
    });
