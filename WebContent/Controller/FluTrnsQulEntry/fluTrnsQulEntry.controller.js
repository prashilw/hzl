sap.ui.define([
    "com/hzl/Controller/baseController",
    "sap/ui/core/util/Export",
    "sap/ui/core/util/ExportTypeCSV",
    "sap/m/MessageBox",
    "sap/m/TablePersoController",
    "com/hzl/Controller/FluTrnsQulEntry/fluTrnsQulEntryPersoService",
    "sap/ui/model/Sorter",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/resource/ResourceModel",
    "com/hzl/Util/ajaxHandler",
    "com/hzl/Util/myFormatter"
], function(baseController, Export, ExportTypeCSV, MessageBox, TablePersoController, fluTrnsQulEntryPersoService, Sorter, JSONModel, ResourceModel, ajaxHandler, myFormatter) {
    "use strict";

    return baseController.extend("com.hzl.Controller.FluTrnsQulEntry.fluTrnsQulEntry", {

        /** SAP UI5 life cycle method triggered on first load 
         *  @DefaultValue setting default value for date control 
         *  @TablePersoController creating TablePersoController for table
         *  @Models viewModel for basic view operations and another i18n for ResourceModel
         *  @Method viewSettingInit method for instantiation view setting dialog , initialSettings for user data and role based visiblity
         */
        onInit: function() {
            this.getView().setModel(new JSONModel({
                enable : false,
                quantityChanged : 0,
                inc : 0,
                visiblity: {
                    tableFieldEnabled: false,
                    updateSave: false,
                    updateCancel: false
                }
            }), "viewModel");
            this.oViewModel = this.getView().getModel("viewModel");
            this.initialSettings();
            this.getView().byId("toDate").setValue(this.changeDateFormat(new Date()).slice(0, 10));
            this.getView().byId("frmDate").setValue(this.changeDateFormat(new Date(new Date().setDate(new Date().getDate() - 2))).slice(0, 10));
            this._oTPC = new TablePersoController({
                table: this.getView().byId("fluTrnsQualityEntryTable"),
                componentName: "FTQE",
                persoService: fluTrnsQulEntryPersoService
            }).activate();
            this.viewSettingInit();
            this.getView().setModel(new ResourceModel({
                bundleUrl: "i18n/messageBundle.properties"
            }), "i18n");
        },
        
        /** @Formatter loads the Formatter file
         */        
        formatter: myFormatter,

        /** @Event press event triggers when import icon clicked on table header to export in CSV file
         */
        onDataExport: function() {
            var that = this;
            var oExport = new Export({
                exportType: new ExportTypeCSV({}),
                models: this.getView().getModel("tableModel"),
                rows: {
                    path: "/Rowsets/Rowset/0/Row/"
                },
                columns: [{
                    name: "Date",
                    template: {
                        content: "{S_DATE}"
                    }
                }, {
                    name: "Shift",
                    template: {
                        content: "{SHIFT}"
                    }
                }, {
                    name: "Material Transfered",
                    template: {
                        content: "{TO_MAT_DESC}"
                    }
                }, {
                    name: "Material Transfered From",
                    template: {
                        content: "{FROM_PLANT_DESC}"
                    }
                }, {
                    name: "Material Transfered To",
                    template: {
                        content: "{TO_PLANT_DESC}"
                    }
                }, {
                    name: "Quantity",
                    template: {
                        content: "{MAT_QTY}"
                    }
                }, {
                    name: "Quantity UOM",
                    template: {
                        content: "m3"
                    }
                }]
            });

            oExport.saveFile().catch(function(oError) {
                MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("expoErrorAlert") + oError);
            }).then(function() {
                oExport.destroy();
            });
        },

        /** @Event press event triggers when setting icon clicked on table header
         */
        onPersoButtonPressed: function() {
            this._oTPC.openDialog();
        },

        /** @Event press event triggers to refresh persona 
         */
        onTablePersoRefresh: function() {
            fluTrnsQulEntryPersoService.resetPersData();
            this._oTPC.refresh();
        },

        /** @Event press event triggers to get selected persona items
         */
        onTableGrouping: function(oEvent) {
            this._oTPC.setHasGrouping(oEvent.getSource().getSelected());
        },

        /** @Event press event triggers when view setting icon clicked on table header
         */
        handleViewSettings: function() {
            if (!this._settingDialog) {
                this._settingDialog = sap.ui.xmlfragment("com.hzl.view.FluTrnsQulEntry.FluTrnsQulEnStgs", this);
                this._settingDialog.setModel(this.getView().getModel("i18n"), "i18n");
            }
            this._settingDialog.open();
        },

        /** @Event press event triggers when view setting parameters are set
         */
        handleConfirm: function(oEvent) {
            var oView = this.getView();
            var oTable = oView.byId("fluTrnsQualityEntryTable");
            var mParams = oEvent.getParameters();
            var oBinding = oTable.getBinding("items");
            var sPath;
            var bDescending;
            var vGroup;
            var aSorters = [];
            if (mParams.groupItem) {
                sPath = mParams.groupItem.getKey();
                bDescending = mParams.groupDescending;
                vGroup = this.mGroupFunctions[sPath];
                aSorters.push(new Sorter(sPath, bDescending, vGroup));
            }
            sPath = mParams.sortItem.getKey();
            bDescending = mParams.sortDescending;
            aSorters.push(new Sorter(sPath, bDescending));
            oBinding.sort(aSorters);
        },

        /** @Event search event name onSearch triggers when search button clicked
         *  @Validation validation for Empty mandatory fields and reverse date
         *  @oAjaxHandler reusable ajax call
         */
        onSearch: function() {
            this.oViewModel.setProperty("/enable", false);
            this.oViewModel.setProperty("/oIndex", undefined);
            this.filterBar = this.getView().byId("FTQE_fltBar");
            var fromDate = this.getView().byId("frmDate").getValue() + " 00:00:00";
            var toDate = this.getView().byId("toDate").getValue() + " 23:59:59";
            var plant = this.getView().byId("FTQEplant");
            if (this.validation(this.filterBar) > 0) {
            	sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("mandAlert"));
                return;
            }
            if (Date.parse(fromDate.slice(0, 10) + " " + fromDate.slice(11).split("-").join(":")) >= Date.parse(toDate.slice(0, 10) + " " + toDate.slice(11).split("-").join(":"))) {
            	sap.m.MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("dateAlert"));
                return;
            }
            this.startBusyIndicator();
            var oAjaxHandler = ajaxHandler.getInstance();
            oAjaxHandler.setProperties("QueryTemplate", "SAP_ZN_REC/FLUID_TRANSFER_REPORT/QRY/XQRY_FLUID_TRN_QTYDET_DIS");
            oAjaxHandler.setProperties("IsTesting", "T");
            oAjaxHandler.setProperties("Param.1", fromDate);
            oAjaxHandler.setProperties("Param.2", toDate);
            oAjaxHandler.setProperties("Param.3", plant.getValue());
            oAjaxHandler.setCallBackSuccessMethod(this.successSrch, this);
            oAjaxHandler.setCallBackFailureMethod(this.failRequestScrch, this);
            oAjaxHandler.triggerPostRequest();
        },

        /** @Function callback function for ajax success
         */
        successSrch: function(rs) {  
            this.getView().setModel(new JSONModel(), "tableModel");                        
    		if(rs.Rowsets.Rowset[1].Row["0"].SUCC_IND === 1){
                var myModel = new JSONModel(rs);
                myModel.setSizeLimit(1000);
                this.getView().setModel(myModel, "tableModel");     	
                this.stopBusyIndicator();
    		}else{
    			var rsp = {};
    			rsp.statusText = rs.Rowsets.Rowset[1].Row["0"].SUCCERR_MESSAGE;
    			this.failRequestScrch(rsp);
    		}             
        },

        /** @Function callback function for ajax fail
         */
        failRequestScrch: function(rs) {
            sap.m.MessageBox.alert(rs.statusText);
            this.stopBusyIndicator();
        },

        /** @Method called when reset button is clicked
         *  @Functinality resets the control data 
         */
        onReset: function() {
            this.getView().byId("frmDate").setValue("");
            this.getView().byId("toDate").setValue("");
            this.getView().byId("FTQEplant").setSelectedKey(null);
        },

        /** @Function validation for empty data in mandatory fields
         *  @Return numeric value
         */
        validation: function() {
            var that = this;
            var result = 0;
            var arr = ["frmDate", "toDate", "FTQEplant"];
            arr.forEach(function(items) {
                if (that.getView().byId(items).getValue() == "") {
                    that.getView().byId(items).setValueState("Error");
                    result++;
                } else {
                    that.getView().byId(items).setValueState("None");
                }
            });
            return result;
        },

        /** @Event press event trigger on clicking cancel button
         */
        onCancel: function() {
            var oViewModel = this.oViewModel.getData();
            oViewModel.quantityChanged = 0;
            this.oViewModel.setData(oViewModel);
            this.onSearch();
        },

        /** @Event press event trigger on clicking save button of page not add dialog
         *  @Visiblity setting visiblity of save and cancel button
         *  @Model getting the required data into model table getSelected item method
         *  @oAjaxHandler reusable ajax call
         */
        onUpdate: function(oEvent, index) {
            this.oViewModel.setProperty("/enable", false);
            var oViewModel = this.oViewModel.getData();
            oViewModel.quantityChanged = 0;
            this.oViewModel.setData(oViewModel);
            var myEditModel1 = this.getView().getModel("myEdit").getData();
            if (index != undefined) {
                myEditModel1.fourth = this.getView().byId("fluTrnsQualityEntryTable").getItems()[index].getCells()[5].getValue();
                myEditModel1.first = this.previousEditData.first;
                myEditModel1.second = this.previousEditData.second;
                myEditModel1.third = this.previousEditData.third;
                myEditModel1.fifth = this.previousEditData.fifth;
            } else {
                myEditModel1.fourth = this.getView().byId("fluTrnsQualityEntryTable").getSelectedItem().getCells()[5].getValue();
            }
            var oAjaxHandler = ajaxHandler.getInstance();
            oAjaxHandler.setProperties("QueryTemplate", "SAP_ZN_REC/FLUID_TRANSFER_REPORT/QRY/XQRY_FLUID_TRN_UPD_ROW_QTY");
            oAjaxHandler.setProperties("Param.1", myEditModel1.first);
            oAjaxHandler.setProperties("Param.2", myEditModel1.second);
            oAjaxHandler.setProperties("Param.3", myEditModel1.third);
            oAjaxHandler.setProperties("Param.4", myEditModel1.fourth);
            oAjaxHandler.setProperties("Param.5", myEditModel1.fifth);
            this.getView().setModel(new JSONModel({
                first: "",
                second: "",
                third: "",
                fourth: ""
            }), "myEdit");
            oAjaxHandler.setCallBackSuccessMethod(this.successOnUpdate, this);
            oAjaxHandler.setCallBackFailureMethod(this.failRequestOnUpdate, this);
            oAjaxHandler.triggerPostRequest();
        },

        /** @Function callback function for ajax success
         */
        successOnUpdate: function(rs) {            
    		if(rs.Rowsets.Rowset[0].Row[0].SUCCESS === 1){
                sap.m.MessageToast.show(rs.Rowsets.Rowset[0].Row[0].SUCC_ERROR_MESSAGE);
                this.onSearch();
    		}else{
    			var rsp = {};
    			rsp.statusText = this.getView().getModel("i18n").getResourceBundle().getText("unexpecErr");
    			this.failRequestOnUpdate(rsp);
    		}                                     
        },

        /** @Function callback function for ajax fail
         */
        failRequestOnUpdate: function(rs) {
            sap.m.MessageBox.alert(rs.statusText);
            this.stopBusyIndicator();
        },

        /** @Event itemPress event triggered after clicking on a table row
         *  @Model gets the required data and binds to the model
         *  @Visiblity makes input fields enable
         */
        vendorSelect: function(oEvent) {
            var that = this;
            this.oViewModel.getData().inc ++;
            var row = oEvent.getParameter("listItem").getBindingContext("tableModel");
            if (this.getView().getModel("myEdit") !== undefined) {
                this.previousEditData = this.getView().getModel("myEdit").getData();
                this.previousEditData.changedField = this.currentEditData;
                this.currentEditData = row.getProperty("MAT_QTY");
            }
            this.oViewModel.setProperty("/enable", true);
            this.getView().setModel(new JSONModel({
                first: "",
                second: "",
                third: "",
                fourth: "",
                fifth: ""
            }), "myEdit");
            var myEditModel = this.getView().getModel("myEdit").getData();
            myEditModel.first = row.getProperty("S_DATE");
            myEditModel.second = row.getProperty("GUID");
            myEditModel.third = row.getProperty("STATUS");
            myEditModel.fifth = row.getProperty("TAG_ID");

            var oItem = oEvent.getParameter("listItem");
            var oTable = this.getView().byId("fluTrnsQualityEntryTable");
            var oIndex = oTable.indexOfItem(oItem);
            var oModel = this.getView().getModel("viewModel");
            var oFlag = oModel.getProperty("/oIndex");
            if (oFlag === undefined) {
                oModel.setProperty("/oIndex", oIndex);
                this.lastData = oTable.getItems()[oIndex].getCells()[5].getValue();
                this.onPress(oItem, true);
            } else {
                if (oFlag === oIndex) {
                    var oPreviousItem = oTable.getItems()[oFlag];
                    this.onPress(oPreviousItem, false);
                    var oCurrentItem = oTable.getItems()[oIndex];
                    oModel.setProperty("/oIndex", oIndex);
                    this.onPress(oCurrentItem, true);
                } else {
                    if (this.oViewModel.getData().quantityChanged > 0) {
                        sap.m.MessageBox.show(
                            "Do you want to save the Data ?", {
                                icon: sap.m.MessageBox.Icon.INFORMATION,
                                title: "Information",
                                actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
                                onClose: function(oAction) {
                                    if (oAction === "OK") {
                                        that.onUpdate("", oFlag);
                                    }
                                    if (oAction === "CANCEL") {
                                        var oViewModel = that.oViewModel.getData();
                                        oViewModel.quantityChanged = 0;
                                        that.oViewModel.setData(oViewModel);
                                        if (that.oViewModel.getData().inc === 2) {
                                            oTable.getItems()[oFlag].getCells()[5].setValue(that.lastData);
                                        } else {
                                            oTable.getItems()[oFlag].getCells()[5].setValue(that.previousEditData.changedField);
                                        }
                                        var oPreviousItem = oTable.getItems()[oFlag];
                                        that.onPress(oPreviousItem, false);
                                        var oCurrentItem = oTable.getItems()[oIndex];
                                        oModel.setProperty("/oIndex", oIndex);
                                        that.onPress(oCurrentItem, true);
                                    }
                                }
                            }
                        );
                    } else {
                        this.onPress(oTable.getItems()[oFlag], false);
                        oModel.setProperty("/oIndex", oIndex);
                        this.onPress(oTable.getItems()[oIndex], true);
                    }
                }
            }

        },

        /** @Method to make input field editable on row click
         */
        onPress: function(oItem, oFlag) {
            var oEditableCells = oItem.getCells();
            $(oEditableCells).each(function(i) {
                var oEditableCell = oEditableCells[i];
                var oMetaData = oEditableCell.getMetadata();
                var oElement = oMetaData.getElementName();
                if (oElement == "sap.ui.commons.TextField") {
                    oEditableCell.setEditable(oFlag);
                }
            });
        },

        /** @Function to instantiation of view setting dialog
         */
        viewSettingInit: function() {
            this.mGroupFunctions = {
                S_DATE: function(oContext) {
                    var name = oContext.getProperty("S_DATE");
                    return {
                        key: name,
                        text: name
                    };
                },
                SHIFT: function(oContext) {
                    var name = oContext.getProperty("SHIFT");
                    return {
                        key: name,
                        text: name
                    };
                },
                TO_MAT_DESC: function(oContext) {
                    var name = oContext.getProperty("TO_MAT_DESC");
                    return {
                        key: name,
                        text: name
                    };
                },
                FRM_PLANT_DESC: function(oContext) {
                    var name = oContext.getProperty("FRM_PLANT_DESC");
                    return {
                        key: name,
                        text: name
                    };
                },
                TO_PLANT_DESC: function(oContext) {
                    var name = oContext.getProperty("TO_PLANT_DESC");
                    return {
                        key: name,
                        text: name
                    };
                },
                ZN_GPL_PARAM: function(oContext) {
                    var name = oContext.getProperty("MAT_QTY");
                    return {
                        key: name,
                        text: name
                    };
                }
            };
        },

        /** @Function initialSettings to get user data
         */
        initialSettings: function() {
            var oAjaxHandler = ajaxHandler.getInstance();
            oAjaxHandler.setProperties("QueryTemplate", "SAP_ZN_REC/COMMON/QRY/XQRY_GetLoggedInUserDetails");
            oAjaxHandler.setProperties("Param.1", "10.101.23.146:50000/");
            oAjaxHandler.setCallBackSuccessMethod(this.successIniSttg, this);
            oAjaxHandler.setCallBackFailureMethod(this.failRequestIniSttg, this);
            oAjaxHandler.triggerPostRequest();
        },

        /** @Function callback function for ajax success
         */
        successIniSttg: function(rs) {
            var viewModel = this.oViewModel.getData();
            viewModel.userDetails = rs;
            this.oViewModel.setData(viewModel);
            this.visiblitySettings();
        },

        /** @Function callback function for ajax fail
         */
        failRequestIniSttg: function(rs) {
            sap.m.MessageBox.alert(rs.statusText);
        },

        /** @Function visiblity setting based on roles
         */
        visiblitySettings: function() {
            var viewModel = this.oViewModel.getData();
            var myRole = viewModel.userDetails.Rowsets.Rowset[2].Row[0].ROLE;
            switch (myRole) {
	            case "ZNREC_LAB_ANALYST":
	            		this.getView().byId("fluTrnsQualityEntryTable").destroyColumns();
		                break;
	            case "ZNREC_LAB_SUP":
	            		this.getView().byId("fluTrnsQualityEntryTable").destroyColumns();
		                break;
	            case "ZNREC_READONLY":
	            		break;
	            case "ZNREC_REPORT_ANALYST":
		            	viewModel.visiblity.updateCancel = true;
		                viewModel.visiblity.updateSave = true; 	            	
		            	viewModel.visiblity.tableFieldEnabled = true;
	                	break;
	            default:
		            	this.getView().byId("fluTrnsQualityEntryTable").destroyColumns();         
            }                                    
            this.oViewModel.setData(viewModel);
        },        
        
        /** @Function for input field validation
         */
        onFieldChange: function(oEvent) {
            this.oViewModel.getData().quantityChanged++;
            var result = isNaN(parseFloat(oEvent.getParameter("liveValue")));
            if(oEvent.getParameter("liveValue").slice(-1) !== "."){
            	if(oEvent.getParameter("liveValue").slice(-1) === "0"){
            		
            	}else{
		            if(result === false){
		            	oEvent.getSource().setValue(parseFloat(oEvent.getParameter("liveValue")));
		            }else{
		            	oEvent.getSource().setValue("0");
		            }
            	}
            }
        }

    });

});