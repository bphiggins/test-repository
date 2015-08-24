var frameListScroll;
var frameSideScroll;
var isNewTrip = false;
var isFullyLoaded = false;
var disconnectedError = false;
var menuLeftScroll;
var menuRightScroll;
var modalScroll;
var modalFocus;
var progressBar = {
	currentStep : 0,
	loadingSteps: 14,
	loadingModel: ""
};
var initialLoadData = {
	restartSync : true,
	sourceName : "",
	errorCode : "",
	loginErrorMessage : ""
};

var modal = (function(){
	var method = {};
	var $modalOverlay = $('<div id="modalOverlay"></div>');
	var $modal = $('<div id="modal"></div>');
	var $modalContent = $('<div id="modalContent"></div>');
	var $modalSave = $('<div id="modalSave">save</div>');
	var $modalClose = $('<div id="modalClose">close</div>');

	method.open = function (settings, saveCallback) {
		Rho.WebView.fullScreen = true;
		hideMenu();

		settings.enableScroll = settings.enableScroll === undefined ? false : settings.enableScroll;
		settings.hideSave = settings.hideSave === undefined ? (saveCallback !== undefined ? false : true) : settings.hideSave;
		settings.hideClose = settings.hideClose === undefined ? false : settings.hideClose;
		settings.fullScreen = settings.fullScreen === undefined ? false : settings.fullScreen;
		settings.content = settings.content === undefined ? "" : settings.content;
		
		saveCallback = saveCallback === undefined ? $.noop : saveCallback;
		var enforceMaxLength = false;
		if ($(settings.content).find("input[type!='hidden']").length > 0) {
			enforceMaxLength = true;
		}

		$modalContent.empty().append(settings.content);
		
		$("#modal input").on("focus", function() {
			modalFocus = $(this);
		});
		
		if (settings.enableScroll) {
			if ($("#modalWrapper").length > 0) {
				
				var containerElement = document.getElementById('modalWrapper');
				modalScroll = new FTScroller(containerElement, {
				    scrollbars: true,
				    scrollingX: true
				});
				setTimeout(function(){
					modalScroll.updateDimensions();
					if (modalFocus !== undefined){
						modalScroll.scrollTo(modalFocus.offsetLeft, modalFocus.offsetTop, 500);
					}
				}, 0);
				
			}
		}
		
		if (settings.hideSave) {
			method.save = $.noop;
			$modalSave.hide();
		}
		else {
			method.save = saveCallback;
			$modalSave.show();
		}
		if (settings.hideClose) {
			$modalClose.hide();
		}
		else {
			$modalClose.show();
		}
		if (settings.fullScreen) {
			$modal.css({height: "375px"});
			$("#modalTitleSection").css({height: "6.5%"});
			$("#modalContentSection").css({height: "93.5%"});
		}
		else {
			$modal.css({height: ""});
			$("#modalTitleSection").css({height: ""});
		}
		if (enforceMaxLength) {
			replaceMaxLength();
		}
		$modal.show();
		$modalOverlay.show();
	};

	method.close = function (enableScan) {
		enableScan = enableScan === undefined ? true : enableScan;
    	Rho.Log.info("Start: method.close(" + enableScan + ")", "inMotion");
		if (modalScroll !== undefined) {
			modalScroll.destroy();
		}
	    $modal.hide();
	    $modalOverlay.hide();
	    $modalContent.empty();
	    $("#modal input").off("focus");
	    if (enableScan) {
	    	Rho.Log.info("Run: method.close(true)", "inMotion");
	    	enableScanner();
	    }
		Rho.WebView.fullScreen = false;
    	Rho.Log.info("End: method.close()", "inMotion");
	};
    
    method.preSave = function () {
		var returnVar = method.save();
		returnVar = returnVar === undefined ? true : returnVar;
		if (returnVar) {
			method.close(false);
    	}
    };
    
    method.save = $.noop;
    
	method.init = function () {
		$modal.hide();
		$modalOverlay.hide();
		$modal.append($modalContent, $modalSave, $modalClose);
		$modalClose.off("click");
		$modalClose.on("click", function(e){
			e.preventDefault();
			method.close();
		});
		$modalSave.off("click");
		$modalSave.on("click", function(e){
			e.preventDefault();
			method.preSave();
		});
		$('#content').after($modalOverlay, $modal);
	};
    
    return method;
}());

// Database Models
var accountContactModel;
var accountModel;
var damagedItemDetailModel;
var damagedItemModel;
var employeeModel;
var findEquipmentModel;
var patientModel;
var preferredAccessoryModel;
var searchEquipmentModel;
var signatureDetailModel;
var signatureHeaderModel;
var signatureImageModel;
var signatureSendModel;
var surplusRetrievedAccessoriesModel;
var syncErrorModel;
var transferCommentModel;
var transferDetailModel;
var transferEquipmentOrderModel;
var transferHeaderModel;
var transferredPrefixAccessoriesModel;
var transferredUnitAccessoriesModel;
var transferSwapoutModel;
var tripDetailModel;
var tripDetailTemporaryModel;
var tripModel;
var userDatabase;

Handlebars.registerHelper('dateFormat', function(tsString) {
	if (tsString == "0001-01-01 00:00:00.0") {
		return "";
	}
	else {
		return tsString.substring(0, 10);
	}
});

Handlebars.registerHelper('dateTimeFormat', function(tsString) {
	if (tsString == "0001-01-01 00:00:00.0") {
		return "";
	}
	else {
		return tsString.substring(0, 19);
	}
});

Handlebars.registerHelper('display_validation_modal', function(jsonObj) {
	var result = "";
	if (jsonObj.syncErrors.errorList.length > 0) {
		result += "<div class='error'>inCommand Errors -- must be resolved to continue</div><ul class='messageList'>";
		if (parseInt(jsonObj.trip.unsyncedRecordCount) > jsonObj.syncErrors.errorList.length) {
			result += "<li>There are currently " + parseInt(jsonObj.trip.unsyncedRecordCount) + " unsync-ed records.</li>";
		}
		$.each(jsonObj.syncErrors.errorList, function () {
			result += "<li>" + this.errorMessage +"</li>";
		});
		result += "</ul>";
	}
	if (jsonObj.syncErrors.warningList.length > 0) {
		result += "<div class='warning'>inMotion Warnings</div><ul class='messageList'>";
		$.each(jsonObj.syncErrors.warningList, function () {
			result += "<li>" + this.errorMessage +"</li>";
		});
		result += "</ul>";
	}
	if (jsonObj.checkMethod == "checkout") {
		if (jsonObj.checkout.errorList.length > 0) {
			result += "<div class='error'>Checkout Errors -- must be resolved to checkout</div><ul class='messageList'>";
			$.each(jsonObj.checkout.errorList, function () {
				result += "<li>" + this.errorMessage +"</li>";
			});
			result += "</ul>";
		}
		if (jsonObj.checkout.warningList.length > 0) {
			result += "<div class='warning'>Checkout Warnings</div><ul class='messageList'>";
			$.each(jsonObj.checkout.warningList, function () {
				result += "<li>" + this.errorMessage +"</li>";
			});
			result += "</ul>";
		}
	}
	else if (jsonObj.checkMethod == "captureSignature") {
		if (jsonObj.captureSignature.errorList.length > 0) {
			result += "<div class='error'>Capture Signature Errors -- must be resolved to capture signature</div><ul class='messageList'>";
			$.each(jsonObj.captureSignature.errorList, function () {
				result += "<li>" + this.errorMessage +"</li>";
			});
			result += "</ul>";
		}
		if (jsonObj.captureSignature.warningList.length > 0) {
			result += "<div class='warning'>Capture Signature Warnings</div><ul class='messageList'>";
			$.each(jsonObj.captureSignature.warningList, function () {
				result += "<li>" + this.errorMessage +"</li>";
			});
			result += "</ul>";
		}
	}
	else {
		var merged;
		if (jsonObj.trip.errorList.length > 0 || jsonObj.checkout.errorList.length > 0 || jsonObj.captureSignature.errorList.length > 0 || jsonObj.closeTrip.errorList.length > 0) {
			result += "<div class='error'>General Errors -- must be resolved before end of trip</div><ul class='messageList'>";
			merged = $.merge([], jsonObj.trip.errorList);
			$.merge(merged, jsonObj.checkout.errorList);
			$.merge(merged, jsonObj.captureSignature.errorList);
			$.merge(merged, jsonObj.closeTrip.errorList);
			merged = uniqueArray(merged);
			$.each(merged, function () {
				result += "<li>" + this.errorMessage +"</li>";
			});
			result += "</ul>";
		}
		if (jsonObj.trip.warningList.length > 0 || jsonObj.checkout.warningList.length > 0 || jsonObj.captureSignature.warningList.length > 0 || jsonObj.closeTrip.warningList.length > 0) {
			result += "<div class='warning'>General Warnings</div><ul class='messageList'>";
			merged = $.merge([], jsonObj.trip.warningList);
			$.merge(merged, jsonObj.checkout.warningList);
			$.merge(merged, jsonObj.captureSignature.warningList);
			$.merge(merged, jsonObj.closeTrip.warningList);
			merged = uniqueArray(merged);
			$.each(merged, function () {
				result += "<li>" + this.errorMessage +"</li>";
			});
			result += "</ul>";
		}
	}
	return new Handlebars.SafeString(result);
});

function uniqueArray(orginalArray) {
	var unqArray = [];
	$.each(orginalArray, function(i, ele){
		if($.inArray(ele, unqArray) === -1) {
			unqArray.push(ele);
		}
	});
	return unqArray;
}

function silentLoadApplication(reload) {
	reload = reload ? reload : false;
	Rho.Log.info("Start: silentLoadApplication", "inMotion");

	var loginAttempts = getSilentLoginAttempts();
	if (loginAttempts < 6) {
		setSilentLoginAttempts();
		if ($("#loadingResource").length > 0 ) {
			resetProgress("Resetting user...");
			loadApplication(reload);
		}
		else {
			setModelNotifications();
		}
	}
	else {
		stopRhoSync();
		$.get("/public/templates/login.html", function(data){
			$("#content").replaceWith(data);
			$("#loginError").html("Unable to retrieve all data, poor connection is the likely cause.");
			$("#loginButtonConnect").removeAttr('disabled');
			modal.close(false);
			deleteLogin();
			loadLogin();
		});
	}
	Rho.Log.info("End: silentLoadApplication", "inMotion");
}

function loadApplication(reload) {
	reload = reload ? reload : false;
	Rho.Log.info("Start: loadApplication(" + reload + ")", "inMotion");

	if (!reload) {
		if (menuLeftScroll === undefined) {
			var containerElement = document.getElementById("menuLeftWrapper");
			menuLeftScroll = new FTScroller(containerElement, {
			    scrollbars: true,
			    scrollingX: false
			});
			containerElement = document.getElementById("menuRightWrapper");
			menuRightScroll = new FTScroller(containerElement, {
			    scrollbars: true,
			    scrollingX: false
			});
/*			
			menuLeftScroll = new IScroll('#menuLeftWrapper');
			menuRightScroll = new IScroll('#menuRightWrapper');
*/			
		}
		updateProgress("Initialize employee");
	}
	
	try {
		userDatabase.close();
	}
	catch (e) {
		Rho.Log.info("Error: loadApplication(" + e.message + ")", "inMotion");
	}

	userDatabase = new Rho.Database(Rho.Application.databaseFilePath('user'), 'user');
	initializeModels();
	if (!reload) {
		try {
			//check for existing sync and databases (make sure no duplicate trips), if available & reasonable, then allow skipping set-up
			var sql = "SELECT s.last_updated as lastUpdated, ";
			sql += "(select max(tripId) from Trip) as maxTripId, ";
			sql += "(select min(tripId) from Trip) as tripId ";
			sql += "FROM sources s where name = 'FindEquipment'";
			var sqlArray = userDatabase.executeSql(sql);
			if (sqlArray.length > 0) {
				var tripId = sqlArray[0].tripId;
				var maxTripId = sqlArray[0].maxTripId;
				if (tripId != "" && maxTripId == tripId) {
					var lastUpdatedDt = new Date(sqlArray[0].lastUpdated * 1000);
					var nowDate = new Date();
					var minDifference = (nowDate - lastUpdatedDt)/60000;
					if (minDifference < 5) {
						// already inside of the usual sync interval
						initialLoadData = {};
						isFullyLoaded = true;
						setModelsSync();
						onSyncModelDataEnd();
						readTrip();
						updateProgress("Complete", 100);
						modal.close(false);
						return;
					}
				}
			}
		}
		catch (err) {
			Rho.Log.info("Error: loadApplication(" + err.message + ")", "inMotion");
		}
	}
	employeeModel.setSync_type("incremental");
	employeeModel.initModel();
	detectUHSRhoServer(loadInitialEmployeeSync, reloadApplicationNoConnection);
	Rho.Log.info("End: loadApplication", "inMotion");
}

function loadInitialEmployeeSync() {
	Rho.Log.info("Start: loadInitialEmployeeSync()", "inMotion");
	progressBar.loadingModel = "Employee";
	setModelNotifications(onInitialEmployeeSync);
	Rho.RhoConnectClient.doSync(false, "", false);
	Rho.Log.info("End: loadInitialEmployeeSync", "inMotion");
}

function onInitialEmployeeSync(params) {
	Rho.Log.info("Start: onInitialEmployeeSync(" + JSON.stringify(params) + ")", "inMotion");

	if (params.status == "error") {
		processOnLoadSyncErrors(params);
	}
	else if (params.status == "complete") {
		if (initialLoadData.loginErrorMessage != "") {
			executeOnLoadSyncErrors();
		}
		else {
			updateProgress("Initialize trip");

			var sql = "select shortName, employeeId, ldapEmployeeId from Employee";
			try {
				var employee = userDatabase.executeSql(sql);
				var rhoName = Rho.RhoConnectClient.userName.toUpperCase();

				if (employee.length === 0 || employee.length > 1) {
					resetUserScript();
				}
				else if (!(employee[0].shortName.toUpperCase() == rhoName || employee[0].employeeId.toString() == rhoName || employee[0].ldapEmployeeId == rhoName)) {
					resetUserScript();
				}
				else {
					employeeModel.setSync_type("none");
					employeeModel.initModel();

					tripModel.setSync_type("incremental");
					tripModel.initModel();
					
					resetRhoConnectTrip(loadInitialTripSyncAfterReset);
				}
			}
			catch(err) {
				resetUserScript();
			}
		}
	}
	Rho.Log.info("End: onInitialEmployeeSync", "inMotion");
}

function loadInitialTripSyncAfterReset() {
	Rho.Log.info("Start: loadInitialTripSyncAfterReset()", "inMotion");
	detectUHSRhoServer(loadInitialTripSync, reloadApplicationNoConnection);
	Rho.Log.info("End: loadInitialTripSyncAfterReset", "inMotion");
}

