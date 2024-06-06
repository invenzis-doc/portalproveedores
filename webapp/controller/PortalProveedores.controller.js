sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/ui/model/odata/v2/ODataModel',
    'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    '../model/formatter',
    'sap/ui/export/library',
	'sap/ui/export/Spreadsheet',
    'sap/ui/model/SimpleType',
    "sap/ui/core/Core",
    "sap/ui/model/ValidateException",
    "sap/m/MessageBox"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, ODataModel, Filter, FilterOperator,JSONModel,formatter, exportLibrary, Spreadsheet,SimpleType, Core, ValidateException, MessageBox) {
        "use strict";

        var EdmType = exportLibrary.EdmType;

        return Controller.extend("com.migracion.portalproveedores.controller.PortalProveedores", {

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
            onSelectOrdenes: function() {
                var that = this;
                //Inicializar los filtros de fecha
                var fechaHoy = new Date();
                var fechaHasta = this.formatFilterDate(fechaHoy)

                var fechaDesde = fechaHoy;
                fechaDesde.setMonth(fechaHoy.getMonth() - 4);
                fechaDesde = this.formatFilterDate(fechaDesde);

                that.byId("fechaPedidosPicker").setValue(fechaDesde);
                that.byId("fechaHastaPedidosPicker").setValue(fechaHasta);
                
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
                this.getSplitAppObj().toDetail(this.createId("detailOrdenes"));
            },
            onSelectHome: function() {
                this.getSplitAppObj().toDetail(this.createId("detailHome"));
            },
            onSelectCargaFacturas: function() {
                //Inicializo el objeto FacturaCarga si no esta 
                var oModel = this.getView().getModel();
                
                if (!oModel.getProperty("/FacturaCarga"))
                    oModel.setProperty("/FacturaCarga", {});
                
                
                this.byId("fechaCargaFactura").setMaxDate(new Date())
                var that = this;
                //Obtengo el tipo de cambio 
                this._oModel.read("/CambioMonedaSet(Kurst='M',Fcurr='USD',Tcurr='ARS')", {
                   
                    success: function(data, response) {
                        var tipoCambio = data.TipoCambio.replace(".",",").substring(0, data.TipoCambio.length - 2);
                        oModel.setProperty("/FacturaCarga/TipoCambio", tipoCambio);
                        that.getSplitAppObj().toDetail(that.createId("detailCargaFactura"));                                              
                    },
                    error: function(oError) {
                    }
                });
                                
                
                
            },
            onSelectFacturas: function() {
                
                var that = this;                
                this.byId("tableListaFacturas").setBusy(true);
                //Inicializar los filtros de fecha
                var fechaHoy = new Date();
                var fechaHasta = this.formatFilterDate(fechaHoy);

                var fechaDesde = fechaHoy;
                fechaDesde.setMonth(fechaHoy.getMonth() - 4);
                fechaDesde = this.formatFilterDate(fechaDesde);

                that.byId("fechaFacturasPicker").setValue(fechaDesde);
                that.byId("fechaHastaFacturasPicker").setValue(fechaHasta);

                this._oModel.read("/FacturaSet", {
                    urlParameters: {
                        "$filter": "Lifnr eq '" + that._oProveedor + //"'"
                        "' and FechaDesde eq '"+ fechaDesde +"' and FechaHasta eq '"+ fechaHasta +"'"                      
                    },
                    success: function(data, response) {
                        that._jsonModel.setProperty("/FacturaSet",data);
                        that.getView().setModel(that._jsonModel); 
                        that.byId("tableListaFacturas").setBusy(false);                                               
                    },
                    error: function(oError) {
                    }
                });
                that.getSplitAppObj().toDetail(that.createId("detailFacturas"));
            } ,
            onFilterFacturas: function() {
                
                var that = this;                
                this.byId("tableListaFacturas").setBusy(true);

                //Obtiene filtros de fecha
                var fechaDesde = this.byId("fechaFacturasPicker").getValue();
                var fechaHasta = this.byId("fechaHastaFacturasPicker").getValue();

                var pedido = this.byId("inputPedidoFactura").getValue();
                var pedidoFiltro= "";
                if (pedido)
                    pedidoFiltro = " and Ebeln eq '"+ pedido +"'";

                var factura = this.byId("inputNumeroFactura").getValue();
                var facturaFiltro= "";
                if (factura)
                    facturaFiltro = " and Xblnr eq '"+ factura +"'";
                
                //Filtros de checkboxes
                var estadoFiltro = "";
                
                if (this.byId("checkEstadoFacturasV").getSelected())
                    estadoFiltro = "V";
                
                if (this.byId("checkEstadoFacturasA").getSelected())
                    estadoFiltro = estadoFiltro + "A";
                
                if (this.byId("checkEstadoFacturasR").getSelected())
                    estadoFiltro = estadoFiltro + "R";

                if (estadoFiltro)
                    estadoFiltro = " and Estado eq '"+ estadoFiltro +"'";
                

                this._oModel.read("/FacturaSet", {
                    urlParameters: {
                        "$filter": "Lifnr eq '" + that._oProveedor + //"'"
                        "' and FechaDesde eq '"+ fechaDesde +"' and FechaHasta eq '"+ fechaHasta +"'" 
                        + pedidoFiltro + estadoFiltro + facturaFiltro
                    },
                    success: function(data, response) {
                        that._jsonModel.setProperty("/FacturaSet",data);
                        that.getView().setModel(that._jsonModel); 
                        that.byId("tableListaFacturas").setBusy(false);                                               
                    },
                    error: function(oError) {
                    }
                });
                that.getSplitAppObj().toDetail(that.createId("detailFacturas"));
            } ,
            onSearchFacturas: function() {
                //Inicio los filtros vacios
                var tableFilters = [];
                
                var inputPedido = this.byId("inputSearchFacturas");
                var valuePedido = inputPedido.getValue();
                var busquedaPedido = inputPedido.getValue();
                
                //Para cualquier campo, pregunto si contiene el string
                var totalFilter = new Filter({
                    filters: [                      
                        new Filter({
                            path: "Ebeln",
                            operator: FilterOperator.Contains,
                            value1: busquedaPedido
                        }),
                        new Filter({
                            path: "Estado",
                            operator: FilterOperator.Contains,
                            value1: busquedaPedido
                        }), 
                        new Filter({
                            path: "Budat",
                            operator: FilterOperator.Contains,
                            value1: busquedaPedido
                        }), 
                        new Filter({
                            path: "Xblnr",
                            operator: FilterOperator.Contains,
                            value1: busquedaPedido
                        }), 
                        new Filter({
                            path: "Waers",
                            operator: FilterOperator.Contains,
                            value1: busquedaPedido
                        }), 
                        new Filter({
                            path: "Fvenc",
                            operator: FilterOperator.Contains,
                            value1: busquedaPedido
                        }), 
                        new Filter({
                            path: "Belnr",
                            operator: FilterOperator.Contains,
                            value1: busquedaPedido
                        }),
                        new Filter({
                            path: "DocMmFac",
                            operator: FilterOperator.Contains,
                            value1: busquedaPedido
                        }), 
                        new Filter({
                            path: "DocFiFac",
                            operator: FilterOperator.Contains,
                            value1: busquedaPedido
                        }), 
                        new Filter({
                            path: "Rmwwr",
                            operator: FilterOperator.Contains,
                            value1: busquedaPedido
                        }), 
                        new Filter({
                            path: "Gjahr",
                            operator: FilterOperator.Contains,
                            value1: busquedaPedido
                        }), 
                        
                    ],
                      
                    and: false
                  })
                             
                var oTable = this.getView().byId("tableListaFacturas");
                oTable.getBinding("rows").filter(totalFilter);   

            },
            onExportFacturas: function() {
                var aCols, oRowBinding, oSettings, oSheet, oTable;
    
                this._oTable = this.byId('tableListaFacturas');
                    
                oTable = this._oTable;
                oRowBinding = oTable.getBinding('rows');
                aCols = this.createColumnConfigFacturas();
    
                oSettings = {
                    workbook: {
                        columns: aCols,
                        hierarchyLevel: 'Level'
                    },
                    dataSource: oRowBinding,
                    fileName: 'Export Facturas.xlsx',
                    worker: false // We need to disable worker because we are using a MockServer as OData Service
                };
    
                oSheet = new Spreadsheet(oSettings);
                oSheet.build().finally(function() {
                    oSheet.destroy();
                });
            },
            createColumnConfigFacturas: function() {
                var aCols = [];

                aCols.push({
                    label: 'Estado',
                    type: EdmType.String,
                    property: 'Estado'                    
                });

                aCols.push({
                    label: 'Factura',
                    property: 'Xblnr',
                    type: EdmType.String
                });

                aCols.push({
                    label:'Fecha Emisión',
                    property: 'Budat',
                    type: EdmType.String
                });
              
                aCols.push({
                    label:'Fecha Vencimiento',
                    property: 'Fvenc',
                    type: EdmType.String
                });

                aCols.push({
                    label:'Orden de Pago',
                    property: 'Belnr',
                    type: EdmType.String
                });

                aCols.push({
                    label:'Documento MM',
                    property: 'DocMmFac',
                    type: EdmType.String
                });

                aCols.push({
                    label:'Documento Contable',
                    property: 'DocFiFac',
                    type: EdmType.String
                });

                aCols.push({
                    label: 'Pedido',
                    property: 'Ebeln',
                    type: EdmType.String
                });

                
                aCols.push({
                    label:'Moneda',
                    property: 'Waers',
                    type: EdmType.String
                });

                aCols.push({
                    label:'Valor',
                    property: 'Rmwwr',
                    type: EdmType.String
                });               

                return aCols;
            },
            onSelectPagos: function() {
                var that = this;
                //Inicializar los filtros de fecha
                var fechaHoy = new Date();
                var fechaHasta = this.formatFilterDate(fechaHoy)

                var fechaDesde = fechaHoy;
                fechaDesde.setMonth(fechaHoy.getMonth() - 4);
                fechaDesde = this.formatFilterDate(fechaDesde);

                that.byId("fechaPickerPagos").setValue(fechaDesde);
                that.byId("fechaHastaPickerPagos").setValue(fechaHasta);
                that.byId("tableListaPagos").setBusy(true);
                this._oModel.read("/PagoSet", {
                    urlParameters: {
                        "$filter": "Lifnr eq '" + that._oProveedor + //"'"
                        "' and FechaDesde eq '"+ fechaDesde +"' and FechaHasta eq '"+ fechaHasta +"'"   
                    },
                    success: function(data, response) {
                        that._jsonModel.setProperty("/PagoSet",data);
                        that.getView().setModel(that._jsonModel); 
                        that.byId("tableListaPagos").setBusy(false);                                               
                    },
                    error: function(oError) {
                    }
                });
                this.getSplitAppObj().toDetail(this.createId("detailPagos"));
            },
            onSelectClients: function() {
                this.getSplitAppObj().toDetail(this.createId("detailClients"));
            },
            onFilterPagos: function() {
                var that = this;
                that.byId("tableListaPagos").setBusy(true);

                //Obtiene filtros de fecha
                var fechaDesde = this.byId("fechaPickerPagos").getValue();
                var fechaHasta = this.byId("fechaHastaPickerPagos").getValue();

                var pedido = this.byId("inputPedidoPagos").getValue();
                var pedidoFiltro= "";
                if (pedido)
                    pedidoFiltro = " and Ebeln eq '"+ pedido +"'";

                var factura = this.byId("inputFacturaPagos").getValue();
                var facturaFiltro= "";
                if (factura)
                    facturaFiltro = " and Xblnr eq '"+ factura +"'";
                

                this._oModel.read("/PagoSet", {
                    urlParameters: {
                        "$filter": "Lifnr eq '" + that._oProveedor + //"'"
                        "' and FechaDesde eq '"+ fechaDesde +"' and FechaHasta eq '"+ fechaHasta +"'"
                        + pedidoFiltro + facturaFiltro   
                    },
                    success: function(data, response) {
                        that._jsonModel.setProperty("/PagoSet",data);
                        that.getView().setModel(that._jsonModel); 
                        that.byId("tableListaPagos").setBusy(false);                                               
                    },
                    error: function(oError) {
                    }
                });
                this.getSplitAppObj().toDetail(this.createId("detailPagos"));
            } ,
            onSearchPagos: function() {
                //Inicio los filtros vacios
                var tableFilters = [];
                
                var inputPago = this.byId("inputSearchPagos");
                var valuePago = inputPago.getValue();
                                
                //Para cualquier campo, pregunto si contiene el string
                var totalFilter = new Filter({
                    filters: [                      
                        new Filter({
                            path: "Augbl",
                            operator: FilterOperator.Contains,
                            value1: valuePago
                        }),
                        new Filter({
                            path: "Augdt",
                            operator: FilterOperator.Contains,
                            value1: valuePago
                        }), 
                        new Filter({
                            path: "Budat",
                            operator: FilterOperator.Contains,
                            value1: valuePago
                        }), 
                        new Filter({
                            path: "Xblnr",
                            operator: FilterOperator.Contains,
                            value1: valuePago
                        }), 
                        new Filter({
                            path: "Ebeln",
                            operator: FilterOperator.Contains,
                            value1: valuePago
                        }), 
                        new Filter({
                            path: "DocFiFac",
                            operator: FilterOperator.Contains,
                            value1: valuePago
                        }), 
                        new Filter({
                            path: "DocMmFac",
                            operator: FilterOperator.Contains,
                            value1: valuePago
                        }),
                        new Filter({
                            path: "Butxt",
                            operator: FilterOperator.Contains,
                            value1: valuePago
                        }), 
                        
                    ],                      
                    and: false
                  })
                             
                var oTable = this.getView().byId("tableListaPagos");
                oTable.getBinding("rows").filter(totalFilter); 
            },
            onExportPagos: function() {
                var aCols, oRowBinding, oSettings, oSheet, oTable;
    
                this._oTable = this.byId('tableListaPagos');
                    
                oTable = this._oTable;
                oRowBinding = oTable.getBinding('rows');
                aCols = this.createColumnConfigPagos();
    
                oSettings = {
                    workbook: {
                        columns: aCols,
                        hierarchyLevel: 'Level'
                    },
                    dataSource: oRowBinding,
                    fileName: 'Export Pagos.xlsx',
                    worker: false // We need to disable worker because we are using a MockServer as OData Service
                };
    
                oSheet = new Spreadsheet(oSettings);
                oSheet.build().finally(function() {
                    oSheet.destroy();
                });
            },

	        createColumnConfigPagos: function() {
                var aCols = [];

                aCols.push({
                    label: 'Orden de pago',
                    type: EdmType.String,
                    property: 'Augbl'                    
                });

                aCols.push({
                    label: 'Fecha emisión',
                    property: 'Augdt',
                    type: EdmType.String
                });

                aCols.push({
                    label:'Factura',
                    property: 'Xblnr',
                    type: EdmType.String
                });

                aCols.push({
                    label:'Pedido',
                    property: 'Ebeln',
                    type: EdmType.String
                });

                aCols.push({
                    label:'Doc. Contable',
                    property: 'DocFiFac',
                    type: EdmType.String
                });

                aCols.push({
                    label:'Documento MM',
                    property: 'DocMmFac',
                    type: EdmType.String
                });

                aCols.push({
                    label:'Sociedad',
                    property: 'Butxt',
                    type: EdmType.String
                });

               

                return aCols;
            },
            handleChangeFechaPagos: function() {
                
                var fechaPicker = this.byId("fechaPickerPagos");
                var valueFilter = fechaPicker.getValue();

                var fechaHastaPicker = this.byId("fechaHastaPickerPagos");
                var valueFilterHasta = fechaHastaPicker.getValue();

                var that = this;

                that.byId("tableListaPagos").setBusy(true)

                
                this._oModel.read("/PagoSet", {
                    urlParameters: {
                        "$filter": "Lifnr eq '" + that._oProveedor + "' and FechaDesde eq '"+ valueFilter +"' and FechaHasta eq '" + valueFilterHasta + "'"
                    },
                    success: function(data, response) {
                        that._jsonModel.setProperty("/PagoSet",data);
                        that.getView().setModel(that._jsonModel); 
                        that.byId("tableListaPagos").setBusy(false);                                               
                    },
                    error: function(oError) {
                    }
                });                 

            },
            onChangeFilters: function() {
                
                var tableFilters = [];

                var inputPedido = this.byId("inputPedido");
                var valuePedido = inputPedido.getValue();

                var inputValor = this.byId("inputValor");
                var valueValor = inputValor.getValue();

                var fechaPicker = this.byId("fechaPicker");
                var valueFecha = fechaPicker.getValue();
               
                if (valuePedido){
                    var aFilter =  new Filter({
                        path: "Ebeln",
                        operator: FilterOperator.Contains,
                        value1: inputPedido.getValue()
                    });
                    tableFilters.push(aFilter)
                }

                if (valueValor){
                    var aFilterValor =  new Filter({
                        path: "Netwr",
                        operator: FilterOperator.Contains,
                        value1: valueValor
                    });
                    tableFilters.push(aFilterValor)
                }

                if (valueFecha){
                    var splitFecha = valueFecha.split("/");
                    var mes = splitFecha[0].padStart(2, '0');
                    var dia = splitFecha[1].padStart(2, '0');
                    var anio = '20' + splitFecha[2];
                    var valueFilter = anio + mes + dia;
                    var aFilterFecha =  new Filter({
                        path: "Bedat",
                        operator: FilterOperator.Contains,
                        value1: valueFilter
                    });
                    tableFilters.push(aFilterFecha)
                }

                
                
                var oTable = this.getView().byId("tablePedidos");
                oTable.getBinding("items").filter(tableFilters);   

            },
            onSearchPedidos: function() {
                //Inicio los filtros vacios
                var tableFilters = [];
                
                var inputPedido = this.byId("inputSearchPedidos");
                var valuePedido = inputPedido.getValue();
                var busquedaPedido = inputPedido.getValue()
                
                //Para cualquier campo, pregunto si contiene el string
                var totalFilter = new Filter({
                    filters: [                      
                        new Filter({
                            path: "Ebeln",
                            operator: FilterOperator.Contains,
                            value1: busquedaPedido
                        }),
                        new Filter({
                            path: "Estado",
                            operator: FilterOperator.Contains,
                            value1: busquedaPedido
                        }), 
                        new Filter({
                            path: "Bedat",
                            operator: FilterOperator.Contains,
                            value1: busquedaPedido
                        }), 
                        new Filter({
                            path: "Netwr",
                            operator: FilterOperator.Contains,
                            value1: busquedaPedido
                        }), 
                        new Filter({
                            path: "Waers",
                            operator: FilterOperator.Contains,
                            value1: busquedaPedido
                        }), 
                        new Filter({
                            path: "Vtext",
                            operator: FilterOperator.Contains,
                            value1: busquedaPedido
                        }), 
                        new Filter({
                            path: "Bloqu",
                            operator: FilterOperator.Contains,
                            value1: busquedaPedido
                        }),
                        new Filter({
                            path: "Butxt",
                            operator: FilterOperator.Contains,
                            value1: busquedaPedido
                        }), 
                    ],
                      
                    and: false
                  })
                             
                var oTable = this.getView().byId("tablePedidos");
                oTable.getBinding("rows").filter(totalFilter);   

            },
            onFilterPedidos: function() {
                var that = this;

                //Obtiene los filtros de fecha              
                var fechaDesde = this.byId("fechaPedidosPicker").getValue();
                var fechaHasta = that.byId("fechaHastaPedidosPicker").getValue();
                
                var pedido = this.byId("inputPedido").getValue();
                var pedidoFiltro= "";
                if (pedido)
                    pedidoFiltro = " and Ebeln eq '"+ pedido +"'";
                
                //Filtros de checkboxes
                var estadoFiltro = "";
                
                if (this.byId("checkEstadoV").getSelected())
                    estadoFiltro = "V";
                
                if (this.byId("checkEstadoA").getSelected())
                    estadoFiltro = estadoFiltro + "A";
                
                if (this.byId("checkEstadoR").getSelected())
                    estadoFiltro = estadoFiltro + "R";

                if (estadoFiltro)
                    estadoFiltro = " and Estado eq '"+ estadoFiltro +"'";

                var anticipoFiltro = "";
                if (this.byId("checkAnticipo").getSelected())
                    anticipoFiltro = " and Anticipo eq 'A'";
                
                var bloqueadoFiltro = "";
                if (this.byId("checkLiberar").getSelected())
                    bloqueadoFiltro = " and Bloqu eq 'X'";

                
                that._oModel.read("/PedidoSet", {
                    urlParameters: {
                        "$filter": "Lifnr eq '" + that._oProveedor + 
                        "' and FechaDesde eq '"+ fechaDesde +"' and FechaHasta eq '"+ fechaHasta +"'" 
                        + pedidoFiltro + estadoFiltro + anticipoFiltro + bloqueadoFiltro
                    },
                    success: function(dataPedidos, responsePedidos) {
                        that._jsonModel.setProperty("/PedidoSet",dataPedidos.results);                                              
                    },
                    error: function(oError) {
                    }
                });      
                this.getSplitAppObj().toDetail(this.createId("detailOrdenes"));
            },
            onExportPedidos: function() {
                var aCols, oRowBinding, oSettings, oSheet, oTable;
    
                this._oTable = this.byId('tablePedidos');
                    
                oTable = this._oTable;
                oRowBinding = oTable.getBinding('rows');
                aCols = this.createColumnConfigPedidos();
    
                oSettings = {
                    workbook: {
                        columns: aCols,
                        hierarchyLevel: 'Level'
                    },
                    dataSource: oRowBinding,
                    fileName: 'Export Pedidos.xlsx',
                    worker: false // We need to disable worker because we are using a MockServer as OData Service
                };
    
                oSheet = new Spreadsheet(oSettings);
                oSheet.build().finally(function() {
                    oSheet.destroy();
                });
            },
            createColumnConfigPedidos: function() {
                var aCols = [];

                aCols.push({
                    label: 'Estado',
                    type: EdmType.String,
                    property: 'Estado'                    
                });

                aCols.push({
                    label: 'Pedido',
                    property: 'Ebeln',
                    type: EdmType.String
                });

                aCols.push({
                    label:'Fecha',
                    property: 'Bedat',
                    type: EdmType.String
                });

                aCols.push({
                    label:'Valor Neto',
                    property: 'Netwr',
                    type: EdmType.String
                });

                aCols.push({
                    label:'Condiciones de Pago',
                    property: 'Vtext',
                    type: EdmType.String
                });

                aCols.push({
                    label:'Bloqueado',
                    property: 'Bloqu',
                    type: EdmType.String
                });

                aCols.push({
                    label:'Empresa',
                    property: 'Butxt',
                    type: EdmType.String
                });

               

                return aCols;
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
            onChangeFechaDesde: function(evt) {
                //Calculo un año hacia adelante desde la fecha desde
                var fechaPicker = evt.getSource();
                var valueFechaHasta = fechaPicker.getValue();
               
                if (valueFechaHasta){
                    var anio = valueFechaHasta.substr(0,4);
                    var anioSiguiente = parseInt(anio)  + 1;                   
                }
                var valueFechaDesde = anioSiguiente + valueFechaHasta.substr(4,4);
                
                //Pregunto desde que pagina estoy, si Pedidos, Pagos o Facturas
                if (fechaPicker.getId().includes("fechaPedidosPicker")) 
                    var fechaHastaPicker = this.byId("fechaHastaPedidosPicker");

                else if (fechaPicker.getId().includes("fechaFacturasPicker"))
                    var fechaHastaPicker = this.byId("fechaHastaFacturasPicker")

                else   
                    var fechaHastaPicker = this.byId("fechaHastaPickerPagos");
                                                
                
                fechaHastaPicker.setValue(valueFechaDesde);

                //Armo un objeto date para setear la maxima fecha en el DatePicker
                var objectDate = new Date();
                objectDate.setFullYear(anioSiguiente);
                objectDate.setDate(valueFechaHasta.substr(6,2));
                objectDate.setMonth(parseInt(valueFechaHasta.substr(4,2)) - 1)
                
                fechaHastaPicker.setMaxDate(objectDate);
                //Y para setear la minima 
                //objectDate.setFullYear(anio);
                //fechaHastaPicker.setMinDate(objectDate);
            },
            handleLinkFactura: function(evt) {
                var linkFactura = evt.getSource();
                var numFactura = linkFactura.getText();
                var that = this;

                var facturaModel = linkFactura.getParent().getModel();
                var facturaElegida = facturaModel.getProperty(linkFactura.getBindingContext().sPath)
                
                var pedido = facturaElegida.Ebeln;
                var ejercicio = facturaElegida.Gjahr;

                numFactura = "0411A77807789";
                pedido = "4800000026";
                ejercicio = "2024";

                this._oModel.read("/FacturaSet(Xblnr='" + numFactura +"',Ebeln='"+ pedido +"',Gjahr='"+ ejercicio +"')", {
                    //urlParameters: {
                    //    "$expand": "DetalleSet"
                    //},
                    success: function(data, response) {
                        that._jsonModel.setProperty("/FacturaSeleccionada",data);
                        that.getView().setModel(that._jsonModel);
                        that.getDetalleFactura(numFactura,pedido,ejercicio)                                                
                    },
                    error: function(oError) {
                    }
                });

                //this.getSplitAppObj().toDetail(this.createId("detailFactura"));

            },
            handleLinkPago: function(evt) {
                var linkPago = evt.getSource();
                var numPago = linkPago.getText();
                var that = this;
                var pagosModel = linkPago.getParent().getModel();
                var pagoSeleccionado = pagosModel.getProperty(linkPago.getBindingContext().sPath)
                
                var pedido = pagoSeleccionado.Ebeln;
                var ejercicio = pagoSeleccionado.Gjahr;
                var codSociedad = pagoSeleccionado.Bukrs;
                
                /*numFactura = "0411A77807789";
                pedido = "4800000026";
                ejercicio = "2024";*/
 
                this._oModel.read("/PagoSet(Augbl='"+ numPago + "',Bukrs='"+ codSociedad +"',Gjahr='"+ ejercicio +
                                "',Ebeln='"+ pedido +"')/DetalleSet", {
                    //urlParameters: {
                    //    "$filter": "Augbl eq '"+ numPago +"' and Bukrs eq '" + codSociedad +
                    //     "' and Gjahr eq '"+ ejercicio +"' and Ebeln eq '" + pedido +"'"
                    //},
                    success: function(data, response) {
                        that._jsonModel.setProperty("/ListaPagos",data.results);
                        that.getView().setModel(that._jsonModel); 
                        that.getPagosCancelados(numPago,codSociedad,ejercicio,pedido);  
                        that.getSplitAppObj().toDetail(that.createId("detailPago"));                                                                       
                    },
                    error: function(oError) {
                    }
                });

                
            },
            getPagosCancelados: function(numPago,codSociedad,ejercicio,pedido) {
                var that = this;
                               
                /*numFactura = "0411A77807789";
                pedido = "4800000026";
                ejercicio = "2024";*/
 
                this._oModel.read("/PagoSet(Augbl='"+ numPago + "',Bukrs='"+ codSociedad +"',Gjahr='"+ ejercicio +
                                "',Ebeln='"+ pedido +"')/CanceladoSet", {
                    success: function(data, response) {
                        that._jsonModel.setProperty("/ListaCancelados",data.results);
                        that.getView().setModel(that._jsonModel);                                                                                            
                    },
                    error: function(oError) {
                    }
                });

                
            },
            getDetalleFactura: function(numFactura,pedido,ejercicio) {
                var that = this;
                this._oModel.read("/FacturaSet(Xblnr='" + numFactura +"',Ebeln='"+ pedido +"',Gjahr='"+ ejercicio +"')/DetalleSet", {
                    success: function(data, response) {
                        that._jsonModel.setProperty("/FacturaSeleccionada/DetalleSet",data.results);
                        that.getView().setModel(that._jsonModel); 
                        that.getPedidosFactura(numFactura,pedido,ejercicio) ;
                        that.getSplitAppObj().toDetail(that.createId("detailFactura"));                                                                      
                    },
                    error: function(oError) {
                    }
                });   
            },
            getPedidosFactura: function(numFactura,pedido,ejercicio) {
                var that = this;
                this._oModel.read("/FacturaSet(Xblnr='" + numFactura +"',Ebeln='"+ pedido +"',Gjahr='"+ ejercicio +"')/PedidoSet", {
                    success: function(data, response) {
                        that._jsonModel.setProperty("/FacturaSeleccionada/PedidoSet",data.results);
                        that.getView().setModel(that._jsonModel); 
                        that.getPagosFactura(numFactura,pedido,ejercicio) ;                                                                                            
                    },
                    error: function(oError) {
                    }
                });               

            },
            getPagosFactura: function(numFactura,pedido,ejercicio) {
                var that = this;
                
                this._oModel.read("/FacturaSet(Xblnr='" + numFactura +"',Ebeln='"+ pedido +"',Gjahr='"+ ejercicio +"')/PagoSet", {
                    success: function(data, response) {
                        that._jsonModel.setProperty("/FacturaSeleccionada/PagoSet",data.results);
                        that.getView().setModel(that._jsonModel);                                                                                             
                    },
                    error: function(oError) {
                    }
                });            

            },
            onPressDownloadPago: function() {
                var that = this;
                //Obtengo la lista de pagos y los parametros para el PDF
                var pagosData = that._jsonModel.getProperty("/ListaPagos");
                var pago = pagosData[0]

                var bukrs = pago.bukrs;
                var belnr = pago.augbl;
                var gjahr = pago.gjahr;
                
                var bukrs = 'AR10';
                var belnr = '150000931';
                var gjahr = '2019';

                //Busco el PDF con Ajax, Model.Read no funciona
                $.ajax({
                    url: "/sap/opu/odata/sap/Z_PORTAL_PROVEEDORES_SRV/FilePagoSet(Bukrs='" + bukrs + "',Belnr='"+ belnr 
                    +"',Gjahr='" + gjahr + "')/$value",
                    success: function(data) {
                      /*var blob=new Blob([data]);
                      var link=document.createElement('a');
                      link.href=window.URL.createObjectURL(blob);
                      link.target = "_BLANK";
                      //link.download="Pago "+ belnr + ".pdf";
                      link.click();*/
                      var url = URL.createObjectURL(new Blob([data], {type: 'application/pdf'}));
                     window.open(url);
                    }
                  });
               
            },
            onVerDocumento: function() {
                var that = this;
                //Obtengo la lista de pagos y los parametros para el PDF
                
                var url = URL.createObjectURL(new Blob([that.binaryFactura], {type: 'application/pdf'}));
                window.open(url);
                                
            },
            //Validaciones UI

            _validateInput: function (oInput) {
                var sValueState = "None";
                var bValidationError = false;
                var oBinding = oInput.getBinding("value");
    
                    //Si el input es select
                    if (oInput.getId().includes("selectTipoFactura") || oInput.getId().includes("selectMonedaFactura")
                    || oInput.getId().includes("selectDocRef")) {
                        if (!oInput.getSelectedKey()) {                            
                                sValueState = "Error";
                                bValidationError = true;
                                oInput.setValueStateText("Debe ingresar un valor");    
                        }
                    }                     
                    else if (oInput.getId().includes("fileUploaderFactura")) {
                        if (!oInput.getValue()) {                            
                                sValueState = "Error";
                                bValidationError = true;
                                oInput.setValueStateText("Debe seleccionar un PDF menor a 2MB");    
                        }
                    } else {
                        try {
                            oBinding.getType().validateValue(oInput.getValue());
                        } catch (oException) {
                    sValueState = "Error";
                    bValidationError = true;
                    oInput.setValueStateText(oException.message);
                    }
                }
    
                oInput.setValueState(sValueState);
                
    
                return bValidationError;
            },
            onChangeValidate: function (evt) {
                this._validateInput(evt.getSource());
            },
            handleUploadComplete: function (evt) {
                var aFile = oEvent.getParameter("files");
            },
               // When user select the file then this method will call....
  handleSelectFile: function (oEvent) {
    var fileDetails = oEvent.getParameters("file").files[0];
    sap.ui.getCore().fileUploadArr = [];
    if (fileDetails) {
     var mimeDet = fileDetails.type,
      fileName = fileDetails.name;
      
      // Calling method....
     this.base64coonversionMethod(mimeDet, fileName, fileDetails, "001");
    } else {
     sap.ui.getCore().fileUploadArr = [];
    }
   },
 
   // Base64 conversion of selected file(Called method)....
   base64coonversionMethod: function (fileMime, fileName, fileDetails, DocNum) {
    var that = this;
    if (!FileReader.prototype.readAsBinaryString) {
     FileReader.prototype.readAsBinaryString = function (fileData) {
      var binary = "";
      var reader = new FileReader();
      reader.onload = function (e) {
       var bytes = new Uint8Array(reader.result);
       var length = bytes.byteLength;
       for (var i = 0; i < length; i++) {
        binary += String.fromCharCode(bytes[i]);
       }
       that.binaryFactura = binary;
       that.base64ConversionRes = btoa(binary);
       sap.ui.getCore().fileUploadArr.push({
        "DocumentType": DocNum,
        "MimeType": fileMime,
        "FileName": fileName,
        "Content": that.base64ConversionRes,
       });
      };
      reader.readAsArrayBuffer(fileData);
     };
    }
    var reader = new FileReader();
    reader.onload = function (readerEvt) {
     var binaryString = readerEvt.target.result;
     that.binaryFactura = binaryString
     that.base64ConversionRes = btoa(binaryString);
     sap.ui.getCore().fileUploadArr.push({
      "DocumentType": DocNum,
      "MimeType": fileMime,
      "FileName": fileName,
      "Content": that.base64ConversionRes,
 
     });
    };
    reader.readAsBinaryString(fileDetails);
   },
            onContinuarSubmitFactura: function () {
                //Valido controles
                var oView = this.getView(),
                    aInputs = [
                    oView.byId("codigoProveedor"),
                    oView.byId("numeroFactura"),
                    oView.byId("fechaCargaFactura"),
                    oView.byId("importeFactura"),
                    oView.byId("selectTipoFactura"),
                    oView.byId("selectMonedaFactura"),
                    oView.byId("fileUploaderFactura"),
                    oView.byId("codAutorizacion")
                ],
                bValidationError = false;
                
                //Validaciones condicionales
                var selectDocReferencia = oView.byId("selectDocRef");
                var facturaReferencia = oView.byId("facturaRef");
                
                //Si se selecciono tipo documento Factura
                if (selectDocReferencia.getVisible())
                    aInputs.push(selectDocReferencia)
                else if (oView.byId("selectTipoFactura").getSelectedKey())
                    aInputs.push(oView.byId("facturaRef"));
                
                // Check that inputs are not empty.
                // Validation does not happen during data binding as this is only triggered by user actions.
                aInputs.forEach(function (oInput) {                  
                        
                    bValidationError = this._validateInput(oInput) || bValidationError;
                }, this);
    
                var modelCarga = this.getView().getModel();
                //Si es de tipo Factura se envía 'P' sino N
                var tipoDato = "N"
                if (modelCarga.getProperty("/FacturaCarga/TipoFactura") == "Factura")
                    tipoDato = "P";
                    
                var that = this;

                var fechaHasta = this.formatFilterDate(new Date());                

                if (!bValidationError) {

                    //that.uploadFileFactura();
                    that._oModel.read("/PedidoSet", {
                        urlParameters: {
                            "$filter": "Lifnr eq '" + modelCarga.getProperty("/FacturaCarga/CodigoProveedor") +
                             "' and FechaDesde eq '"+ "19990101" +"' and FechaHasta eq '"+ fechaHasta +
                            "' and TipoDocFact eq '"+ tipoDato  +"' and Bukrs eq '" + that._oSociedad + "'" 
                        },
                        success: function(dataPedidos, responsePedidos) {                            
                           
                            that._jsonModel.setProperty("/PedidoCargaSet",dataPedidos.results);   
                            that.getSplitAppObj().toDetail(that.createId("detailCargaFacturaOrdenes"));                                           
                        },
                        error: function(oError) {
                        }
                    });      
                    
                }
            },
            onSearchPedidosCargaFactura: function() {
                //Inicio los filtros vacios
                var tableFilters = [];
                
                var inputPedido = this.byId("inputSearchOrdenesCarga");
                var busquedaPedido = inputPedido.getValue()
                
                //Para el campo Ebeln, pregunto si contiene el string
                var totalFilter = new Filter({
                    filters: [                      
                        new Filter({
                            path: "Ebeln",
                            operator: FilterOperator.Contains,
                            value1: busquedaPedido
                        })
                    ]
                  })
                             
                var oTable = this.getView().byId("tablePedidosCarga");
                oTable.getBinding("rows").filter(totalFilter);   

            },
            onContinuarSelectPedidos: function () {
                //Obteno la lista de pedidos seleccionados
                var tablaPedidosCarga = this.byId("tablePedidosCarga");               
                var selectedIndices = tablaPedidosCarga.getSelectedIndices();           

                //Armo el filtro con la lista de OCs
                var separador = "";
                var filtroPedidos = "";
                if (selectedIndices.length == 0)
                    MessageBox.warning("Debe seleccionar una orden",{
                       title: "Advertencia"});
                else {
                    selectedIndices.forEach((indice) =>  {
                        var pedido = tablaPedidosCarga.getRows()[indice].getCells()[0].getText();
                        filtroPedidos = filtroPedidos + separador + pedido;
                        separador = "-";
                    })
                            
                    var that = this;
                    that._oModel.read("/PosicionPedidoSet", {
                            urlParameters: {
                                "$filter": "TipoCargaFactura eq '" + "P" +
                                "' and FiltroCargaFactura eq '" + filtroPedidos + "'" 
                            },
                            success: function(dataPosiciones, responsePedidos) {

                                dataPosiciones.results.forEach((posicion) =>  {
                                    posicion["Pendiente"] = posicion.Netpr * posicion.Menge;                                
                                });
                                that._jsonModel.setProperty("/PosicionesCargaSet",dataPosiciones.results);   
                                that.getSplitAppObj().toDetail(that.createId("detailCargaFacturaPosiciones"));                                           
                            },
                            error: function(oError) {
                            }
                        });      
                    }
                
            },
            onVolverSelectPedidos: function () {
                 
                this.getSplitAppObj().toDetail(this.createId("detailCargaFactura"));                                           
                       
                
            },
            onContinuarSelectPosiciones: function () {
                //Obtengo la lista de posiciones seleccionadas
                var tablaPosicionesCarga = this.byId("tablePosicionesCarga");               
                var selectedIndices = tablaPosicionesCarga.getSelectedIndices();           
                var that = this;
                if (selectedIndices.length == 0)
                    MessageBox.warning("Debe seleccionar una posición",{
                       title: "Advertencia"});
                else {
                    //Filtro por posiciones seleccionadas para la confirmación
                    
                    var tablaFilter = new Filter({filters: [ ], and:false})
                    selectedIndices.forEach((indice) =>  {
                        var posicion = tablaPosicionesCarga.getRows()[indice].getCells()[1].getText();
                        tablaFilter.aFilters.push(  
                            new Filter({
                                path: "Ebelp",
                                operator: FilterOperator.Contains,
                                value1: posicion
                            })
                        )
                    })
                    var tablaConfirmacionCarga = this.byId("tableConfirmacionCarga");
                    tablaConfirmacionCarga.getBinding("rows").filter(tablaFilter);

                    that.getSplitAppObj().toDetail(that.createId("detailCargaFacturaConfirmacion"));
                }
                
                //Armo el filtro con la lista de OCs
                /*var separador = "";
                var filtroPedidos = "";

                selectedIndices.forEach((indice) =>  {
                    var pedido = tablaPedidosCarga.getRows()[indice].getCells()[0].getText();
                    filtroPedidos = filtroPedidos + separador + pedido;
                    separador = "-";
                })
                        
                var that = this;
                that._oModel.read("/PosicionPedidoSet", {
                        urlParameters: {
                            "$filter": "TipoCargaFactura eq '" + "P" +
                             "' and FiltroCargaFactura eq '" + filtroPedidos + "'" 
                        },
                        success: function(dataPosiciones, responsePedidos) {

                            dataPosiciones.results.forEach((posicion) =>  {
                                posicion["Pendiente"] = posicion.Netpr * posicion.Menge;                                
                            });
                            that._jsonModel.setProperty("/PosicionesCargaSet",dataPosiciones.results);   
                            that.getSplitAppObj().toDetail(that.createId("detailCargaFacturaPosiciones"));                                           
                        },
                        error: function(oError) {
                        }
                    }); */
                            
            },
            onVolverSelectPosiciones: function () {
                 
                this.getSplitAppObj().toDetail(this.createId("detailCargaFacturaOrdenes"));                                           
                       
                
            },

            onContinuarConfirmarCarga: function () {

                var modelCarga = this.getView().getModel();
                var that = this;
                //Armo el payload para la estructura profunda
                var payload =  {
                    /*Comp :  modelCarga.getProperty("/FacturaCarga/TipoFactura"),
                    Bukrs : modelCarga.getProperty("/FacturaCarga/Bukrs"),
                    Pstng_Date : "12122024",
                    Ref_Doc_No: modelCarga.getProperty("/FacturaCarga/Ref_Doc"),
                    Moneda: modelCarga.getProperty("/FacturaCarga/Moneda"),
                    //Xblnr:modelCarga.getProperty("/FacturaCarga/Xblnr"),*/
                    Xblnr:'12332132',
                    Ebeln:'1234567890',
                    //Total: modelCarga.getProperty("/FacturaCarga/importe"),
                    //Lifnr: modelCarga.getProperty("/FacturaCarga/CodigoProveedor"),
                    Gjahr:'2024',
                    PosicionSet : [],
                    Usuario: "admin2",
                    //Tknum: "",
                    //Pdf: that.base64ConversionRes,
                    //Ruta : "",
                    //Com : modelCarga.getProperty("/FacturaCarga/Comentario"),
                    //Tipo_Cae : modelCarga.getProperty("/FacturaCarga/tipoComprobante"),
                    //Cae : modelCarga.getProperty("/FacturaCarga/Tipo_cae")
                }
                
                var listaPosiciones = modelCarga.getProperty("/PosicionesCargaSet");

                listaPosiciones.forEach((pos) =>  {
                    var detalle = {}
                    detalle.Ebeln = pos.Ebeln;
		            detalle.Ebelp = pos.Posnr;
		            /*detalle.Xblnr= "";
		            detalle.Buzei = pos.Buzei;                    
                    detalle.Matnr = pos.Matnr;
		            detalle.Maktx = pos.Maktx;
		            detalle.Menge = pos.Menge;
		            detalle.Meins  = pos.Meins;
                    detalle.Netpr = pos.NetPr;
                    detalle.Waers = pos.Waers;
                    detalle.Um_gui = "";
                    detalle.Belnr = "";
                    detalle.Gjahr  = "";*/
                    payload.PosicionSet.push (detalle);
                })

                delete payload.__metadata;
                //var oSalesOrderContext = that._oModel.createEntry("/FacturaSet", {properties : payload});
                //that._oModel.submitChanges();
                
               /* payload =  {
                    Soc : "1321",
                    Descr: "SWodie",
                    Prov: "213442132",
                    Exist: "X",
                    IsValid: "X",
                    Deleted: ""
                };
                
                that._oModel.create("/SociedadSet", payload, {
                    method: "POST",
                    success: function(dataPedidos) {
                        that._jsonModel.setProperty("/PedidoSet",dataPedidos.results);                                              
                    },
                    error: function(oError) {
                        MessageBox.warning(oError.message,{
                            title: "Advertencia"});
                    }
                }); */
                that._oModel.create("/SociedadSet", payload, {
                    method: "POST",
                    success: function(dataPedidos) {
                        that._jsonModel.setProperty("/PedidoSet",dataPedidos.results);                                              
                    },
                    error: function(oError) {
                        MessageBox.warning(oError.message,{
                            title: "Advertencia"});
                    }
                }); 
                                                
                       
                
            },
            //Tipos extendidos para validación
            customFactura: SimpleType.extend("string", {
                formatValue: function (oValue) {
                    return oValue;
                },
    
                parseValue: function (oValue) {
                    //parsing step takes place before validating step, value could be altered here
                    return oValue;
                },
    
                validateValue: function (oValue) {
                    // The following Regex is only used for demonstration purposes and does not cover all variations of email addresses.
                    // It's always better to validate an address by simply sending an e-mail to it.
                    var rexFactura = /^[0-9]{4,5}[A-Z][0-9]{8}$/;
                    if (!oValue.match(rexFactura)) {
                        throw new ValidateException("Debe ingresar una factura válida");
                    }
                }
            }),
            customString: SimpleType.extend("string", {
                formatValue: function (oValue) {
                    return oValue;
                },
    
                parseValue: function (oValue) {
                    //parsing step takes place before validating step, value could be altered here
                    return oValue;
                },
    
                validateValue: function (oValue) {
                    if (!oValue) {
                        throw new ValidateException("Debe ingresar un valor");
                    }
                }
            }),
            customFecha: SimpleType.extend("string", {
                formatValue: function (oValue) {
                    return oValue;
                },
    
                parseValue: function (oValue) {
                    //parsing step takes place before validating step, value could be altered here
                    return oValue;
                },
    
                validateValue: function (oValue) {
                    var rexFecha = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
                    if (!oValue.match(rexFecha)) {                   
                        throw new ValidateException("Debe ingresar una fecha con formato dd/mm/aaaa");
                    }
                }
            }),
            customImporte: SimpleType.extend("string", {
                formatValue: function (oValue) {
                    return oValue;
                },
    
                parseValue: function (oValue) {
                    //parsing step takes place before validating step, value could be altered here
                    return oValue;
                },
    
                validateValue: function (oValue) {
                    var rexImporte = /^[0-9]+([,][0-9]+)?$/;
                    if (!oValue.match(rexImporte)) {                   
                        throw new ValidateException("Debe ingresar los decimales separados por una coma");
                    }
                }
            }),

            customCodAutorizacion: SimpleType.extend("string", {
                formatValue: function (oValue) {
                    return oValue;
                },
    
                parseValue: function (oValue) {
                    //parsing step takes place before validating step, value could be altered here
                    return oValue;
                },
    
                validateValue: function (oValue) {
                    var rexCodigo = /^(\d{14})$/;
                    if (oValue && !oValue.match(rexCodigo) ) {
                        throw new ValidateException("Debe ingresar 14 dígitos");
                    }
                }
            }),
            //Funciones Auxiliares
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
