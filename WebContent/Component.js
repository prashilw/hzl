jQuery.sap.require("com.hzl.Util.MyRouter");
jQuery.sap.declare("com.hzl.Component");

sap.ui.core.UIComponent.extend("com.hzl.Component", {
    metadata: {
        name: "Hindustan Zinc Limited",
        version: "1.0",
        includes: [],
        dependencies: {
            libs: ["sap.m", "sap.ui.layout"],
            components: []
        },
        rootView: "com.hzl.App",
        config: {
            resourceBundle: "i18n/messageBundle.properties"
        },
        routing: {
            config: {
                routerClass: com.hzl.Util.MyRouter,
                viewType: "XML",
                viewPath: "com.hzl.view",
                targetControl: "idAppControl",
                targetAggregation: "pages",
                clearTarget: false,
                transition: "slide",
                bypassed: {
                    "target": "notFound"
                }
            },
            routes: [{
                    pattern: "",
                    name: "home",
                    view: "Dashboard.dashboard",
                    viewLevel: 1
                },
                {
                    pattern: "FTQAE",
                    name: "FTQAE",
                    view: "FluTrnQulAnlyEntry.fluTrnQulAnlyEntry",
                    viewLevel: 2
                },
                {
                    pattern: "FTR",
                    name: "FTR",
                    view: "Leaching.leaching",
                    viewLevel: 2
                },
                {
                    pattern: "shiftDetails/{shiftData}",
                    name: "shiftDetails",
                    view: "Leaching.shiftDetails",
                    viewLevel: 3
                },
                {
                    pattern: "fluTrnsQulEntry",
                    name: "fluTrnsQulEntry",
                    view: "FluTrnsQulEntry.fluTrnsQulEntry",
                    viewLevel: 2
                },
                {
                    pattern: "SolSluQualScrn",
                    name: "solSlurrQualScrn",
                    view: "SolSlurrQualScrn.solSlurrQualScrn",
                    viewLevel: 2
                },
                {
                    pattern: "solSlurrReport",
                    name: "solSlurrReport",
                    view: "SolSlurrReport.solSlurrReport",
                    viewLevel: 2
                },
                {
                    pattern: "errLogs",
                    name: "errLogs",
                    view: "Logs.errLogs"
                },
	    {
                    pattern: "SolSluQualScrnv2",
                    name: "solSlurrQualScrnv2",
                    view: "SolSlurrQualScrnv2.solSlurrQualScrnv2",
                    viewLevel: 2
                },
                {
                    pattern: "solSlurrReportv2",
                    name: "solSlurrReportv2",
                    view: "SolSlurrReportv2.solSlurrReport",
                    viewLevel: 2
                },
                {
                    pattern: ":all*:",
                    name: "notFound",
                    view: "Global.notFound"
                }
            ]
        }
    },
    init: function() {
        jQuery.sap.require("sap.ui.core.routing.History");
        jQuery.sap.require("sap.m.InstanceManager");
        jQuery.sap.require("sap.m.routing.RouteMatchedHandler");
        sap.ui.core.UIComponent.prototype.init.apply(this, arguments);
        var sRootPath = jQuery.sap.getModulePath("com.hzl");
        var mConfig = this.getMetadata().getConfig();
        var i18nModel = new sap.ui.model.resource.ResourceModel({
            bundleUrl: [sRootPath, mConfig.resourceBundle].join("/")
        });
        this.setModel(i18nModel, "i18n");
        this.getRouter().initialize();
    }

});