function loadInitialTripSync() {
	Rho.Log.info("Start: loadInitialTripSync()", "inMotion");
	setModelNotifications(onInitialTripSync);
	Rho.RhoConnectClient.doSync(false, "", false);
	Rho.Log.info("End: loadInitialTripSync", "inMotion");
}

function onInitialTripSync(params) {
	Rho.Log.info("Start: onInitialTripSync(" + JSON.stringify(params) + ")", "inMotion");

	if (params.status == "error"){
		processOnLoadSyncErrors(params);
	}
	else if (params.status == "complete") {
		if (initialLoadData.loginErrorMessage != "") {
			executeOnLoadSyncErrors();
		}
		else {
			var sql = "select employeeId, ";
			sql += "employeeName, ";
			sql += "localTripId, ";
			sql += "tripCheckoutDateDevice, ";
			sql += "tripCreateDateDevice, ";
			sql += "tripEndDateDevice, ";
			sql += "tripId, ";
			sql += "tripStartDateDevice, ";
			sql += "vehicleId, ";
			sql += "object ";
			sql += "from Trip ";

			try {
				var tripList = userDatabase.executeSql(sql);

				if (tripList.length === 0) {
					createInitialTrip();
				}
				else if (tripList.length > 1) {
					resetUserScript();
				}
				else {
					var tripId = tripList[0].tripId == 0 ? tripList[0].object : tripList[0].tripId;
					var msDiff = parseIsoDatetime(getCurrentTimestampString()) - parseIsoDatetime(tripList[0].tripCreateDateDevice);
					var hrDiff = msDiff/3600000;

					if (hrDiff > 24) {
						// > 24 hours old
						var msg = "Your trip appears to be greater than " + parseInt(hrDiff) + " hours old.  Two options exist:\n\n";
						msg += "1. Continue with this existing trip but risk updating completed transfers (choose Cancel).\n\n  OR\n\n";
						msg += "2. Close this old trip and start a new one but risk uncompleted transfers (choose OK).";

						if (confirm(msg)) {
							var tripInstance = tripModel.make({
								"employeeId": tripList[0].employeeId,
								"employeeName": tripList[0].employeeName,
								"localTripId": tripList[0].localTripId,
								"tripCheckoutDateDevice": tripList[0].tripCheckoutDateDevice,
								"tripCreateDateDevice": tripList[0].tripCreateDateDevice,
								"tripEndDateDevice": getCurrentTimestampString(),
								"tripId": tripList[0].object,
								"tripStartDateDevice": tripList[0].tripStartDateDevice,
								"vehicleId": tripList[0].vehicleId,
								"object": tripList[0].object
							});
							tripInstance.save();	//to save the tripEndDateDevice
							tripInstance.destroy();	//to remove from redis!!?!
							setModelsSync("none", "closetrip");
							setModelNotifications(onExecuteCloseOldTrip);
							Rho.RhoConnectClient.doSync(false, "", false);
						}
						else {
							onInitializeTrip(tripId);
						}
					}
					else {
						onInitializeTrip(tripId);
					}
				}
			}
			catch (err) {
				resetUserScript();
			}
		}
	}
	Rho.Log.info("End: onInitialTripSync", "inMotion");
}

function onExecuteCloseOldTrip(params){
	Rho.Log.info("Start: onExecuteCloseOldTrip(" + JSON.stringify(params) + ")", "inMotion");
	
	if (params.status == "error"){
		processOnLoadSyncErrors(params);
	}
	else if (params.status == "complete") {
		if (initialLoadData.loginErrorMessage != "") {
			executeOnLoadSyncErrors();
		}
		else {
			resetProgress("Closing old trip");
			try {
				applicationSendLog();
			}
			catch (e) {
				Rho.Log.info("Error: onExecuteCloseOldTrip(" + e.message + ")", "inMotion");
			}
			resetRhoConnectTrip(createInitialTrip);
		}
	}
	Rho.Log.info("End: onExecuteCloseOldTrip", "inMotion");
}

function createInitialTrip () {
	Rho.Log.info("Start: createInitialTrip()", "inMotion");
	isNewTrip = true;
	var sql = "select employeeId, ";
	sql += "employeeName, ";
	sql += "employeeInitials, ";
	sql += "shortName, ";
	sql += "email ";
	sql += "from Employee ";
	
	try {
		var employeeArray = userDatabase.executeSql(sql);
		if (employeeArray.length == 1){
			var currentEmployeeId = employeeArray[0].employeeId;
			var currentEmployeeName = employeeArray[0].employeeName;
		
			//create a new trip for currentEmployeeId
			var tripInstance;
			tripInstance = tripModel.create({
				"tripId": 0,
				"localTripId": 0,
				"employeeId": currentEmployeeId,
				"employeeName": currentEmployeeName,
				"tripCreateDateDevice": getCurrentTimestampString(),
				"tripCheckoutDateDevice": '0001-01-01 00:00:00.0',
				"tripStartDateDevice": '0001-01-01 00:00:00.0',
				"tripEndDateDevice": '0001-01-01 00:00:00.0',
				"vehicleId": ""
			});
			tripInstance.updateAttributes ({
				"localTripId": tripInstance.get("object")
			});
			detectUHSRhoServer(loadCreateInitialTrip, reloadApplicationNoConnection);
		}
		else {
			resetUserScript();
		}
	}
	catch (e) {
		Rho.Log.info("Error: createInitialTrip(" + e.message + ")", "inMotion");
		resetUserScript();
	}
	Rho.Log.info("End: createInitialTrip", "inMotion");
}

function loadCreateInitialTrip() {
	Rho.Log.info("Start: loadCreateInitialTrip()", "inMotion");
	setModelNotifications(onCreateInitialTrip);
	Rho.RhoConnectClient.doSync(false, "", true);
	Rho.Log.info("End: loadCreateInitialTrip", "inMotion");
}

function onCreateInitialTrip(params) {
	Rho.Log.info("Start: onCreateInitialTrip(" + JSON.stringify(params) + ")", "inMotion");

	if (params.status == "error") {
		processOnLoadSyncErrors(params);
	}
	else if (params.status == "complete") {
		if (initialLoadData.loginErrorMessage != "") {
			executeOnLoadSyncErrors();
		}
		else {
			updateProgress("Initialize new trip");
			onInitializeTrip();
		}
	}
	Rho.Log.info("End: onCreateInitialTrip", "inMotion");
}

function onInitializeTrip(tripId) {
	Rho.Log.info("Start: onInitializeTrip()", "inMotion");
	if (tripId) {
		Rho.Log.info("================= EXISTING TRIP ==================", "inMotion");
	}
	else {
		Rho.Log.info("==================== NEW TRIP ====================", "inMotion");
		var sql = "select employeeId, localTripId, tripId, tripEndDateDevice, object from Trip";
		try {
			var tripList = userDatabase.executeSql(sql);
			if (tripList.length == 1) {
				tripId = tripList[0].tripId == 0 ? tripList[0].object : tripList[0].tripId;
			}
			else {
				tripId = -1;
			}
		}
		catch (err) {
			tripId = -1;
		}
	}
	Rho.Log.info("User: " + Rho.RhoConnectClient.userName, "inMotion");
	Rho.Log.info("Trip: " + tripId, "inMotion");

	if (tripId < 0) {
		resetUserScript();
	}
	else {
		$("#loadingMessage").replaceWith("<div id=\"loadingMessage\">Loading inMotion Application</div>");
		loadSyncModelData();
	}
	Rho.Log.info("End: onInitializeTrip", "inMotion");
}

function loadSyncModelData(restart) {
	restart = restart ? restart : false;
	Rho.Log.info("Start: loadSyncModelData(" + restart + ")", "inMotion");
	if (restart) {
		updateProgress();
	}
	else {
		updateProgress("Loading application data");
	}

	detectUHSRhoServer(loadSyncModelDataWithConnection, reloadApplicationNoConnection);
	Rho.Log.info("End: loadSyncModelData", "inMotion");
}

function loadSyncModelDataWithConnection() {
	Rho.Log.info("Start: loadSyncModelDataWithConnection", "inMotion");
	removeAllSyncErrors();
	setModelsSync();
	accountModel.setSync_type("incremental");
	accountModel.initModel();
	preferredAccessoryModel.setSync_type("incremental");
	preferredAccessoryModel.initModel();
	
	setModelNotifications(onSyncModelData);
	Rho.RhoConnectClient.doSync(false, "", false);
	Rho.Log.info("End: loadSyncModelDataWithConnection", "inMotion");
}

