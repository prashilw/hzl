sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function(Controller) {
    "use strict";

    var baseController = Controller.extend("com.hzl.Controller.baseController", {
        /** 
         * @Functionality use to get the routing histry and navigate as per the routing pattern
         */
        myNavBack: function() {
            var oHistory = sap.ui.core.routing.History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();
            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                //sap.ui.core.UIComponent.getRouterFor(this).navTo("home");
            }
        },

        /** 
         * @Function creates the global busy indicator dialog
         * @Return Global busy Dialog
         */
        startBusyIndicator: function() {
            if (!this._GlobalDialog) {
                this._GlobalDialog = sap.ui.xmlfragment("com.hzl.view.Global.BusyDialog", this);
            }
            return this._GlobalDialog.open();
        },

        /** 
         * @Function stops the global busy indicator dialog
         * @Return Global busy Dialog
         */
        stopBusyIndicator: function() {
            return this._GlobalDialog.close();
        },

        /** 
         * @Function change the date to required date format
         * @Return required date format suitable for date time picker
         */
        changeDateFormat: function(date) {
            return ("00" + (date.getMonth() + 1)).slice(-2) + "-" +
                ("00" + date.getDate()).slice(-2) + "-" + date.getFullYear() + " " +
                ("00" + date.getHours()).slice(-2) + ":" +
                ("00" + date.getMinutes()).slice(-2) + ":" +
                ("00" + date.getSeconds()).slice(-2);
        },
        /** 
         * @Function Get the text from resource file using text id
         * @Return required string of text
         */        
        getText: function(sTextId){
        	return this.getView().getModel("i18n").getResourceBundle().getText(sTextId);
        }
    });

    return baseController;

});