function initializeModels() {
	Rho.Log.info("Start: initializeModels()", "inMotion");

	accountContactModel = new Rho.NewORMModel("AccountContact");
	accountContactModel.enable("sync");
	accountContactModel.setSync_type("none");
	accountContactModel.enable("full_update");
	accountContactModel.set("partition", "user");
	accountContactModel.setProperty("fixed_schema", "true");
	accountContactModel.setProperty("sync_priority", "150");
	accountContactModel.setModelProperty("accountContactId", "integer", "");
	accountContactModel.setModelProperty("localAccountContactId", "float", "");
	accountContactModel.setModelProperty("accountId", "integer", "");
	accountContactModel.setModelProperty("contactType", "string", "");
	accountContactModel.setModelProperty("contactValue", "string", "");
	accountContactModel.setModelProperty("contactLastUsedDate", "string", "");
	accountContactModel.setModelProperty("employeeId", "integer", "");
	accountContactModel.initModel();

	accountModel = new Rho.NewORMModel("Account");
	accountModel.enable("sync");
	accountModel.setSync_type("none");
	accountModel.set("partition", "user");
  	accountModel.setProperty("fixed_schema", "true");
  	accountModel.setProperty("sync_priority", "25");
  	accountModel.setModelProperty("accountId", "integer", "");
  	accountModel.setModelProperty("accountName", "string", "");
  	accountModel.setModelProperty("addressLine1", "string", "");
  	accountModel.setModelProperty("addressLine2", "string", "");
  	accountModel.setModelProperty("city", "string", "");
  	accountModel.setModelProperty("state", "string", "");
  	accountModel.setModelProperty("zip", "string", "");
  	accountModel.setModelProperty("standingPurchaseOrder", "string", "");
  	accountModel.setModelProperty("districtId", "integer", "");
  	accountModel.setModelProperty("hasUnitAccessoryTracking", "string", "");
  	accountModel.setModelProperty("employeeId", "integer", "");
	accountModel.initModel();

	damagedItemDetailModel = new Rho.NewORMModel("DamagedItemDetail");
	damagedItemDetailModel.enable("sync");
	damagedItemDetailModel.setSync_type("none");
	damagedItemDetailModel.enable("full_update");
	damagedItemDetailModel.set("partition", "user");
	damagedItemDetailModel.setProperty("fixed_schema", "true");
	damagedItemDetailModel.setProperty("sync_priority", "140");
	damagedItemDetailModel.setModelProperty("damagedItemDetailId", "integer", "");
	damagedItemDetailModel.setModelProperty("localDamagedItemDetailId", "float", "");
	damagedItemDetailModel.setModelProperty("damagedItemId", "integer", "");
	damagedItemDetailModel.setModelProperty("localDamagedItemId", "float", "");
	damagedItemDetailModel.setModelProperty("base64Image", "string", "");
	damagedItemDetailModel.setModelProperty("employeeId", "integer", "");
	damagedItemDetailModel.initModel();

	damagedItemModel = new Rho.NewORMModel("DamagedItem");
	damagedItemModel.enable("sync");
	damagedItemModel.setSync_type("none");
	damagedItemModel.enable("full_update");
	damagedItemModel.set("partition", "user");
	damagedItemModel.setProperty("fixed_schema", "true");
	damagedItemModel.setProperty("sync_priority", "130");
	damagedItemModel.setModelProperty("damagedItemId", "integer", "");
	damagedItemModel.setModelProperty("localDamagedItemId", "float", "");
	damagedItemModel.setModelProperty("prefix", "string", "");
	damagedItemModel.setModelProperty("unit", "integer", "");
	damagedItemModel.setModelProperty("transferNumber", "integer", "");
	damagedItemModel.setModelProperty("localTransferNumber", "float", "");
	damagedItemModel.setModelProperty("customerReportedFailure", "integer", "");
	damagedItemModel.setModelProperty("accessoryMissing", "integer", "");
	damagedItemModel.setModelProperty("visibleDamage", "integer", "");
	damagedItemModel.setModelProperty("otherDamage", "integer", "");
	damagedItemModel.setModelProperty("notes", "string", "");
	damagedItemModel.setModelProperty("damagedItemDate", "string", "");
	damagedItemModel.setModelProperty("tripId", "integer", "");
	damagedItemModel.setModelProperty("localTripId", "float", "");
	damagedItemModel.setModelProperty("employeeId", "integer", "");
	damagedItemModel.initModel();

	employeeModel = new Rho.NewORMModel("Employee");
	employeeModel.enable("sync");
	employeeModel.setSync_type("none");
	employeeModel.enable("full_update");
	employeeModel.set("partition", "user");
	employeeModel.setProperty("fixed_schema", "true");
	employeeModel.setProperty("sync_priority", "5");
	employeeModel.setModelProperty("employeeId", "integer", "");
	employeeModel.setModelProperty("ldapEmployeeId", "string", "");
	employeeModel.setModelProperty("employeeName", "string", "");
	employeeModel.setModelProperty("firstName", "string", "");
	employeeModel.setModelProperty("middleInitial", "string", "");
	employeeModel.setModelProperty("lastName", "string", "");
	employeeModel.setModelProperty("employeeInitials", "string", "");
	employeeModel.setModelProperty("telephoneNumber", "string", "");
	employeeModel.setModelProperty("email", "string", "");
	employeeModel.setModelProperty("shortName", "string", "");
	employeeModel.initModel();

	findEquipmentModel = new Rho.NewORMModel("FindEquipment");
	findEquipmentModel.enable("sync");
	findEquipmentModel.setSync_type("none");
	findEquipmentModel.enable("full_update");
	findEquipmentModel.set("partition", "user");
	findEquipmentModel.setProperty("fixed_schema", "true");
	findEquipmentModel.setModelProperty("accountId", "integer", "");
	findEquipmentModel.setModelProperty("prefix", "string", "");
	findEquipmentModel.setModelProperty("unit", "integer", "");
	findEquipmentModel.setModelProperty("description", "string", "");
	findEquipmentModel.setModelProperty("cstat", "string", "");
	findEquipmentModel.initModel();

	patientModel = new Rho.NewORMModel("Patient");
	patientModel.enable("sync");
	patientModel.setSync_type("none");
	patientModel.enable("full_update");
	patientModel.set("partition", "user");
	patientModel.setProperty("fixed_schema", "true");
	patientModel.setProperty("sync_priority", "9920");
	patientModel.setModelProperty("uhsPatientId", "integer", "");
	patientModel.setModelProperty("localUhsPatientId", "float", "");
	patientModel.setModelProperty("accountId", "integer", "");
	patientModel.setModelProperty("lastName", "string", "");
	patientModel.setModelProperty("middleInitial", "string", "");
	patientModel.setModelProperty("firstName", "string", "");
	patientModel.setModelProperty("hospitalPatientId", "string", "");
	patientModel.setModelProperty("roomNumber", "string", "");
	patientModel.setModelProperty("physiciansId", "string", "");
	patientModel.setModelProperty("additionalPatientId", "string", "");
	patientModel.setModelProperty("tradingPartnerId", "string", "");
	patientModel.setModelProperty("deliveryLocation", "string", "");
	patientModel.setModelProperty("employeeId", "integer", "");
	patientModel.initModel();

	preferredAccessoryModel = new Rho.NewORMModel("PreferredAccessory");
	preferredAccessoryModel.enable("sync");
	preferredAccessoryModel.setSync_type("none");
	preferredAccessoryModel.enable("full_update");
	preferredAccessoryModel.set("partition", "user");
	preferredAccessoryModel.setProperty("fixed_schema", "true");
	preferredAccessoryModel.setProperty("sync_priority", "105");
	preferredAccessoryModel.setModelProperty("preferredAccessoryId", "string", "");
	preferredAccessoryModel.setModelProperty("localPreferredAccessoryId", "string", "");
	preferredAccessoryModel.setModelProperty("accountId", "integer", "");
	preferredAccessoryModel.setModelProperty("department", "string", "");
	preferredAccessoryModel.setModelProperty("prefix", "string", "");
	preferredAccessoryModel.setModelProperty("prefixDescription", "string", "");
	preferredAccessoryModel.setModelProperty("stockNumber", "integer", "");
	preferredAccessoryModel.setModelProperty("vendorNumber", "integer", "");
	preferredAccessoryModel.setModelProperty("vendorPart", "string", "");
	preferredAccessoryModel.setModelProperty("itemDescription", "string", "");
	preferredAccessoryModel.setModelProperty("quantity", "integer", "");
	preferredAccessoryModel.setModelProperty("employeeId", "integer", "");
	preferredAccessoryModel.initModel();

	searchEquipmentModel = new Rho.NewORMModel("SearchEquipment");
	searchEquipmentModel.enable("sync");
	searchEquipmentModel.setSync_type("none");
	searchEquipmentModel.enable("full_update");
	searchEquipmentModel.enable("pass_through");
	searchEquipmentModel.set("partition", "user");
	searchEquipmentModel.setProperty("fixed_schema", "true");
	searchEquipmentModel.setModelProperty("prefix", "string", "");
	searchEquipmentModel.setModelProperty("unit", "integer", "");
	searchEquipmentModel.setModelProperty("description", "string", "");
	searchEquipmentModel.setModelProperty("serialNumber", "string", "");
	searchEquipmentModel.initModel();

	signatureDetailModel = new Rho.NewORMModel("SignatureDetail");
	signatureDetailModel.enable("sync");
	signatureDetailModel.setSync_type("none");
	signatureDetailModel.enable("full_update");
	signatureDetailModel.set("partition", "user");
	signatureDetailModel.setProperty("fixed_schema", "true");
	signatureDetailModel.setProperty("sync_priority", "190");
	signatureDetailModel.setModelProperty("signatureDetailId", "integer", "");
	signatureDetailModel.setModelProperty("localSignatureDetailId", "float", "");
	signatureDetailModel.setModelProperty("signatureId", "integer", "");
	signatureDetailModel.setModelProperty("localSignatureId", "float", "");
	signatureDetailModel.setModelProperty("referenceId", "integer", "");
	signatureDetailModel.setModelProperty("localReferenceId", "float", "");
	signatureDetailModel.setModelProperty("employeeId", "integer", "");
	signatureDetailModel.setModelProperty("documentationSent", "integer", "");
	signatureDetailModel.initModel();

	signatureHeaderModel = new Rho.NewORMModel("SignatureHeader");
	signatureHeaderModel.enable("sync");
	signatureHeaderModel.setSync_type("none");
	signatureHeaderModel.enable("full_update");
	signatureHeaderModel.set("partition", "user");
	signatureHeaderModel.setProperty("fixed_schema", "true");
	signatureHeaderModel.setProperty("sync_priority", "160");
	signatureHeaderModel.setModelProperty("signatureId", "integer", "");
	signatureHeaderModel.setModelProperty("localSignatureId", "float", "");
	signatureHeaderModel.setModelProperty("accountId", "integer", "");
	signatureHeaderModel.setModelProperty("customerName", "string", "");
	signatureHeaderModel.setModelProperty("employeeId", "integer", "");
	signatureHeaderModel.setModelProperty("signatureDateDevice", "string", "");
	signatureHeaderModel.setModelProperty("tripId", "integer", "");
	signatureHeaderModel.setModelProperty("localTripId", "float", "");
	signatureHeaderModel.initModel();

	signatureImageModel = new Rho.NewORMModel("SignatureImage");
	signatureImageModel.enable("sync");
	signatureImageModel.setSync_type("none");
	signatureImageModel.enable("full_update");
	signatureImageModel.set("partition", "user");
	signatureImageModel.setProperty("fixed_schema", "true");
	signatureImageModel.setProperty("sync_priority", "170");
	signatureImageModel.setModelProperty("signatureImageId", "integer", "");
	signatureImageModel.setModelProperty("localSignatureImageId", "float", "");
	signatureImageModel.setModelProperty("signatureId", "integer", "");
	signatureImageModel.setModelProperty("localSignatureId", "float", "");
	signatureImageModel.setModelProperty("base64Image", "string", "");
	signatureImageModel.setModelProperty("employeeId", "integer", "");
	signatureImageModel.initModel();

	signatureSendModel = new Rho.NewORMModel("SignatureSend");
	signatureSendModel.enable("sync");
	signatureSendModel.setSync_type("none");
	signatureSendModel.enable("full_update");
	signatureSendModel.set("partition", "user");
	signatureSendModel.setProperty("fixed_schema", "true");
	signatureSendModel.setProperty("sync_priority", "180");
	signatureSendModel.setModelProperty("signatureSendId", "integer", "");
	signatureSendModel.setModelProperty("localSignatureSendId", "float", "");
	signatureSendModel.setModelProperty("signatureId", "integer", "");
	signatureSendModel.setModelProperty("localSignatureId", "float", "");
	signatureSendModel.setModelProperty("accountContactId", "integer", "");
	signatureSendModel.setModelProperty("localAccountContactId", "float", "");
	signatureSendModel.setModelProperty("employeeId", "integer", "");
	signatureSendModel.initModel();

	surplusRetrievedAccessoriesModel = new Rho.NewORMModel("SurplusRetrievedAccessories");
	surplusRetrievedAccessoriesModel.enable("sync");
	surplusRetrievedAccessoriesModel.setSync_type("none");
	surplusRetrievedAccessoriesModel.enable("full_update");
	surplusRetrievedAccessoriesModel.set("partition", "user");
	surplusRetrievedAccessoriesModel.setProperty("fixed_schema", "true");
	surplusRetrievedAccessoriesModel.setProperty("sync_priority", "100");
	surplusRetrievedAccessoriesModel.setModelProperty("localSurplusId", "float", "");
	surplusRetrievedAccessoriesModel.setModelProperty("surplusId", "integer", "");
	surplusRetrievedAccessoriesModel.setModelProperty("customerDepartment", "integer", "");
	surplusRetrievedAccessoriesModel.setModelProperty("retrievalAccessoryTransferId", "integer", "");
	surplusRetrievedAccessoriesModel.setModelProperty("localRetrievalAccessoryTransferId", "float", "");
	surplusRetrievedAccessoriesModel.setModelProperty("deliveryAccessoryTransferId", "integer", "");
	surplusRetrievedAccessoriesModel.setModelProperty("localDeliveryAccessoryTransferId", "float", "");
	surplusRetrievedAccessoriesModel.setModelProperty("matchDate", "string", "");
	surplusRetrievedAccessoriesModel.setModelProperty("matchUserId", "string", "");
	surplusRetrievedAccessoriesModel.setModelProperty("employeeId", "integer", "");
	surplusRetrievedAccessoriesModel.initModel();

	syncErrorModel = new Rho.NewORMModel("SyncError");
	//syncErrorModel.enable("sync");
	syncErrorModel.enable("full_update");
	syncErrorModel.set("partition", "user");
	syncErrorModel.setProperty("fixed_schema", "true");
	syncErrorModel.setModelProperty("sourceId", "integer", "");
	syncErrorModel.setModelProperty("sourceName", "string", "");
	syncErrorModel.setModelProperty("errorCode", "integer", "");
	syncErrorModel.setModelProperty("errorMessage", "string", "");
	syncErrorModel.setModelProperty("recordId", "string", "");
	syncErrorModel.setModelProperty("errorType", "string", "");
	syncErrorModel.initModel();

	transferCommentModel = new Rho.NewORMModel("TransferComment");
	transferCommentModel.enable("sync");
	transferCommentModel.setSync_type("none");
	transferCommentModel.enable("full_update");
	transferCommentModel.set("partition", "user");
	transferCommentModel.setProperty("fixed_schema", "true");
	transferCommentModel.setProperty("sync_priority", "70");
	transferCommentModel.setModelProperty("transferNumber", "integer", "");
	transferCommentModel.setModelProperty("localTransferNumber", "float", "");
	transferCommentModel.setModelProperty("prefix", "string", "");
	transferCommentModel.setModelProperty("unit", "integer", "");
	transferCommentModel.setModelProperty("comment", "string", "");
	transferCommentModel.setModelProperty("commentDate", "string", "");
	transferCommentModel.setModelProperty("localTransferCommentId", "string", "");
	transferCommentModel.setModelProperty("transferCommentId", "string", "");
	transferCommentModel.setModelProperty("employeeId", "integer", "");
	transferCommentModel.initModel();

	transferDetailModel = new Rho.NewORMModel("TransferDetail");
	transferDetailModel.enable("sync");
	transferDetailModel.setSync_type("none");
	transferDetailModel.enable("full_update");
	transferDetailModel.set("partition", "user");
	transferDetailModel.setProperty("fixed_schema", "true");
	transferDetailModel.setProperty("sync_priority", "60");
	transferDetailModel.setModelProperty("transferNumber", "integer", "");
	transferDetailModel.setModelProperty("localTransferNumber", "float", "");
	transferDetailModel.setModelProperty("transferDetailId", "string", "");
	transferDetailModel.setModelProperty("localTransferDetailId", "string", "");
	transferDetailModel.setModelProperty("transferDate", "string", "");
	transferDetailModel.setModelProperty("employeeInitials", "string", "");
	transferDetailModel.setModelProperty("prefix", "string", "");
	transferDetailModel.setModelProperty("unit", "integer", "");
	transferDetailModel.setModelProperty("description", "string", "");
	transferDetailModel.setModelProperty("vendor", "string", "");
	transferDetailModel.setModelProperty("model", "string", "");
	transferDetailModel.setModelProperty("purchaseOrder", "string", "");
	transferDetailModel.setModelProperty("department", "string", "");
	transferDetailModel.setModelProperty("refusedFlag", "string", "");
	transferDetailModel.setModelProperty("reasonRefused", "string", "");
	transferDetailModel.setModelProperty("uhsPatientId", "integer", "");
	transferDetailModel.setModelProperty("localUhsPatientId", "float", "");
	transferDetailModel.setModelProperty("cstat", "string", "");
	transferDetailModel.setModelProperty("employeeId", "integer", "");
	transferDetailModel.setModelProperty("scanOnDate", "string", "");
	transferDetailModel.setModelProperty("scanOffDate", "string", "");
	transferDetailModel.initModel();

	transferEquipmentOrderModel = new Rho.NewORMModel("TransferEquipmentOrder");
	transferEquipmentOrderModel.enable("sync");
	transferEquipmentOrderModel.setSync_type("none");
	transferEquipmentOrderModel.enable("full_update");
	transferEquipmentOrderModel.set("partition", "user");
	transferEquipmentOrderModel.setProperty("fixed_schema", "true");
	transferEquipmentOrderModel.setProperty("sync_priority", "50");
	transferEquipmentOrderModel.setModelProperty("equipmentOrderId", "string", "");
	transferEquipmentOrderModel.setModelProperty("localEquipmentOrderId", "string", "");
	transferEquipmentOrderModel.setModelProperty("transferNumber", "integer", "");
	transferEquipmentOrderModel.setModelProperty("localTransferNumber", "float", "");
	transferEquipmentOrderModel.setModelProperty("prefix", "string", "");
	transferEquipmentOrderModel.setModelProperty("description", "string", "");
	transferEquipmentOrderModel.setModelProperty("model", "string", "");
	transferEquipmentOrderModel.setModelProperty("vendor", "string", "");
	transferEquipmentOrderModel.setModelProperty("department", "string", "");
	transferEquipmentOrderModel.setModelProperty("purchaseOrder", "string", "");
	transferEquipmentOrderModel.setModelProperty("quantityOrdered", "integer", "");
	transferEquipmentOrderModel.setModelProperty("employeeId", "integer", "");
	transferEquipmentOrderModel.initModel();

	transferHeaderModel = new Rho.NewORMModel("TransferHeader");
	transferHeaderModel.enable("sync");
	transferHeaderModel.setSync_type("none");
	transferHeaderModel.enable("full_update");
	transferHeaderModel.set("partition", "user");
	transferHeaderModel.setProperty("fixed_schema", "true");
	transferHeaderModel.setProperty("sync_priority", "30");
	transferHeaderModel.setModelProperty("accountId", "integer", "");
	transferHeaderModel.setModelProperty("comment", "string", "");
	transferHeaderModel.setModelProperty("cstat", "string", "");
	transferHeaderModel.setModelProperty("deliveredByEmployeeId", "integer", "");
	transferHeaderModel.setModelProperty("deliveryDate", "string", "");
	transferHeaderModel.setModelProperty("department", "string", "");
	transferHeaderModel.setModelProperty("localTransferNumber", "float", "");
	transferHeaderModel.setModelProperty("orderBy", "string", "");
	transferHeaderModel.setModelProperty("orderDate", "string", "");
	transferHeaderModel.setModelProperty("postedByEmployeeId", "integer", "");
	transferHeaderModel.setModelProperty("purchaseOrder", "string", "");
	transferHeaderModel.setModelProperty("transferDate", "string", "");
	transferHeaderModel.setModelProperty("status", "string", "");
	transferHeaderModel.setModelProperty("swapOutFlag", "string", "");
	transferHeaderModel.setModelProperty("swapOutNumber", "integer", "");
	transferHeaderModel.setModelProperty("localSwapOutNumber", "float", "");
	transferHeaderModel.setModelProperty("telephoneNumber", "integer", "");
	transferHeaderModel.setModelProperty("transferredByEmployeeId", "integer", "");
	transferHeaderModel.setModelProperty("transferNumber", "integer", "");
	transferHeaderModel.setModelProperty("transferType", "string", "");
	transferHeaderModel.setModelProperty("uhsPatientId", "integer", "");
	transferHeaderModel.setModelProperty("localUhsPatientId", "float", "");
	transferHeaderModel.setModelProperty("employeeId", "integer", "");
	transferHeaderModel.initModel();

	transferredPrefixAccessoriesModel = new Rho.NewORMModel("TransferredPrefixAccessories");
	transferredPrefixAccessoriesModel.enable("sync");
	transferredPrefixAccessoriesModel.setSync_type("none");
	transferredPrefixAccessoriesModel.enable("full_update");
	transferredPrefixAccessoriesModel.set("partition", "user");
	transferredPrefixAccessoriesModel.setProperty("fixed_schema", "true");
	transferredPrefixAccessoriesModel.setProperty("sync_priority", "80");
	transferredPrefixAccessoriesModel.setModelProperty("transferPrefixId", "string", "");
	transferredPrefixAccessoriesModel.setModelProperty("localTransferPrefixId", "string", "");
	transferredPrefixAccessoriesModel.setModelProperty("transferNumber", "integer", "");
	transferredPrefixAccessoriesModel.setModelProperty("localTransferNumber", "float", "");
	transferredPrefixAccessoriesModel.setModelProperty("prefix", "string", "");
	transferredPrefixAccessoriesModel.setModelProperty("accessory", "string", "");
	transferredPrefixAccessoriesModel.setModelProperty("quantity", "integer", "");
	transferredPrefixAccessoriesModel.setModelProperty("employeeId", "integer", "");
	transferredPrefixAccessoriesModel.initModel();

	transferredUnitAccessoriesModel = new Rho.NewORMModel("TransferredUnitAccessories");
	transferredUnitAccessoriesModel.enable("sync");
	transferredUnitAccessoriesModel.setSync_type("none");
	transferredUnitAccessoriesModel.enable("full_update");
	transferredUnitAccessoriesModel.set("partition", "user");
	transferredUnitAccessoriesModel.setProperty("fixed_schema", "true");
	transferredUnitAccessoriesModel.setProperty("sync_priority", "90");
	transferredUnitAccessoriesModel.setModelProperty("accessoryTransferId", "integer", "");
	transferredUnitAccessoriesModel.setModelProperty("localAccessoryTransferId", "float", "");
	transferredUnitAccessoriesModel.setModelProperty("localTransferNumber", "float", "");
	transferredUnitAccessoriesModel.setModelProperty("transferNumber", "integer", "");
	transferredUnitAccessoriesModel.setModelProperty("prefix", "string", "");
	transferredUnitAccessoriesModel.setModelProperty("unit", "integer", "");
	transferredUnitAccessoriesModel.setModelProperty("stockNumber", "integer", "");
	transferredUnitAccessoriesModel.setModelProperty("outOfStock", "string", "");
	transferredUnitAccessoriesModel.setModelProperty("substitutedStockNumber", "integer", "");
	transferredUnitAccessoriesModel.setModelProperty("transferType", "string", "");
	transferredUnitAccessoriesModel.setModelProperty("transferDate", "string", "");
	transferredUnitAccessoriesModel.setModelProperty("accessoryIsDamaged", "string", "");
	transferredUnitAccessoriesModel.setModelProperty("accessoryIsLost", "string", "");
	transferredUnitAccessoriesModel.setModelProperty("lostStatusDate", "string", "");
	transferredUnitAccessoriesModel.setModelProperty("lostReportUserId", "string", "");
	transferredUnitAccessoriesModel.setModelProperty("matchingAccessoryTransferId", "integer", "");
	transferredUnitAccessoriesModel.setModelProperty("localMatchingAccessoryTransferId", "float", "");
	transferredUnitAccessoriesModel.setModelProperty("employeeId", "integer", "");
	transferredUnitAccessoriesModel.initModel();

	transferSwapoutModel = new Rho.NewORMModel("TransferSwapout");
	transferSwapoutModel.enable("sync");
	transferSwapoutModel.setSync_type("none");
	transferSwapoutModel.enable("full_update");
	transferSwapoutModel.set("partition", "user");
	transferSwapoutModel.setProperty("fixed_schema", "true");
	transferSwapoutModel.setProperty("sync_priority", "110");
	transferSwapoutModel.setModelProperty("swapoutId", "string", "");
	transferSwapoutModel.setModelProperty("localSwapoutId", "string", "");
	transferSwapoutModel.setModelProperty("pickupTransferNumber", "integer", "");
	transferSwapoutModel.setModelProperty("localPickupTransferNumber", "integer", "");
	transferSwapoutModel.setModelProperty("pickupPrefix", "integer", "");
	transferSwapoutModel.setModelProperty("pickupUnit", "integer", "");
	transferSwapoutModel.setModelProperty("deliveryTransferNumber", "integer", "");
	transferSwapoutModel.setModelProperty("localDeliveryTransferNumber", "integer", "");
	transferSwapoutModel.setModelProperty("deliveryPrefix", "integer", "");
	transferSwapoutModel.setModelProperty("deliveryUnit", "integer", "");
	transferSwapoutModel.setModelProperty("entryMethod", "string", "");
	transferSwapoutModel.setModelProperty("enteredBy", "string", "");
	transferSwapoutModel.setModelProperty("enterDate", "string", "");
	transferSwapoutModel.setModelProperty("employeeId", "integer", "");
	transferSwapoutModel.initModel();

	tripDetailModel = new Rho.NewORMModel("TripDetail");
	tripDetailModel.enable("sync");
	tripDetailModel.setSync_type("none");
	tripDetailModel.enable("full_update");
	tripDetailModel.set("partition", "user");
	tripDetailModel.setProperty("fixed_schema", "true");
	tripDetailModel.setProperty("sync_priority", "40");
	tripDetailModel.setModelProperty("tripDetailId", "integer", "");
	tripDetailModel.setModelProperty("localTripDetailId", "float", "");
	tripDetailModel.setModelProperty("tripId", "integer", "");
	tripDetailModel.setModelProperty("localTripId", "float", "");
	tripDetailModel.setModelProperty("taskType", "string", "");
	tripDetailModel.setModelProperty("taskReferenceId", "integer", "");
	tripDetailModel.setModelProperty("localTaskReferenceId", "float", "");
	tripDetailModel.setModelProperty("accountId", "integer", "");
	tripDetailModel.setModelProperty("employeeId", "integer", "");
	tripDetailModel.setModelProperty("scanLevel", "integer", "");
	tripDetailModel.initModel();

	tripDetailTemporaryModel = new Rho.NewORMModel("TripDetailTemporary");
	//used as a temporary holding spot when adding accounts without any transferHeader records. taskType = 'X'
	tripDetailTemporaryModel.enable("full_update");
	tripDetailTemporaryModel.set("partition", "user");
	tripDetailTemporaryModel.setProperty("fixed_schema", "true");
	tripDetailTemporaryModel.setModelProperty("tripDetailId", "integer", "");
	tripDetailTemporaryModel.setModelProperty("localTripDetailId", "float", "");
	tripDetailTemporaryModel.setModelProperty("tripId", "integer", "");
	tripDetailTemporaryModel.setModelProperty("localTripId", "float", "");
	tripDetailTemporaryModel.setModelProperty("taskType", "string", "");
	tripDetailTemporaryModel.setModelProperty("taskReferenceId", "integer", "");
	tripDetailTemporaryModel.setModelProperty("localTaskReferenceId", "float", "");
	tripDetailTemporaryModel.setModelProperty("accountId", "integer", "");
	tripDetailTemporaryModel.setModelProperty("employeeId", "integer", "");
	tripDetailTemporaryModel.setModelProperty("scanLevel", "integer", "");
	tripDetailTemporaryModel.initModel();

	tripModel = new Rho.NewORMModel("Trip");
	tripModel.enable("sync");
	tripModel.setSync_type("none");
	tripModel.enable("full_update");
	tripModel.set("partition", "user");
	tripModel.setProperty("fixed_schema", "true");
	tripModel.setProperty("sync_priority", "9999");
	tripModel.setModelProperty("tripId", "integer", "");
	tripModel.setModelProperty("localTripId", "float", "");
	tripModel.setModelProperty("employeeId", "integer", "");
	tripModel.setModelProperty("employeeName", "string", "");
	tripModel.setModelProperty("tripCreateDateDevice", "string", "");
	tripModel.setModelProperty("tripCheckoutDateDevice", "string", "");
	tripModel.setModelProperty("tripStartDateDevice", "string", "");
	tripModel.setModelProperty("tripEndDateDevice", "string", "");
	tripModel.setModelProperty("vehicleId", "string", "");
	tripModel.initModel();
	Rho.Log.info("End: initializeModels", "inMotion");
}

function syncModelDataManual() {
	Rho.Log.info("Start: syncModelDataManual()", "inMotion");
	detectUHSRhoServer(loadSyncModelDataManual);
	Rho.Log.info("End: syncModelDataManual", "inMotion");
}

function loadSyncModelDataManual() {
	Rho.Log.info("Start: loadSyncModelDataManual", "inMotion");
	setModelNotifications();
	Rho.RhoConnectClient.doSync(false, "", false);
	Rho.Log.info("End: loadSyncModelDataManual", "inMotion");
}

function onSyncModelData(params) {
	Rho.Log.info("Start: onSyncModelData(" + JSON.stringify(params) + ")", "inMotion");

	if (params.status == "error"){
		processOnLoadSyncErrors(params);
	}
	else if (params.source_name == "TransferSwapout") {
		if (initialLoadData.loginErrorMessage == "") {
			readTrip();
			updateProgress("Complete", 100);
			modal.close(false);
		}
		else {
			Rho.Log.info("Running: onSyncModelData - else (" + initialLoadData.loginErrorMessage + ")", "inMotion");
		}
	}
	else if (params.status == "complete") {
		if (initialLoadData.loginErrorMessage != "") {
			executeOnLoadSyncErrors();
		}
		else {
			initialLoadData = {};
			isFullyLoaded = true;
			onSyncModelDataEnd();
		}
	}
	else if (progressBar.loadingModel != params.source_name) {
		progressBar.loadingModel = params.source_name;
		updateProgress();
	}
	Rho.Log.info("End: onSyncModelData (" + params.source_name + ")", "inMotion");
}

function onSyncModelDataEnd() {
	Rho.Log.info("Start: onSyncModelDataEnd()", "inMotion");
	
	if(accountModel.count() > 0) {
		accountModel.setSync_type("none");
		accountModel.initModel();
	}
	
	patientModel.setProperty("sync_priority", "20");
	patientModel.initModel();

	preferredAccessoryModel.setSync_type("none");
	preferredAccessoryModel.initModel();
	
	setModelNotifications();
	$("#syncMessage").text("");
	Rho.Log.info("End: onSyncModelDataEnd", "inMotion");
}

function setModelNotifications(byFunction) {
	Rho.Log.info("Start: setModelNotifications(" + (byFunction ? byFunction.name : "") + ")", "inMotion");

	waitForRhoSyncToComplete(120);
	
	Rho.RhoConnectClient.clearNotification("*");
	if (byFunction) {
		Rho.RhoConnectClient.setNotification("*", byFunction);
	}
	else {
		Rho.RhoConnectClient.setNotification("*", incrementalSyncNotify);
	}
	Rho.Log.info("End: setModelNotifications", "inMotion");
}

function setModelsSync(syncType, syncMethod) {
	Rho.Log.info("Start: setModelsSync(" + syncType + ", " + syncMethod + ")", "inMotion");
	syncType = syncType ? syncType.toLowerCase() : "incremental";
	syncMethod = syncMethod ? syncMethod.toLowerCase() : "all";
	
	if (syncMethod == "closetrip" || syncMethod == "checkout" || syncMethod == "changes") {
		//these methods will ignore the syncType sent in
		//and update to incremental as appropriate
		syncType = "none";
	}

	var modelSyncTypes = {
			"accountContactModel" : syncType,
			"damagedItemDetailModel" : syncType,
			"damagedItemModel" : syncType,
			"findEquipmentModel" : syncType,
			"patientModel" : syncType,
			"signatureDetailModel" : syncType,
			"signatureHeaderModel" : syncType,
			"signatureImageModel" : syncType,
			"signatureSendModel" : syncType,
			"surplusRetrievedAccessoriesModel" : syncType,
			"transferCommentModel" : syncType,
			"transferDetailModel" : syncType,
			"transferEquipmentOrderModel" : syncType,
			"transferHeaderModel" : syncType,
			"transferredPrefixAccessoriesModel" : syncType,
			"transferredUnitAccessoriesModel" : syncType,
			"transferSwapoutModel" : syncType,
			"tripDetailModel" : syncType,
			"tripModel" : syncType
	};
	
	if (syncMethod == "closetrip") {
		modelSyncTypes.tripModel = "incremental";
	}
	else if (syncMethod == "checkout" || syncMethod == "changes") {
		try {
			var sql = "select distinct (lower(substr(s.name,1,1)) || substr(s.name, -(length(s.name) - 1)) || 'Model') name from changed_values c ";
			sql += "left outer join sources s on s.source_id = c.source_id ";
			var sqlArray = userDatabase.executeSql(sql);
			
			if (syncMethod == "checkout") {
				//always run these models (is this even necessary -- back end changes?)
				modelSyncTypes.transferCommentModel = "incremental";
				modelSyncTypes.transferDetailModel = "incremental";
				modelSyncTypes.transferEquipmentOrderModel = "incremental";
				modelSyncTypes.transferHeaderModel = "incremental";
				modelSyncTypes.transferredPrefixAccessoriesModel = "incremental";
				modelSyncTypes.transferredUnitAccessoriesModel = "incremental";
				modelSyncTypes.transferSwapoutModel = "incremental";
				modelSyncTypes.tripDetailModel = "incremental";
				modelSyncTypes.tripModel = "incremental";
			}

			for (var i = 0; i < sqlArray.length; i++){
				modelSyncTypes[sqlArray[i].name] = "incremental";
			}
			
			if (syncMethod == "checkout") {
				//set these models back to "none" (syncType) for checkout only
				//regardless of changed_values
				//not necessary at checkout time
				modelSyncTypes.accountContactModel = syncType;
				modelSyncTypes.damagedItemDetailModel = syncType;
				modelSyncTypes.damagedItemModel = syncType;
				modelSyncTypes.findEquipmentModel = syncType;
				modelSyncTypes.signatureDetailModel = syncType;
				modelSyncTypes.signatureHeaderModel = syncType;
				modelSyncTypes.signatureImageModel = syncType;
				modelSyncTypes.signatureSendModel = syncType;
				modelSyncTypes.surplusRetrievedAccessoriesModel = syncType;
			}
		}
		catch (e) {
			Rho.Log.info("Error: setModelsSync(" + e.message + ")", "inMotion");
			modelSyncTypes = {
					"accountContactModel" : "incremental",
					"damagedItemDetailModel" : "incremental",
					"damagedItemModel" : "incremental",
					"findEquipmentModel" : "incremental",
					"patientModel" : "incremental",
					"signatureDetailModel" : "incremental",
					"signatureHeaderModel" : "incremental",
					"signatureImageModel" : "incremental",
					"signatureSendModel" : "incremental",
					"surplusRetrievedAccessoriesModel" : "incremental",
					"transferCommentModel" : "incremental",
					"transferDetailModel" : "incremental",
					"transferEquipmentOrderModel" : "incremental",
					"transferHeaderModel" : "incremental",
					"transferredPrefixAccessoriesModel" : "incremental",
					"transferredUnitAccessoriesModel" : "incremental",
					"transferSwapoutModel" : "incremental",
					"tripDetailModel" : "incremental",
					"tripModel" : "incremental"
			};
		}
	}
	
	waitForRhoSyncToComplete(120);

	if (accountContactModel.sync_type.toLowerCase() != modelSyncTypes.accountContactModel) {
		accountContactModel.setSync_type(modelSyncTypes.accountContactModel);
		accountContactModel.initModel();
	}
	if (damagedItemDetailModel.sync_type.toLowerCase() != modelSyncTypes.damagedItemDetailModel) {
		damagedItemDetailModel.setSync_type(modelSyncTypes.damagedItemDetailModel);
		damagedItemDetailModel.initModel();
	}
	if (damagedItemModel.sync_type.toLowerCase() != modelSyncTypes.damagedItemModel) {
		damagedItemModel.setSync_type(modelSyncTypes.damagedItemModel);
		damagedItemModel.initModel();
	}
	if (findEquipmentModel.sync_type.toLowerCase() != modelSyncTypes.findEquipmentModel) {
		findEquipmentModel.setSync_type(modelSyncTypes.findEquipmentModel);
		findEquipmentModel.initModel();
	}
	if (patientModel.sync_type.toLowerCase() != modelSyncTypes.patientModel) {
		patientModel.setSync_type(modelSyncTypes.patientModel);
		patientModel.initModel();
	}
	if (signatureDetailModel.sync_type.toLowerCase() != modelSyncTypes.signatureDetailModel) {
		signatureDetailModel.setSync_type(modelSyncTypes.signatureDetailModel);
		signatureDetailModel.initModel();
	}
	if (signatureHeaderModel.sync_type.toLowerCase() != modelSyncTypes.signatureHeaderModel) {
		signatureHeaderModel.setSync_type(modelSyncTypes.signatureHeaderModel);
		signatureHeaderModel.initModel();
	}
	if (signatureImageModel.sync_type.toLowerCase() != modelSyncTypes.signatureImageModel) {
		signatureImageModel.setSync_type(modelSyncTypes.signatureImageModel);
		signatureImageModel.initModel();
	}
	if (signatureSendModel.sync_type.toLowerCase() != modelSyncTypes.signatureSendModel) {
		signatureSendModel.setSync_type(modelSyncTypes.signatureSendModel);
		signatureSendModel.initModel();
	}
	if (surplusRetrievedAccessoriesModel.sync_type.toLowerCase() != modelSyncTypes.surplusRetrievedAccessoriesModel) {
		surplusRetrievedAccessoriesModel.setSync_type(modelSyncTypes.surplusRetrievedAccessoriesModel);
		surplusRetrievedAccessoriesModel.initModel();
	}
	if (transferCommentModel.sync_type.toLowerCase() != modelSyncTypes.transferCommentModel) {
		transferCommentModel.setSync_type(modelSyncTypes.transferCommentModel);
		transferCommentModel.initModel();
	}
	if (transferDetailModel.sync_type.toLowerCase() != modelSyncTypes.transferDetailModel) {
		transferDetailModel.setSync_type(modelSyncTypes.transferDetailModel);
		transferDetailModel.initModel();
	}
	if (transferEquipmentOrderModel.sync_type.toLowerCase() != modelSyncTypes.transferEquipmentOrderModel) {
		transferEquipmentOrderModel.setSync_type(modelSyncTypes.transferEquipmentOrderModel);
		transferEquipmentOrderModel.initModel();
	}
	if (transferHeaderModel.sync_type.toLowerCase() != modelSyncTypes.transferHeaderModel) {
		transferHeaderModel.setSync_type(modelSyncTypes.transferHeaderModel);
		transferHeaderModel.initModel();
	}
	if (transferredPrefixAccessoriesModel.sync_type.toLowerCase() != modelSyncTypes.transferredPrefixAccessoriesModel) {
		transferredPrefixAccessoriesModel.setSync_type(modelSyncTypes.transferredPrefixAccessoriesModel);
		transferredPrefixAccessoriesModel.initModel();
	}
	if (transferredUnitAccessoriesModel.sync_type.toLowerCase() != modelSyncTypes.transferredUnitAccessoriesModel) {
		transferredUnitAccessoriesModel.setSync_type(modelSyncTypes.transferredUnitAccessoriesModel);
		transferredUnitAccessoriesModel.initModel();
	}
	if (transferSwapoutModel.sync_type.toLowerCase() != modelSyncTypes.transferSwapoutModel) {
		transferSwapoutModel.setSync_type(modelSyncTypes.transferSwapoutModel);
		transferSwapoutModel.initModel();
	}
	if (tripDetailModel.sync_type.toLowerCase() != modelSyncTypes.tripDetailModel) {
		tripDetailModel.setSync_type(modelSyncTypes.tripDetailModel);
		tripDetailModel.initModel();
	}
	if (tripModel.sync_type.toLowerCase() != modelSyncTypes.tripModel) {
		tripModel.setSync_type(modelSyncTypes.tripModel);
		tripModel.initModel();
	}
	Rho.Log.info("End: setModelsSync", "inMotion");
}

function incrementalSyncNotify(params) {
	Rho.Log.info("Start: incrementalSyncNotify(" + JSON.stringify(params) + ")", "inMotion");
	$("#syncMessage").text("- Sync in progress");
	if (params.source_name) {
		if (params.source_name == "Patient") {
			//assumes patient if first model (lowest sync priority)
			removeAllSyncErrors();
		}
	}
	if (params.status == "complete") {
		if (disconnectedError) {
			processDisconnectedError();
		}
		var applicationMode = $("#tripContainer").attr("data-applicationMode");
		if (applicationMode == "capture signature"){
			//do nothing
		}
		else {
			readTrip();
			var localTransferNumber = $("#taskHeaderContainer").attr("data-localTransferNumber");
			var transferType = $("#taskHeaderContainer").attr("data-transferType");

			if ((transferType + "~" + localTransferNumber) != "undefined~undefined"){
				if (transferType != "Find"){
					readTask(transferType + "~" + localTransferNumber);
				}
			}
		}
	}
	else {
		if (params.status == "error") {
			processSyncErrors(params);
		}
		else if (params.source_name == "Account" && params.status == "ok") {
			if(accountModel.count() > 0) {
				accountModel.setSync_type("none");
				accountModel.initModel();
			}
		}
	}
	Rho.Log.info("End: incrementalSyncNotify", "inMotion");
}

function processOnLoadSyncErrors(params) {
	Rho.Log.info("Start: processOnLoadSyncErrors(" + JSON.stringify(params) + ")", "inMotion");

	var status = params.status;
	var errorCode = params.error_code;
	var errorMessage = params.error_message;
	var hasServerErrors = params.server_errors ? true : false;
	initialLoadData.errorCode = errorCode;
	initialLoadData.sourceName = params.source_name;
	
	if (status == "error") {
		if (errorCode == "1" && errorMessage == "") {
			//no connectivity, just stop for now
			initialLoadData.loginErrorMessage = "Unable to maintain connectivity to UHS";
		}
		else if (!hasServerErrors) {
			if (errorCode == "2"){
				if (errorMessage == "Unknown client"){
					initialLoadData.loginErrorMessage = "Data has been reset on server, please log back in.";
				}
				else if (errorMessage == "WARNING: Maximum # of devices exceeded for this license."){
					initialLoadData.loginErrorMessage = "Max # of devices exceeded -- please contact support.";
				}
			}
			else if (errorCode == "7") {
				// apparently error code 7 does not return {"status":"complete","sync_type":"incremental"}
				// and therefore will not call executeOnLoadSyncErrors() automatically
				// are there more error codes that have the same behavior ???
				initialLoadData.loginErrorMessage = "";
				stopRhoSync();
				executeOnLoadSyncErrors();
			}
			else if (errorCode == "9") {
				initialLoadData.loginErrorMessage = "System Error (server credentials expired), please log back in.";
			}
		}
		else {
			// this could have been an else if (params.server_errors) {
			if (params.server_errors["query-error"]) {
				if (params.server_errors["query-error"].message != "Request timeout.") {
					initialLoadData.loginErrorMessage = "Incomplete inCommand data (" + params.source_name + ") -- please contact support";
				}
			}
			if (params.server_errors["create-error"] && params.source_name == "Trip") {
				if (params.server_errors["create-error"].message == "Mulitple trips on record") {
					initialLoadData.loginErrorMessage = "Multiple active trips -- please contact support";
				}
			}
			if (initialLoadData.loginErrorMessage == "") {
				processServerErrors(params);
				initialLoadData.restartSync = false;
			}
		}
	}
	Rho.Log.info("End: processOnLoadSyncErrors", "inMotion");
}

function executeOnLoadSyncErrors() {
	Rho.Log.info("Start: executeOnLoadSyncErrors", "inMotion");
	stopRhoSync();
	if (initialLoadData.loginErrorMessage != "") {
		Rho.Log.info("Running: executeOnLoadSyncErrors: " + initialLoadData.loginErrorMessage, "inMotion");
		if (initialLoadData.loginErrorMessage == "Data has been reset on server, please log back in.") {
			alert("Unfortunately, do to the severity of the error, all un-synced data has been lost.  Please verify all transfers in inCommand when you return to the district.");
			try {
				Rho.NewORM.databaseFullResetAndLogout();
			}
			catch(e){
				Rho.Log.info("Error: executeOnLoadSyncErrors: " + e.message, "inMotion");
		 		if (Rho.RhoConnectClient.isLoggedIn()) {
		 			Rho.RhoConnectClient.logout();
		 		}
			}
		}
		try {
			applicationSendLog();
		}
		catch (e2) {
			Rho.Log.info("Error: executeOnLoadSyncErrors: " + e2.message, "inMotion");
		}
		$.get("/public/templates/login.html", function(data){
			$("#content").replaceWith(data);
			$("#loginError").html(initialLoadData.loginErrorMessage);
			$("#loginButtonConnect").removeAttr('disabled');
			modal.close(false);
			deleteLogin();
			loadLogin();
		});
	}
	else if (initialLoadData.errorCode == "7") {
		silentLogin();
	}
	else if (initialLoadData.restartSync) {
		resetProgress("Connection errors, re-loading data");
		if (initialLoadData.sourceName == "Employee" || initialLoadData.sourceName == "Trip") {
			// When Employee or Trip, still in specialized sync notifications
 			silentLoadApplication(true);
		}
		else {
			//generic onLoad sync notifies
			loadSyncModelData(true);
		}
	}
	Rho.Log.info("End: executeOnLoadSyncErrors", "inMotion");
}

function processSyncErrors(params){
	Rho.Log.info("Start: processSyncErrors(" + JSON.stringify(params) + ")", "inMotion");
	//TODO
	var status = params.status;
	var errorCode = params.error_code;
	var errorMessage = params.error_message;
	var syncErrorInstance;

	if (status == "error"){
		if (errorCode == "1" && errorMessage == "") {
			disconnectedError = true;
		}
		else if (params.server_errors){
			processServerErrors(params);
		}
		else {
			var loginErrorMessage;
			if (errorCode == "2"){
				if (errorMessage == "Unknown client"){
					loginErrorMessage = "Data has been reset on server, please log back in.";
				}
				else if (errorMessage == "WARNING: Maximum # of devices exceeded for this license."){
					loginErrorMessage = "Max # of devices exceeded -- please contact support.";
				}
				else {
					syncErrorInstance = syncErrorModel.create({
						"errorCode": errorCode,
						"errorMessage": "inMotion server error " + errorMessage + " (" + errorCode + ")",
						"errorType": "other",
						"recordId": "",
						"sourceId": params.source_id,
						"sourceName": params.source_name
					});
				}
			}
			else if (errorCode == "7"){
				loginErrorMessage = "System Error (user credentials expired), please log back in.";
			}
			else if (errorCode == "9"){
				loginErrorMessage = "System Error (server credentials expired), please log back in.";
			}
			else {
				syncErrorInstance = syncErrorModel.create({
					"errorCode": errorCode,
					"errorMessage": "inMotion server error " + errorMessage + " (" + errorCode + ")",
					"errorType": "other",
					"recordId": "",
					"sourceId": params.source_id,
					"sourceName": params.source_name
				});
			}
			if (loginErrorMessage !== undefined) {
				stopRhoSync();
				if (loginErrorMessage == "Data has been reset on server, please log back in.") {
					alert("Unfortunately, do to the severity of the error, all un-synced data has been lost.  Please verify all transfers in inCommand when you return to the district.");
					try {
						Rho.NewORM.databaseFullResetAndLogout();
					}
					catch(e){
						Rho.Log.info("Error: processSyncErrors: " + e, "inMotion");
				 		if (Rho.RhoConnectClient.isLoggedIn()) {
				 			Rho.RhoConnectClient.logout();
				 		}
					}
				}
				$.get("/public/templates/login.html", function(data){
					$("#content").replaceWith(data);
					$("#loginError").html(loginErrorMessage);
					$("#loginButtonConnect").removeAttr('disabled');
					deleteLogin();
					loadLogin();
					loginErrorMessage = null;
				});
			}
		}
	}
	Rho.Log.info("End: processSyncErrors", "inMotion");
}

function processDisconnectedError() {
	Rho.Log.info("Start: processDisconnectedError()", "inMotion");
	//only creates seem to be an issue.
	var sqlArray;
	var sqlExpression = [];
	var sql;
	
	waitForRhoSyncToComplete();
	
	//creates
	userDatabase.startTransaction();
	try {
		sqlExpression = [];
		sql = "select distinct object, source_id from changed_values ";
		sql += "where update_type = ?";
		sqlExpression[0] = "create";
		sqlArray = userDatabase.executeSql(sql, sqlExpression);

		for (var i = 0; i < sqlArray.length; i++){
			sql = "delete from changed_values ";
			sql += "where object = ? and source_id = ?";
			sqlExpression[0] = sqlArray[i].object;
			sqlExpression[1] = sqlArray[i].source_id;
			userDatabase.executeSql(sql, sqlExpression);

			sql = "insert into changed_values ";
			sql += "(update_type, attrib, source_id, object, sent) ";
			sql += "values (?, ?, ?, ?, ?)";
			sqlExpression = [];
			sqlExpression[0] = "create";
			sqlExpression[1] = "object";
			sqlExpression[2] = sqlArray[i].source_id;
			sqlExpression[3] = sqlArray[i].object;
			sqlExpression[4] = 0;
			userDatabase.executeSql(sql, sqlExpression);
		}
		userDatabase.commitTransaction();
	}
	catch(err) {
		userDatabase.rollbackTransaction();
	}
	
	//updates
	userDatabase.startTransaction();
	try {
		sqlExpression = [];
		sql = "select distinct source_id, attrib, object, value, attrib_type from changed_values ";
		sql += "where attrib <> ? and update_type = ? ";
		sqlExpression[0] = "object";
		sqlExpression[1] = "update";
		sqlArray = userDatabase.executeSql(sql, sqlExpression);

		sql = "select distinct source_id, object from changed_values ";
		sql += "where attrib <> ? and update_type = ? ";
		var deleteArray = userDatabase.executeSql(sql, sqlExpression);
		
		for (var j = 0; j < deleteArray.length; j++) {
			sql = "delete from changed_values ";
			sql += "where object = ? and source_id = ?";
			sqlExpression[0] = deleteArray[j].object;
			sqlExpression[1] = deleteArray[j].source_id;
			userDatabase.executeSql(sql, sqlExpression);
		}
		
		for (var k = 0; k < sqlArray.length; k++){
			sql = "insert into changed_values ";
			sql += "(source_id, attrib, object, value, attrib_type, update_type, sent) ";
			sql += "values (?, ?, ?, ?, ?, ?, ?)";
			sqlExpression = [];
			sqlExpression[0] = sqlArray[k].source_id;
			sqlExpression[1] = sqlArray[k].attrib;
			sqlExpression[2] = sqlArray[k].object;
			sqlExpression[3] = sqlArray[k].value;
			sqlExpression[4] = sqlArray[k].attrib_type;
			sqlExpression[5] = "update";
			sqlExpression[6] = 0;
			userDatabase.executeSql(sql, sqlExpression);
		}
		userDatabase.commitTransaction();
	}
	catch(err) {
		userDatabase.rollbackTransaction();
	}
	finally {
		disconnectedError = false;
	}
	Rho.Log.info("End: processDisconnectedError", "inMotion");
}

function processServerErrors(params) {
	//TODO if there are server_errors need to populate error table with source, record id, and reason for error
	//TODO Add alert to trip header to signify that validation needs to occur. Possibilities include change trip header color or add an error icon to trip header
	var syncErrorInstance;
	var errorCode = params.error_code;
	var hash;
	var sqlExpression = [];
	var sql;
	if (params.server_errors["login-error"]){
		var login_error = params.server_errors["login-error"];
		syncErrorInstance = syncErrorModel.create({
			"errorCode": errorCode,
			"errorMessage": login_error["message"],
			"errorType": "warning",
			"recordId": "",
			"sourceId": params.source_id,
			"sourceName": params.source_name
		});
	}
	if (params.server_errors["query-error"]){
		var query_error = params.server_errors["query-error"];
		syncErrorInstance = syncErrorModel.create({
			"errorCode": errorCode,
			"errorMessage": query_error["message"],
			"errorType": "warning",
			"recordId": "",
			"sourceId": params.source_id,
			"sourceName": params.source_name
		});
	}
	if (params.server_errors["create-error"]){
		// see rhom_object_factory.rb for on_sync_create_error, etc.
		var create_error = params.server_errors["create-error"];
		var delArray;
		var tableName;

		userDatabase.startTransaction();
		try {
			for (var property in create_error) {
				if (create_error.hasOwnProperty(property)) {
					sqlExpression = [];
					sql = "select object from changed_values ";
					sql += "where object = ? and update_type = ?";
					sqlExpression[0] = property;
					sqlExpression[1] = "delete";
					delArray = userDatabase.executeSql(sql, sqlExpression);
					
					sql = "delete from changed_values ";
					sql += "where object = ? and source_id = ?";
					sqlExpression[1] = params.source_id;
					userDatabase.executeSql(sql, sqlExpression);

					if (delArray.length > 0 ) {
						sqlExpression = [];
						sql = "select name from sources ";
						sql += "where source_id = ?";
						sqlExpression[0] = params.source_id;
						tableName = userDatabase.executeSql(sql, sqlExpression);
						
						sql = "delete from " + tableName[0] + " ";
						sql += "where source_id = ? and object = ?";
						sqlExpression[1] = property;
						userDatabase.executeSql(sql, sqlExpression);
					}
					else {
						sql = "insert into changed_values ";
						sql += "(update_type, attrib, source_id, object, sent) ";
						sql += "values (?, ?, ?, ?, ?)";
						sqlExpression = [];
						sqlExpression[0] = "create";
						sqlExpression[1] = "object";
						sqlExpression[2] = params.source_id;
						sqlExpression[3] = property;
						sqlExpression[4] = 0;
						userDatabase.executeSql(sql, sqlExpression);

						syncErrorInstance = syncErrorModel.create({
							"errorCode": errorCode,
							"errorMessage": create_error[property].message,
							"errorType": "create",
							"recordId": property,
							"sourceId": params.source_id,
							"sourceName": params.source_name
						});
					}
				}
			}
			userDatabase.commitTransaction();
		}
		catch(err) {
			userDatabase.rollbackTransaction();
		}
	}
	if (params.server_errors["update-error"]){
		var update_error = params.server_errors["update-error"];
		userDatabase.startTransaction();
		try {
			sqlExpression = [];
			sqlExpression[0] = 0;
			for (var property2 in update_error) {
				if (update_error.hasOwnProperty(property2)) {
					sql = "UPDATE changed_values ";
					sql += "set sent = ? ";
					sql += "where object = ?";
					sqlExpression[1] = property2;
					userDatabase.executeSql(sql, sqlExpression);

					syncErrorInstance = syncErrorModel.create({
						"errorCode": errorCode,
						"errorMessage": update_error[property2].message,
						"errorType": "update",
						"recordId": property2,
						"sourceId": params.source_id,
						"sourceName": params.source_name
					});
				}
			}
			userDatabase.commitTransaction();
		}
		catch(err) {
			userDatabase.rollbackTransaction();
		}
	}
	if (params.server_errors["delete-error"]){
		var delete_error = params.server_errors["delete-error"];

		for (var property3 in delete_error) {
			if (delete_error.hasOwnProperty(property3)) {
				userDatabase.startTransaction();
				try {
					//Reinsert into changed_values
					hash = delete_error[property3].attributes;
					Object.keys(hash).forEach(function (key) {
					    var value = hash[key];
					    // iteration code
					    var sqlExpression = [];
					    sqlExpression[0] = params.source_id;
					    sqlExpression[1] = key;
					    sqlExpression[2] = property3;
					    sqlExpression[3] = value;
					    sqlExpression[4] = "";
					    sqlExpression[5] = "delete";
					    sqlExpression[6] = 0;

					    var sql = "insert into changed_values(source_id, attrib, object, value, attrib_type, update_type, sent) ";
					    sql += "values (?, ?, ?, ?, ?, ?, ?) ";
					    userDatabase.executeSql(sql, sqlExpression);
					});

					//update syncError
					syncErrorInstance = syncErrorModel.create({
						"errorCode": errorCode,
						"errorMessage": delete_error[property3].message,
						"errorType": "delete",
						"recordId": property3,
						"sourceId": params.source_id,
						"sourceName": params.source_name
					});
					userDatabase.commitTransaction();
				}
				catch(err) {
					userDatabase.rollbackTransaction();
				}
			}
			//Rho.RhoConnectClient.on_sync_delete_error(params.server_errors["delete-error"], "retry");
			//TODO need to complete this code so the records are reinserted into the changed_values table so the application retries the delete
		}
	}
	if (params.server_errors["logoff-error"]){
		var logoff_error = params.server_errors["logoff-error"];
		syncErrorInstance = syncErrorModel.create({
			"errorCode": errorCode,
			"errorMessage": logoff_error["message"],
			"errorType": "warning",
			"recordId": "",
			"sourceId": params.source_id,
			"sourceName": params.source_name
		});
	}
}

function removeAllSyncErrors(){
	Rho.Log.info("Start: removeAllSyncErrors()", "inMotion");
	var sql = "delete from syncError";
	try {
		userDatabase.executeSql(sql);
	}
	catch (e) {
		Rho.Log.info("Error: removeAllSyncErrors(" + e.message + ")", "inMotion");
	}
	Rho.Log.info("End: removeAllSyncErrors", "inMotion");
}

function getValidateJsonObject(method, localTransferNumber) {
	Rho.Log.info("Start: getValidateJsonObject(" + method + ", " + localTransferNumber + ")", "inMotion");
	/*
	 * Creates a JSON object with the following structure:
	 * 	jsonObj.checkMethod			=	if specified, is the specific method for which validation is called (used in *.html)
	 * 										for instance, "checkout" or "captureSignature"
	 * 	jsonObj.localTransferNumber	=	if called for a specific transfer, this will be it (used in *.html)
	 * 										for instance, "checkout" or "captureSignature"
	 * 	jsonObj.syncList			=	all unsynced records
	 * 	jsonObj.trip				=	vehicle Id entered, and at task (not trip) checkout check for checkout time
	 *	jsonObj.trip.vehicleId		=	vehicleId of trip
	 *	jsonObj.trip.checkoutTime	=	checkout time of trip
	 * 	jsonObj.checkout			=	check for 
	 * 										unscanned records
	 * 										accessories (prefix, unit and preferred)
	 * 										cannot be H status
	 * 	jsonObj.captureSignature	=	check for
	 * 										scanned off truck
	 * 										cannot be H status 
	 * 	jsonObj.closeTrip			=	all transfered completed
	 * 	jsonObj.syncErrors			=	check for all sync errors including: 
	 *										create errors
	 * 										update errors
	 *										delete errors
	 *										inCommand errors
	 */
	var jsonObj = {};
	var syncList = [];
	var errorList = [];
	var warningList = [];
	var sqlExpression = [];
	var unsyncedRecordCount = 0;
	var sqlArray;
	var warningObj;
	var errorObj;
	var i;
	var holdCheckoutErrors = [];
	
	jsonObj.checkMethod = (method ? method : "");
	jsonObj.localTransferNumber = (localTransferNumber ? localTransferNumber : "");
	
	try {
		//# of records still waiting to be synced from the changed_values table
		var sql = "SELECT s.sourceId as sourceId, ";
		sql += "s.sourceName as sourceName, ";
		sql += "s.lastUpdated as lastUpdated, ";
		sql += "case when sc.recordCount is null then 0 else sc.recordCount end as recordCount, ";
		sql += "case when tc.totalCount is null then 0 else tc.totalCount end as totalCount ";
		sql += "FROM (select source_id as sourceId, name as sourceName, last_updated as lastUpdated, 0 as recordCount, 0 as totalCount from sources union all ";
		sql += "select '888','sources', 0, 0, 0 union all ";
		sql += "select '999','changed_values', 0, 0, 0) s ";
		sql += "left outer join (select source_id, count(distinct object) as recordCount from changed_values group by source_id) sc ";
		sql += "on s.sourceId = sc.source_id ";
		sql += "left outer join ( ";
		sql += "select 'Trip' as sourceName, count(*) as totalCount from Trip ";
		sql += "union all ";
		sql += "select 'Account', count(*)  from Account ";
		sql += "union all ";
		sql += "select 'AccountContact', count(*)  from AccountContact ";
		sql += "union all ";
		sql += "select 'DamagedItemDetail', count(*) from DamagedItemDetail ";
		if (localTransferNumber) {
			sql += "where localDamagedItemId in (select damagedItemId from DamagedItem where localTransferNumber = ? ) ";
		}
		sql += "union all ";
		sql += "select 'DamagedItem', count(*) from DamagedItem ";
		if (localTransferNumber) {
			sql += "where localTransferNumber = ? ";
		}
		sql += "union all ";
		sql += "select 'Employee', count(*)  from Employee ";
		sql += "union all ";
		sql += "select 'FindEquipment', count(*)  from FindEquipment ";
		sql += "union all ";
		sql += "select 'Patient', count(*) from Patient ";
		sql += "union all  ";
		sql += "select 'PreferredAccessory', count(*) from PreferredAccessory ";
		sql += "union all  ";
		sql += "select 'SignatureDetail', count(*) from SignatureDetail ";
		sql += "union all ";
		sql += "select 'SignatureHeader', count(*) from SignatureHeader ";
		sql += "union all ";
		sql += "select 'SignatureImage', count(*) from SignatureImage ";
		sql += "union all ";
		sql += "select 'SignatureSend', count(*) from SignatureSend ";
		sql += "union all ";
		sql += "select 'SurplusRetrievedAccessories', count(*) from SurplusRetrievedAccessories ";
		sql += "union all ";
		sql += "select 'TransferComment', count(*) from TransferComment ";
		if (localTransferNumber) {
			sql += "where localTransferNumber = ? ";
		}
		sql += "union all ";
		sql += "select 'TransferDetail', count(*) from TransferDetail ";
		if (localTransferNumber) {
			sql += "where localTransferNumber = ? ";
		}
		sql += "union all ";
		sql += "select 'TransferEquipmentOrder', count(*) from TransferEquipmentOrder ";
		if (localTransferNumber) {
			sql += "where localTransferNumber = ? ";
		}
		sql += "union all ";
		sql += "select 'TransferHeader', count(*) from TransferHeader ";
		if (localTransferNumber) {
			sql += "where localTransferNumber = ? ";
		}
		sql += "union all ";
		sql += "select 'TransferSwapout', count(*) from TransferSwapout ";
		sql += "union all ";
		sql += "select 'TransferredPrefixAccessories', count(*) from TransferredPrefixAccessories ";
		if (localTransferNumber) {
			sql += "where localTransferNumber = ? ";
		}
		sql += "union all ";
		sql += "select 'TransferredUnitAccessories', count(*) from TransferredUnitAccessories ";
		if (localTransferNumber) {
			sql += "where localTransferNumber = ? ";
		}
		sql += "union all ";
		sql += "select 'TripDetail', count(*) from TripDetail ";
		sql += "union all ";
		sql += "select 'sources', count(*) from sources ";
		sql += "union all ";
		sql += "select 'changed_values', count(*) from changed_values ";
		sql += ") tc ";
		sql += "on s.sourceName = tc.sourceName ";
		//sql += "where sync_type = 'incremental' or name in ('Employee', 'Account') ";
		sql += "order by sourceName";
	
		if (localTransferNumber) {
			sqlExpression = [];
			sqlExpression[0] = localTransferNumber;
			sqlExpression[1] = localTransferNumber;
			sqlExpression[2] = localTransferNumber;
			sqlExpression[3] = localTransferNumber;
			sqlExpression[4] = localTransferNumber;
			sqlExpression[5] = localTransferNumber;
			sqlExpression[6] = localTransferNumber;
			sqlExpression[7] = localTransferNumber;
			sqlArray = userDatabase.executeSql(sql, sqlExpression);
		}
		else {
			sqlArray = userDatabase.executeSql(sql);
		}
	
		for (i = 0; i < sqlArray.length; i++){
			if (sqlArray[i].recordCount > 0){
				unsyncedRecordCount += parseInt(sqlArray[i].recordCount);
				warningObj = {};
				warningObj.errorCode = 99999;
				warningObj.errorMessage = sqlArray[i].sourceName + " has " + sqlArray[i].recordCount + " record(s) that need to be synced";
				warningObj.recordId = 0;
				warningObj.sourceId = sqlArray[i].sourceId;
				warningObj.sourceName = sqlArray[i].sourceName;
				warningObj.object = 0;
				warningList.push(warningObj);

				if (sqlArray[i].sourceName == "TransferDetail" || sqlArray[i].sourceName == "TransferHeader" || sqlArray[i].sourceName == "Trip" || sqlArray[i].sourceName == "TripDetail") {
					holdCheckoutErrors.push(warningObj);
				}
			}
			
			var syncObj = {};
			if (i % 2 === 0){
				syncObj.rowClass = "listOddRow";
			}
			else {
				syncObj.rowClass = "listEvenRow";
			}
			syncObj.sourceName = sqlArray[i].sourceName;
			var lastUpdated = new Date(sqlArray[i].lastUpdated * 1000);
			var formattedLastUpdated = lastUpdated.getFullYear() + "-" + formatNumberLength((lastUpdated.getMonth() + 1),2) + "-" + formatNumberLength(lastUpdated.getDate(),2) + " " + formatNumberLength(lastUpdated.getHours(),2) + ":" + formatNumberLength(lastUpdated.getMinutes(),2) + ":" + formatNumberLength(lastUpdated.getSeconds(),2);
			syncObj.lastUpdated = formattedLastUpdated;
			syncObj.recordCount = sqlArray[i].recordCount;
			syncObj.totalCount = sqlArray[i].totalCount;
			syncList.push(syncObj);
		}
		jsonObj.syncList = syncList;
		
		if (localTransferNumber === undefined) {
			//populate non sync errors / warnings -- only if for entire order (not at task checkout)
			/* check if TripDetailTemporary has records.
			 * Records in this table are placeholders when adding accounts without transfers.
			 * They are necessary to have the account show when reading TripDetail.
			 */
			sql = "select accountId, ";
			sql += "object ";
			sql += "from TripDetailTemporary ";
			sql += "where taskType = 'X' ";
			sqlArray = userDatabase.executeSql(sql);
			for (i = 0; i < sqlArray.length; i++){
				errorObj = {};
				errorObj.errorCode = 99998;
				errorObj.errorMessage = "Account " + sqlArray[i].accountId + " has no tasks, please remove account.";
				errorObj.recordId = sqlArray[i].object;
				errorObj.sourceId = 25;
				errorObj.sourceName = "TripDetailTemporary";
				errorObj.object = sqlArray[i].object;
				errorList.push(errorObj);
			}
		}
		//check to see if vehicleId on Trip is filled in
		sql = "select vehicleId, ";
		sql += "tripCheckoutDateDevice, ";
		sql += "object ";
		sql += "from Trip ";
		sqlArray = userDatabase.executeSql(sql);
		jsonObj.trip = {};
		if (sqlArray.length > 0) {
			jsonObj.trip.vehicleId = sqlArray[0].vehicleId;
			jsonObj.trip.tripCheckoutDateDevice = sqlArray[0].tripCheckoutDateDevice;
			if (sqlArray[0].vehicleId.length === 0) {
				errorObj = {};
				errorObj.errorCode = 99998;
				errorObj.errorMessage = "Vehicle Id on trip is missing, please Edit Trip.";
				errorObj.recordId = sqlArray[0].object;
				errorObj.sourceId = 26;
				errorObj.sourceName = "Trip";
				errorObj.object = sqlArray[0].object;
				errorList.push(errorObj);
				holdCheckoutErrors.push(errorObj);
			}
		}
		jsonObj.trip.unsyncedRecordCount = unsyncedRecordCount;
		jsonObj.trip.warningList = warningList;
		jsonObj.trip.errorList = errorList;
		errorList = [];
		warningList = [];
	
		//check for items on the TransferEquipmentOrder that have not been scanned. Deliveries only.
		sql = "select case when eo.transferNumber > 0 then eo.transferNumber else eo.localTransferNumber end as transferNumber, ";
		sql += "trim(eo.prefix) as prefix, ";
		sql += "eo.quantityOrdered as quantityOrdered, ";
		sql += "case when (td.quantityScanned) is null then 0 else td.quantityScanned end as quantityScanned ";
		sql += "from ( ";
		sql += "select teo.localTransferNumber, ";
		sql += "teo.transferNumber, ";
		sql += "trim(prefix) as prefix, ";
		sql += "sum(quantityOrdered) as quantityOrdered ";
		sql += "from transferEquipmentOrder teo ";
		sql += "inner join transferHeader th ";
		sql += "on teo.localTransferNumber = th.localTransferNumber ";
		sql += "where th.status != 'C' ";
		sql += "and teo.localTransferNumber ";
		if (localTransferNumber) {
			sql += " = ? ";
		}
		else {
			sql += "in (select localTaskReferenceId from tripDetail where taskType = 'D') ";
		}
		sql += "group by teo.localTransferNumber, teo.transferNumber, trim(prefix) ";
		sql += ") eo ";
		sql += "left outer join ( ";
		sql += "select td.localTransferNumber, ";
		sql += "trim(prefix) as prefix, ";
		sql += "count(*) as quantityScanned ";
		sql += "from transferDetail td ";
		sql += "inner join transferHeader th ";
		sql += "on td.localTransferNumber = th.localTransferNumber ";
		sql += "where th.status != 'C' ";
		sql += "and td.localTransferNumber ";
		if (localTransferNumber) {
			sql += " = ? ";
		}
		else {
			sql += "in (select localTaskReferenceId from tripDetail where taskType = 'D') ";
		}
		sql += "group by td.localTransferNumber, trim(prefix) ";
		sql += ") td ";
		sql += "on eo.localTransferNumber = td.localTransferNumber and ";
		sql += "eo.prefix = td.prefix ";
		sql += "where eo.quantityOrdered != case when (td.quantityScanned) is null then 0 else td.quantityScanned end ";
		
		if (localTransferNumber) {
			sqlExpression = [];
			sqlExpression[0] = localTransferNumber;
			sqlExpression[1] = localTransferNumber;
			sqlArray = userDatabase.executeSql(sql, sqlExpression);
		}
		else {
			sqlArray = userDatabase.executeSql(sql);
		}
		
		for (i = 0; i < sqlArray.length; i++){
			warningObj = {};
			warningObj.errorCode = 99999;
			warningObj.errorMessage = sqlArray[i].prefix + " qty (" + sqlArray[i].quantityScanned + ") is not qty ordered (" + sqlArray[i].quantityOrdered + ") for transfer " + sqlArray[i].transferNumber + ".";
			warningObj.recordId = "";
			warningObj.sourceId = 19;
			warningObj.sourceName = "TransferEquipmentOrder";
			warningObj.object = "";
			warningList.push(warningObj);
		}
	
		//check for missing accessories hasUnitAccesoryTracking = 0
		sql = "select th.accountId, ";
		sql += "a.hasUnitAccessoryTracking, ";
		sql += "td.department, ";
		sql += "td.prefix, ";
		sql += "td.unit, ";
		sql += "pa.stockNumber, ";
		sql += "pa.itemDescription, ";
		sql += "pa.quantity, ";
		sql += "case when ta.totalQuantity is null then 0 else ta.totalQuantity end as totalQuantity, ";
		sql += "tdc.unitCount, ";
		sql += "td.object ";
		sql += "from TransferDetail td ";
		sql += "inner join TransferHeader th ";
		sql += "on td.localTransferNumber = th.localTransferNumber ";
		sql += "and th.status != 'C' ";
		sql += "inner join Account a ";
		sql += "on th.accountId = a.accountId ";
		sql += "inner join PreferredAccessory pa ";
		sql += "on th.accountId = pa.accountId ";
		sql += "and td.department = pa.department ";
		sql += "and td.prefix = pa.prefix ";
		sql += "left outer join (  ";
		sql += "SELECT accessory, quantity as totalQuantity, ";
		sql += "localTransferNumber, ";
		sql += "prefix ";
		sql += "FROM transferredPrefixAccessories  ";
		sql += ") ta  ";
		sql += "on pa.itemDescription = ta.accessory ";
		sql += "and td.localTransferNumber = ta.localTransferNumber ";
		sql += "and td.prefix = ta.prefix ";
		sql += "left outer join  ";
		sql += "( ";
		sql += "select localTransferNumber, prefix, count(*) as unitCount ";
		sql += "from TransferDetail ";
		sql += "group by localTransferNumber, prefix ";
		sql += ") tdc ";
		sql += "on td.localTransferNumber = tdc.localTransferNumber ";
		sql += "and td.prefix = tdc.prefix ";
		sql += "where td.localTransferNumber ";
		if (localTransferNumber) {
			sql += " = ? ";
		}
		else {
			sql += "in ( ";
			sql += "SELECT localTaskReferenceId ";
			sql += "from TripDetail ";
			sql += "where taskType = 'D' ";
			sql += ") ";
		}
		sql += "and hasUnitAccessoryTracking = 0 ";
		sql += "and case when ta.totalQuantity is null then 0 else ta.totalQuantity end = 0 ";
	
		if (localTransferNumber) {
			sqlExpression = [];
			sqlExpression[0] = localTransferNumber;
			sqlArray = userDatabase.executeSql(sql, sqlExpression);
		}
		else {
			sqlArray = userDatabase.executeSql(sql);
		}
		for (i = 0; i < sqlArray.length; i++){
			warningObj = {};
			warningObj.errorCode = 99999;
			warningObj.errorMessage = sqlArray[i].prefix + " " + sqlArray[i].unit + " " + sqlArray[i].itemDescription + " accessory qty needs to be verified.";
			warningObj.recordId = sqlArray[i].object;
			warningObj.sourceId = 18;
			warningObj.sourceName = "TransferDetail";
			warningObj.object = sqlArray[i].object;
			warningList.push(warningObj);
		}
	
		sql = "select th.accountId,  ";
		sql += "th.localTransferNumber, ";
		sql += "a.hasUnitAccessoryTracking, ";
		sql += "td.department, ";
		sql += "td.prefix, ";
		sql += "td.unit, ";
		sql += "pa.stockNumber, ";
		sql += "pa.itemDescription, ";
		sql += "pa.quantity, ";
		sql += "pa.department, ";
		sql += "case when ta.totalQuantity is null then 0 else ta.totalQuantity end as totalQuantity ";
		sql += "from TransferDetail td ";
		sql += "inner join TransferHeader th ";
		sql += "on td.localTransferNumber = th.localTransferNumber ";
		sql += "inner join Account a ";
		sql += "on th.accountId = a.accountId ";
		sql += "inner join PreferredAccessory pa ";
		sql += "on th.accountId = pa.accountId ";
		sql += "and td.department = pa.department ";
		sql += "and td.prefix = pa.prefix ";
		sql += "left outer join ( ";
		sql += "SELECT stockNumber, count(*) as totalQuantity, ";
		sql += "localTransferNumber, ";
		sql += "prefix, ";
		sql += "unit ";
		sql += "FROM transferredUnitAccessories  ";
		sql += "group by localTransferNumber, prefix, unit, stockNumber ";
		sql += ") ta ";
		sql += "on pa.stockNumber = ta.stockNumber ";
		sql += "and td.localTransferNumber = ta.localTransferNumber ";
		sql += "and td.prefix = ta.prefix ";
		sql += "and td.unit = ta.unit ";
		sql += "where td.localTransferNumber ";
		if (localTransferNumber) {
			sql += " = ? ";
		}
		else {
			sql += "in ( ";
			sql += "SELECT localTaskReferenceId ";
			sql += "from TripDetail ";
			sql += "where taskType = 'D' ";
			sql += ") ";
		}
		sql += "and hasUnitAccessoryTracking = 1 ";
		sql += "and case when ta.totalQuantity is null then 0 else ta.totalQuantity end = 0 ";
		
		if (localTransferNumber) {
			sqlExpression = [];
			sqlExpression[0] = localTransferNumber;
			sqlArray = userDatabase.executeSql(sql, sqlExpression);
		}
		else {
			sqlArray = userDatabase.executeSql(sql);
		}
		for (i=0; i < sqlArray.length; i++){
			warningObj = {};
			warningObj.errorCode = 99999;
			warningObj.errorMessage = sqlArray[i].prefix + " " + sqlArray[i].unit + " " + sqlArray[i].stockNumber + " accessory qty needs to be verified.";
			warningObj.recordId = sqlArray[i].object;
			warningObj.sourceId = 18;
			warningObj.sourceName = "TransferDetail";
			warningObj.object = sqlArray[i].object;
			warningList.push(warningObj);
		}
	
		sql = "select th.transferNumber, ";
		sql += "th.localTransferNumber, ";
		sql += "th.object ";
		sql += "from TransferHeader th ";
		sql += "where th.localTransferNumber ";
		if (localTransferNumber) {
			sql += " = ? ";
		}
		else {
			sql += "in ( select localTaskReferenceId ";
			sql += "from TripDetail ";
			sql += "where taskType = 'D' ) ";
		}
		sql += "and th.status = 'H' ";
	
		if (localTransferNumber) {
			sqlExpression = [];
			sqlExpression[0] = localTransferNumber;
			sqlArray = userDatabase.executeSql(sql, sqlExpression);
		}
		else {
			sqlArray = userDatabase.executeSql(sql);
		}
		for (i = 0; i < sqlArray.length; i++){
			errorObj = {};
			errorObj.errorCode = 99998;
			errorObj.errorMessage = "Please remove transfer " + (sqlArray[i].transferNumber == 0 ? sqlArray[i].localTransferNumber : sqlArray[i].transferNumber) + " from trip or add items to deliver.";
			errorObj.recordId = sqlArray[i].object;
			errorObj.sourceId = 20;
			errorObj.sourceName = "TransferHeader";
			errorObj.object = sqlArray[i].object;
			errorList.push(errorObj);
		}
		if(holdCheckoutErrors.length > 0) {
			$.merge(errorList, holdCheckoutErrors);
		}
		jsonObj.checkout = {};
		jsonObj.checkout.warningList = warningList;
		jsonObj.checkout.errorList = errorList;
		errorList = [];
		warningList = [];
	
		if (method == "captureSignature"){
			if (localTransferNumber === null) {
				errorObj = {};
				errorObj.errorCode = 99998;
				errorObj.errorMessage = "Unable to determine the transfer to verify";
				errorObj.recordId = "";
				errorObj.sourceId = "";
				errorObj.sourceName = "";
				errorObj.object = "";
				errorList.push(errorObj);
			}
			else {
				sqlExpression = [];
				sqlExpression[0] = localTransferNumber;
		
				sql = "SELECT td.localTransferNumber, ";
				sql += "td.transferNumber, ";
				sql += "td.prefix, ";
				sql += "td.unit, ";
				sql += "refusedFlag, ";
				sql += "case when td.refusedFlag = 'Y' then 0 when td.scanOffDate = '0001-01-01 00:00:00.0' then 1 when td.scanOffDate is null then 1 else 0 end as scanOffFlag, ";
				sql += "(select source_id from sources where name = 'TransferDetail') as sourceId ";
				sql += "FROM transferdetail td ";
				sql += "inner join TransferHeader th ";
				sql += "on td.localTransferNumber = th.localTransferNumber ";
				sql += "where td.localTransferNumber = ? ";
				sql += "and th.transferType = 'D' ";
				sql += "and case when td.refusedFlag = 'Y' then 0 when td.scanOffDate = '0001-01-01 00:00:00.0' then 1 when td.scanOffDate is null then 1 else 0 end > 0 ";
	
				sqlArray = userDatabase.executeSql(sql, sqlExpression);
				for (i = 0; i < sqlArray.length; i++){
					errorObj = {};
					errorObj.errorCode = 99998;
					errorObj.errorMessage = "Item " + sqlArray[i].prefix + " " + formatNumberLength(sqlArray[i].unit, 4)  + " on transfer " + sqlArray[i].transferNumber + " has not been scanned at customer.";
					errorObj.recordId = sqlArray[i].object;
					errorObj.sourceId = sqlArray[i].sourceId;
					errorObj.sourceName = "TransferDetail";
					errorObj.object = sqlArray[i].object;
					errorList.push(errorObj);
				}
		
				//Check for pickup records with a status of H
				sqlExpression = [];
				sqlExpression[0] = localTransferNumber;
		
				sql = "select th.transferNumber, ";
				sql += "th.localTransferNumber, ";
				sql += "th.object, ";
				sql += "(select source_id from sources where name = 'TransferHeader') as sourceId ";
				sql += "from TransferHeader th ";
				sql += "where localTransferNumber = ? ";
				sql += "and th.status = 'H' ";
	
				sqlArray = userDatabase.executeSql(sql, sqlExpression);
				for (i = 0; i < sqlArray.length; i++){
					warningObj = {};
					warningObj.errorCode = 99998;
					warningObj.errorMessage = "Transfer " + (sqlArray[i].transferNumber == 0 ? sqlArray[i].localTransferNumber : sqlArray[i].transferNumber) + " has not been checked out or has zero scanned items.";
					warningObj.recordId = sqlArray[i].object;
					warningObj.sourceId = sqlArray[i].sourceId;
					warningObj.sourceName = "TransferHeader";
					warningObj.object = sqlArray[i].object;
					warningList.push(warningObj);
				}
				
				//check for items on swap out delivery that do not have a swapout table entry
				sqlExpression = [];
				sqlExpression[0] = localTransferNumber;
				
				sql = "select localSwapOutNumber ";
				sql += "from TransferHeader ";
				sql += "where localTransferNumber = ? ";
				
				sqlArray = userDatabase.executeSql(sql, sqlExpression);
				var localSwapoutTransferNumber = 0;
				if (sqlArray.length > 0) {
					localSwapoutTransferNumber = sqlArray[0].localSwapOutNumber;

					if (localSwapoutTransferNumber > 0){
						sqlExpression = [];
						sqlExpression[0] = localSwapoutTransferNumber;

						sql = "select th.transferNumber, ";
						sql += "th.localTransferNumber, ";
						sql += "td.prefix, ";
						sql += "td.unit, ";
						sql += "thp.transferNumber as pickupTransferNumber,";
						sql += "thp.localTransferNumber as pickupLocalTransferNumber ";
						sql += "from TransferHeader th ";
						sql += "inner join TransferDetail td ";
						sql += "on th.localTransferNumber = td.localTransferNumber ";
						sql += "inner join TripDetail trpd ";
						sql += "on th.localTransferNumber = trpd.localTaskReferenceId ";
						sql += "left outer join TransferHeader thp ";
						sql += "on th.localTransferNumber = thp.localSwapOutNumber ";
						sql += "left outer join TransferSwapout ts ";
						sql += "on th.localTransferNumber = ts.localDeliveryTransferNumber ";
						sql += "and td.prefix = ts.deliveryPrefix ";
						sql += "and td.unit = ts.deliveryUnit ";
						sql += "where th.localTransferNumber = ? ";  
						sql += "and th.transferType = 'D' ";
						sql += "and th.swapOutFlag = 'Y' ";
						sql += "and trpd.scanLevel = 1 ";
						sql += "and ts.localDeliveryTransferNumber is null ";

						sqlArray = userDatabase.executeSql(sql, sqlExpression);
						for (i = 0; i < sqlArray.length; i++){
							warningObj = {};
							warningObj.errorCode = 99998;
							warningObj.errorMessage = "The swap out item " + sqlArray[i]. prefix + " " + sqlArray[i].unit + " on the delivery transfer " + (sqlArray[i].transferNumber == 0 ? sqlArray[i].localTransferNumber : sqlArray[i].transferNumber) + " has not been tied to an item on the pickup transfer " + (sqlArray[i].pickupTransferNumber == 0 ? sqlArray[i].pickupLocalTransferNumber : sqlArray[i].pickupTransferNumber) + ".";
							warningObj.recordId = sqlArray[i].object;
							warningObj.sourceId = sqlArray[i].sourceId;
							warningObj.sourceName = "TransferHeader";
							warningObj.object = sqlArray[i].object;
							warningList.push(warningObj);
						}
					}
				}
			}
		}
		jsonObj.captureSignature = {};
		jsonObj.captureSignature.warningList = warningList;
		jsonObj.captureSignature.errorList = errorList;
		errorList = [];
		warningList = [];
	
		sql = "select th.transferNumber, ";
		sql += "th.localTransferNumber, ";
		sql += "th.object ";
		sql += "from TransferHeader th ";
		sql += "where th.localTransferNumber ";
		if (localTransferNumber) {
			sql += " = ? ";
		}
		else {
			sql += "in ( select localTaskReferenceId ";
			sql += "from TripDetail ";
			sql += "where th.status <> 'C' )";
		}
		if (localTransferNumber) {
			sqlExpression = [];
			sqlExpression[0] = localTransferNumber;
			sqlArray = userDatabase.executeSql(sql, sqlExpression);
		}
		else {
			sqlArray = userDatabase.executeSql(sql);
		}
		for (i = 0; i < sqlArray.length; i++){
			errorObj = {};
			errorObj.errorCode = 99998;
			errorObj.errorMessage = "Transfer " + (sqlArray[i].transferNumber == 0 ? sqlArray[i].localTransferNumber : sqlArray[i].transferNumber) + " has not been completed; missing signature.";
			errorObj.recordId = sqlArray[i].object;
			errorObj.sourceId = 20;
			errorObj.sourceName = "TransferHeader";
			errorObj.object = sqlArray[i].object;
			errorList.push(errorObj);
		}
		jsonObj.closeTrip = {};
		jsonObj.closeTrip.warningList = warningList;
		jsonObj.closeTrip.errorList = errorList;
		errorList = [];
		warningList = [];
	
		//populate sync errors
		sql = "select errorCode, ";
		sql += "errorMessage, ";
		sql += "errorType, ";
		sql += "recordId, ";
		sql += "sourceId, ";
		sql += "sourceName, ";
		sql += "object ";
		sql += "from SyncError ";
		if (localTransferNumber) {
			sql += "where recordId in ( ";
			sql += "select object from TransferHeader where localTransferNumber = ? ";
			sql += "union all ";
			sql += "select object from TransferDetail where localTransferNumber = ? ";
			sql += "union all ";
			sql += "select object from TransferredUnitAccessories where localTransferNumber = ? ";
			sql += "union all ";
			sql += "select object from TransferredPrefixAccessories where localTransferNumber = ? ";
			sql += ")";
		}
		if (localTransferNumber) {
			sqlExpression = [];
			sqlExpression[0] = localTransferNumber;
			sqlExpression[1] = localTransferNumber;
			sqlExpression[2] = localTransferNumber;
			sqlExpression[3] = localTransferNumber;
			sqlArray = userDatabase.executeSql(sql, sqlExpression);
		}
		else {
			sqlArray = userDatabase.executeSql(sql);
		}
		for (i = 0; i < sqlArray.length; i++){
			if (sqlArray[i].errorType == "warning") {
				warningObj = sqlArray[i];
				warningList.push(warningObj);
			}
			else {
				errorObj = sqlArray[i];
				errorList.push(errorObj);
			}
		}
		jsonObj.syncErrors = {};
		jsonObj.syncErrors.errorList = errorList;
		jsonObj.syncErrors.warningList = warningList;

		if (method == "captureSignature") {
			// at this point we know the localTransferNumber should be non-null, from accountMenu.js
			// add SyncErrors (from process errors) based on the detail lines to captureSignature warnings/errors
			if (warningList.length > 0) {
				$.merge(jsonObj.captureSignature.warningList, warningList);
			}
			if (errorList.length > 0) {
				$.merge(jsonObj.captureSignature.errorList, errorList);
			}
		}
	}
	catch (e) {
		Rho.Log.info("Error: getValidateJsonObject(" + e.message + ")", "inMotion");
		jsonObj.syncList = [];
		jsonObj.trip = {};
		jsonObj.trip.unsyncedRecordCount = 0;
		jsonObj.trip.warningList = [];
		jsonObj.trip.errorList = [];
		jsonObj.checkout = {};
		jsonObj.checkout.warningList = [];
		jsonObj.checkout.errorList = [];
		jsonObj.captureSignature = {};
		jsonObj.captureSignature.warningList = [];
		jsonObj.captureSignature.errorList = [];
		jsonObj.closeTrip = {};
		jsonObj.closeTrip.warningList = [];
		jsonObj.closeTrip.errorList = [];
		jsonObj.syncErrors = {};
		jsonObj.syncErrors.errorList = [{
			"errorCode" : 99998,
			"errorMessage" : "Unable to verify trip, please try again or contact inMotion support (" + e.message + ").",
			"recordId" : "",
			"sourceId" : "",
			"sourceName" : "",
			"object" : ""
		}];
	}
	finally {
		if (jsonObj.syncErrors.errorList.length > 0) {
			$("#syncMessage").text("- inCommand Errors");
		}
		else if (jsonObj.checkout.errorList.length > 0 && jsonObj.trip.tripCheckoutDateDevice.length === 0) {
			$("#syncMessage").text("- Checkout Errors");
		}
		else if (jsonObj.captureSignature.errorList.length > 0) {
			$("#syncMessage").text("- Task Errors");
		}
		else if (jsonObj.trip.errorList.length > 0 || jsonObj.closeTrip.errorList.length > 0 || jsonObj.checkout.errorList.length > 0) {
			$("#syncMessage").text("- General Errors");
		}
		else {
			$("#syncMessage").text("");
		}
	}

	Rho.Log.info("End: getValidateJsonObject", "inMotion");
	return jsonObj;
}

function onApplicationNotify(data) {
	Rho.Log.info("Start: onApplicationNotify()", "inMotion");
	var evt = data.applicationEvent;
	if (evt == "Deactivated"){
		deleteLogin();
	}
	Rho.Log.info("End: onApplicationNotify", "inMotion");
}

function resetProgress(withText) {
	withText = withText ? withText : "Re-initializing after server error";
	Rho.Log.info("Start: resetProgress(" + withText + ")", "inMotion");
	//need to redo all current steps 0 based, hence - 1
	progressBar.loadingSteps = (progressBar.currentStep - 1) + progressBar.loadingSteps;
	if ($("#loadingResource").length > 0 ) {
		$("#loadingResource").text(withText);
	}
	Rho.Log.info("End: resetProgress", "inMotion");
}

function updateProgress(message, incrementWeight) {
	if ($("#loadingResource").length > 0 ) {
		incrementWeight = incrementWeight ? incrementWeight : 1;
		message = message ? message : $("#loadingResource").text();
		var totalWidth = $("#progress_bar").width();
		var currentWidth = $("#loadingBar").width();
		var remainingSteps = progressBar.loadingSteps - progressBar.currentStep;
		var remainingWidth = totalWidth - currentWidth;
		var singleInc = remainingSteps === 0 ? 1 : remainingWidth/remainingSteps;
		var inc = incrementWeight * singleInc;
		progressBar.currentStep++;
		currentWidth += inc;
		currentWidth = (currentWidth/totalWidth) * 100;
		currentWidth = currentWidth > 100 ? 100 : currentWidth;
		$("#loadingResource").text(message);
		$("#loadingBar").css("width", currentWidth + "%");
		$("#loadingValue").text(parseInt(currentWidth) + "%");
	}
}

function stopRhoSync() {
	//stop syncing, wait max of 30 seconds
	Rho.Log.info("Start: stopRhoSync()", "inMotion");
	var ms = new Date().getTime() + 30000;
	if (Rho.RhoConnectClient.isSyncing()) {
		Rho.RhoConnectClient.stopSync();
		Rho.Log.info("Stopping current sync...", "inMotion");
		while (Rho.RhoConnectClient.isSyncing() && new Date() < ms){
			//nothing
			Rho.Log.info("Stopping current sync (" + new Date() + ")", "inMotion");
		}
	}
	Rho.Log.info("End: stopRhoSync", "inMotion");
}

function waitForRhoSyncToComplete(waitForSeconds) {
	//wait for waitForSeconds for syncing to complete
	waitForSeconds = waitForSeconds ? waitForSeconds : 300;
	waitForSeconds = waitForSeconds * 1000;
	Rho.Log.info("Start: waitForRhoSyncToComplete(" + waitForSeconds + ")", "inMotion");
	var ms = new Date().getTime() + waitForSeconds;
	if (Rho.RhoConnectClient.isSyncing()) {
		Rho.Log.info("Waiting for current sync...", "inMotion");
		while (Rho.RhoConnectClient.isSyncing() && new Date() < ms){
			//nothing
		}
		if (Rho.RhoConnectClient.isSyncing()) {
			Rho.Log.info("End: waitForRhoSyncToComplete (did not stop)", "inMotion");
			return false;
		}
		Rho.Log.info("End: waitForRhoSyncToComplete (stopped)", "inMotion");
		return true;
	}
	else {
		Rho.Log.info("End: waitForRhoSyncToComplete (was not syncing)", "inMotion");
		return true;
	}
}

function logout(){
	Rho.Log.info("Start: logout()", "inMotion");
	hideMenu();
	userDatabase.close();
	Rho.RhoConnectClient.logout();
	Rho.Application.quit();
	Rho.Log.info("End: logout", "inMotion");
}