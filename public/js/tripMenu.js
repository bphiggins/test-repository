function addTransfersForAccount(){
	Rho.Log.info("Start: addTransfersForAccount()", "inMotion");

	userDatabase.startTransaction();
	try {
		var tripId = $("#tripContainer").attr("data-tripId");
		var localTripId = $("#tripContainer").attr("data-localTripId");
		var accountId = $(this).attr("data-accountId");
		var currentEmployeeId = $("#tripContainer").attr("data-currentEmployeeId");

		//remove any temporary trip detail records for this account.
		/*Temporary detail records are created when an account is added to the trip but does not have
		  any transferHeader records. The temporary record is necessary so readTripDetail()
		  will show the account.
		*/
		var sqlExpression = [];
		sqlExpression[0] = accountId;

		var sql = "SELECT accountId, ";
		sql += "localTaskReferenceId, ";
		sql += "taskReferenceId, ";
		sql += "taskType, ";
		sql += "tripDetailId, ";
		sql += "localTripDetailId, ";
		sql += "tripId, ";
		sql += "localTripId, ";
		sql += "employeeId, ";
		sql += "scanLevel , ";
		sql += "object ";
		sql += "FROM TripDetailTemporary ";
		sql += "where taskType = 'X' ";
		sql += "and accountId = ? ";
		var tempTripDetailList = userDatabase.executeSql(sql, sqlExpression);
		var tripDetail;

		if (tempTripDetailList.length > 0){
			tripDetail = tripDetailModel.make(tempTripDetailList[0]);
			tripDetail.destroy();
		}

		sqlExpression = [];
		sqlExpression[0] = accountId;
		sqlExpression[1] = localTripId;
		sqlExpression[2] = accountId;

		sql = "SELECT accountId, ";
		sql += "transferNumber, ";
		sql += "localTransferNumber, ";
		sql += "transferType ";
		sql += "from transferHeader th ";
		sql += "left outer join ( ";
		sql += "select localTaskReferenceId ";
		sql += "from tripDetail ";
		sql += "where accountId = ? ";
		sql += "and localTripId = ? ";
		sql += ") td ";
		sql += "on th.localTransferNumber = td.localTaskReferenceId ";
		sql += "where td.localTaskReferenceId is null ";
		sql += "and accountId = ? ";
		var transferHeaderList = userDatabase.executeSql(sql, sqlExpression);
		var i;

		//add tripDetail records for each transferHeader in list
		for (i = 0; i < transferHeaderList.length; i++){
			tripDetail = tripDetailModel.create({
				"tripDetailId": 0,
				"localTripDetailId": 0,
				"tripId": tripId,
				"localTripId": localTripId,
		   		"taskType": transferHeaderList[i].transferType,
		    	"taskReferenceId": transferHeaderList[i].transferNumber,
		    	"localTaskReferenceId": transferHeaderList[i].localTransferNumber,
		    	"accountId": accountId,
		    	"employeeId": currentEmployeeId,
		    	"scanLevel": 0
			});

			tripDetail.updateAttributes({
				localTripDetailId: tripDetail.get("object")
			});
		}

		//if there are no open transferHeader records for this account create a temporary tripDetail record
		sqlExpression = [];
		sqlExpression[0] = accountId;

		sql = "SELECT transferType, ";
		sql += "transferNumber, ";
		sql += "localTransferNumber, ";
		sql += "accountId ";
		sql += "from transferHeader th ";
		sql += "where accountId = ? ";
		sql += "and status <> 'C' ";
		var transferHeaderCheckList = userDatabase.executeSql(sql, sqlExpression);

		if (transferHeaderCheckList.length === 0){
			tripDetail = tripDetailTemporaryModel.create({
				"tripDetailId": 0,
				"localTripDetailId": 0,
				"tripId": tripId,
				"localTripId": localTripId,
			    "taskType": 'X',
			    "taskReferenceId": 0,
			    "localTaskReferenceId": 0,
			    "accountId": accountId,
			    "employeeId": currentEmployeeId,
			    "scanLevel": 0
			});

			tripDetail.updateAttributes({localTripDetailId: tripDetail.get("object")});
		}
		userDatabase.commitTransaction();
		readTripDetail();
	}
	catch(e) {
		Rho.Log.info("Error: addTransfersForAccount rollback=" + e, "inMotion");
		userDatabase.rollbackTransaction();
	}
	finally {
		Rho.Log.info("End: addTransfersForAccount", "inMotion");
	}
}

function preCheckout(){
	Rho.Log.info("Start: preCheckout()", "inMotion");
	detectUHSRhoServer(loadCheckout);
	Rho.Log.info("End: preCheckout", "inMotion");
}

function loadCheckout() {
	Rho.Log.info("Start: loadCheckout()", "inMotion");
	hideMenu();
	var jsonObj = getValidateJsonObject("checkout");
	if (parseInt(jsonObj.trip.unsyncedRecordCount) > 0 || jsonObj.syncErrors.errorList.length > 0) {
		progressBar.currentStep = 0;
		progressBar.loadingSteps = 11;
		progressBar.loadingModel = "";
		$.get("/public/templates/loading.html", checkoutProgress);
	}
	else {
		progressBar.currentStep = 0;
		progressBar.loadingSteps = 2;
		progressBar.loadingModel = "";
		$.get("/public/templates/loading.html", checkout);
	}
	Rho.Log.info("End: loadCheckout", "inMotion");
}

function checkoutProgress(loadingData) {
	Rho.Log.info("Start: checkoutProgress()", "inMotion");
	modal.open({
		content: loadingData,
		hideSave: true,
		hideClose: true
	});

	$("#loadingMessage").replaceWith("<div id=\"loadingMessage\">Uploading Data to inCommand</div>");
	updateProgress("Uploading application data");
	setModelNotifications(onCheckoutSyncNotify);
	removeAllSyncErrors();
	setModelsSync("none", "checkout");
	Rho.RhoConnectClient.doSync(false, "", false);
	Rho.Log.info("End: checkoutProgress", "inMotion");
}

function onCheckoutSyncNotify(params) {
	Rho.Log.info("Start: onCheckoutSyncNotify(" + JSON.stringify(params) + ")", "inMotion");

	if (params.status == "error"){
		processSyncErrors(params);
	}
	else if (params.status == "complete") {
		if (disconnectedError) {
			processDisconnectedError();
		}
		updateProgress("Upload Complete - Checkout Trip");
		onCheckoutSyncComplete();
	}
	else if (params.status == "ok") {
		if (progressBar.loadingModel != params.source_name) {
			progressBar.loadingModel = params.source_name;
			updateProgress("Uploading application data");
		}
	}
	Rho.Log.info("End: onCheckoutSyncNotify", "inMotion");
}

function onCheckoutSyncComplete() {
	Rho.Log.info("Start: onCheckoutSyncComplete()", "inMotion");
	updateProgress("Upload Complete - Checkout");
	setModelsSync();
	setModelNotifications();
	checkout();
	Rho.Log.info("End: onCheckoutSyncComplete", "inMotion");
}

function checkout(){
	Rho.Log.info("Start checkout()", "inMotion");
	/*TODO
		Are there local changes that need to be synched? Could probably handle this with a call to doSync()
		Are there errors that need to be corrected?
		Are there deliveries on trip that have a status of 'H'?
		if yes to any, what happens?
	*/
	var jsonObj = getValidateJsonObject("checkout");

	if (jsonObj.checkout.errorList.length > 0 || jsonObj.checkout.warningList.length > 0 || jsonObj.syncErrors.errorList.length > 0){
		$.get("/public/templates/validationModal.html", function(data){
			var template = Handlebars.compile(data);
			var templateWithData = template(jsonObj);
			if (jsonObj.checkout.errorList.length === 0 && jsonObj.syncErrors.errorList.length === 0){
				modal.open({
					content: templateWithData,
					fullScreen: true,
					enableScroll: true
				}, showDepartureChecklist);
			}
			else {
				modal.open({
					content: templateWithData,
					hideSave: true,
					fullScreen: true
				});
			}
			jsonObj = null;
		});
	}
	else {
		showDepartureChecklist();
	}
	//TODO to be combined with Administration and Sync as Validate Trip.
	Rho.Log.info("End checkout", "inMotion");
}

function showDepartureChecklist(){
	Rho.Log.info("Start showDepartureChecklist()", "inMotion");
	var sql = "select tripCheckoutDateDevice from trip";
	var tripArray = userDatabase.executeSql(sql);
	if (tripArray.length > 0){
		if (tripArray[0].tripCheckoutDateDevice == "0001-01-01 00:00:00.0"){
			$.get("/public/templates/departureChecklist.html", function(data){
				modal.open({
					content: data
				}, function(){
					var errMsgs = [];
					if ($("#accessoriesDisposablesPrepared").attr("src") == "images/uhs/checkbox-unchecked.png"){
						errMsgs.push("Accessories and disposables prepared must be checked.\n" );
					}
					if ($("#vehicleWalkAround").attr("src")=="images/uhs/checkbox-unchecked.png"){
						errMsgs.push("Vehicle walk-around complete must be checked.\n" );
					}
					if ($("#truckLoadedSecure").attr("src")=="images/uhs/checkbox-unchecked.png"){
						errMsgs.push("Truck loaded and secure must be checked.\n" );
					}
					if (errMsgs.length !== 0) {
						alert('The following errors must be corrected before you can continue:\n\n' + errMsgs.join('\n'));
						return false;
					}
					else {
						saveCheckout();
					}
				});
				checkoutCheckBoxes();
			});
		}
		else {
			//close modal -- recheckout, no errors, not checklist, but modal open.
			modal.close();
			saveCheckout();
		}
	}
	Rho.Log.info("End showDepartureChecklist", "inMotion");
}

function checkoutCheckBoxes() {
	$("#accessoriesDisposablesPrepared").off("click");
	$("#accessoriesDisposablesPrepared").on("click", function(){
		if($("#accessoriesDisposablesPrepared").attr("src") == "images/uhs/checkbox-unchecked.png"){
			$("#accessoriesDisposablesPrepared").attr("src", "images/uhs/checkbox-checked.png");
		}
		else{
			$("#accessoriesDisposablesPrepared").attr("src", "images/uhs/checkbox-unchecked.png");
		}
	});
	$("#accessoriesDisposablesPreparedLabel").off("click");
	$("#accessoriesDisposablesPreparedLabel").on("click", function(){
		if($("#accessoriesDisposablesPrepared").attr("src") == "images/uhs/checkbox-unchecked.png"){
			$("#accessoriesDisposablesPrepared").attr("src", "images/uhs/checkbox-checked.png");
		}
		else{
			$("#accessoriesDisposablesPrepared").attr("src", "images/uhs/checkbox-unchecked.png");
		}
	});

	$("#vehicleWalkAround").off("click");
	$("#vehicleWalkAround").on("click", function(){
		if($("#vehicleWalkAround").attr("src") == "images/uhs/checkbox-unchecked.png"){
			$("#vehicleWalkAround").attr("src", "images/uhs/checkbox-checked.png");
		}
		else{
			$("#vehicleWalkAround").attr("src", "images/uhs/checkbox-unchecked.png");
		}
	});
	$("#vehicleWalkAroundLabel").off("click");
	$("#vehicleWalkAroundLabel").on("click", function(){
		if($("#vehicleWalkAround").attr("src") == "images/uhs/checkbox-unchecked.png"){
			$("#vehicleWalkAround").attr("src", "images/uhs/checkbox-checked.png");
		}
		else{
			$("#vehicleWalkAround").attr("src", "images/uhs/checkbox-unchecked.png");
		}
	});

	$("#truckLoadedSecure").off("click");
	$("#truckLoadedSecure").on("click", function(){
		if($("#truckLoadedSecure").attr("src") == "images/uhs/checkbox-unchecked.png"){
			$("#truckLoadedSecure").attr("src", "images/uhs/checkbox-checked.png");
		}
		else{
			$("#truckLoadedSecure").attr("src", "images/uhs/checkbox-unchecked.png");
		}
	});
	$("#truckLoadedSecureLabel").off("click");
	$("#truckLoadedSecureLabel").on("click", function(){
		if($("#truckLoadedSecure").attr("src") == "images/uhs/checkbox-unchecked.png"){
			$("#truckLoadedSecure").attr("src", "images/uhs/checkbox-checked.png");
		}
		else{
			$("#truckLoadedSecure").attr("src", "images/uhs/checkbox-unchecked.png");
		}
	});
}

function closeTrip(){
	Rho.Log.info("Start: closeTrip()", "inMotion");
	detectUHSRhoServer(loadCloseTrip);
	Rho.Log.info("End: closeTrip", "inMotion");
}

function loadCloseTrip() {
	Rho.Log.info("Start: loadCloseTrip()", "inMotion");
	if (confirm("You are about to close this trip. \n\n Continue?")) {
		hideMenu();
		progressBar.currentStep = 0;
		progressBar.loadingSteps = 24;
		progressBar.loadingModel = "";
		$.get("/public/templates/loading.html", closeProgress);
	}
	Rho.Log.info("End: loadCloseTrip", "inMotion");
}

function closeProgress(loadingData) {	
	Rho.Log.info("Start: closeProgress()", "inMotion");
	modal.open({
		content: loadingData,
		hideSave: true,
		hideClose: true
	});

	$("#loadingMessage").replaceWith("<div id=\"loadingMessage\">Uploading Data to inCommand</div>");
	updateProgress("Uploading application data");
	setModelNotifications(onCloseSyncNotify);
	removeAllSyncErrors();
	Rho.RhoConnectClient.doSync(false, "", false);
	Rho.Log.info("End: closeProgress", "inMotion");
}

function onCloseSyncNotify(params) {
	Rho.Log.info("Start: onCloseSyncNotify(" + JSON.stringify(params) + ")", "inMotion");

	if (params.status == "error"){
		processSyncErrors(params);
	}
	else if (params.status == "complete") {
		if (disconnectedError) {
			processDisconnectedError();
		}
		updateProgress("Upload Complete - Closing Trip");
		onCloseSyncComplete();
	}
	else if (params.status == "ok") {
		if (progressBar.loadingModel != params.source_name) {
			progressBar.loadingModel = params.source_name;
			updateProgress("Uploading application data");
		}
	}
	Rho.Log.info("End: onCloseSyncNotify", "inMotion");
}

function onCloseSyncComplete() {
	Rho.Log.info("Start: onCloseSyncComplete()", "inMotion");

	var jsonObj = getValidateJsonObject("closeTrip");
	if (jsonObj.closeTrip.errorList.length > 0 || jsonObj.closeTrip.warningList.length > 0 || jsonObj.syncErrors.errorList.length > 0){
		onFailedTripClose(jsonObj);
	}
	else {
		updateProgress("Upload Complete - Closing Trip");
		executeCloseTrip();
	}
	Rho.Log.info("End: onCloseSyncComplete", "inMotion");
}

function executeCloseTrip(loadingData) {
	Rho.Log.info("Start: executeCloseTrip()", "inMotion");
	if (loadingData) {
		modal.open({
			content: loadingData,
			hideSave: true,
			hideClose: true
		});
		$("#loadingMessage").replaceWith("<div id=\"loadingMessage\">Closing Trip</div>");
	}
	if (document.getElementById("loadingMessage")){
		updateProgress("Closing Trip");
	}
	
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
		var tripArray = userDatabase.executeSql(sql);
	
		if (tripArray.length > 0){
			var tripInstance = tripModel.make({
				"employeeId": tripArray[0].employeeId,
				"employeeName": tripArray[0].employeeName,
				"localTripId": tripArray[0].localTripId,
				"tripCheckoutDateDevice": tripArray[0].tripCheckoutDateDevice,
				"tripCreateDateDevice": tripArray[0].tripCreateDateDevice,
				"tripEndDateDevice": getCurrentTimestampString(),
				"tripId": tripArray[0].object,
				"tripStartDateDevice": tripArray[0].tripStartDateDevice,
				"vehicleId": tripArray[0].vehicleId,
				"object": tripArray[0].object
			});
			tripInstance.save();	//to save the tripEndDateDevice
			tripInstance.destroy();	//to remove from redis!!?!
			setModelsSync("none", "closetrip");
			setModelNotifications(onExecuteCloseTrip);
			Rho.RhoConnectClient.doSync(false, "", false);
		}
		else {
			alert("An error occurred while updating your trip to closed, please contact inMotion support for assistance.");
		}
	}
	catch(e) {
		alert("An error occurred while retrieving your trip for closure, please contact inMotion support for assistance.");
	}
	Rho.Log.info("End: executeCloseTrip", "inMotion");
}

function onExecuteCloseTrip(params){
	Rho.Log.info("Start: onExecuteCloseTrip(" + JSON.stringify(params) + ")", "inMotion");
	
	if (params.status == "error"){
		processSyncErrors(params);
		onFailedTripClose();
	}
	else if (params.status == "complete") {
		if (disconnectedError) {
			processDisconnectedError();
			onFailedTripClose();
		}
		else {
			updateProgress("Trip Closed (sending log)");
			try {
				applicationSendLog(onExecuteCloseTripAfterLogSent);
			}
			catch (e) {
				Rho.Log.info("Error: onExecuteCloseTrip(" + e.message + ")", "inMotion");
			}
		}
	}
	Rho.Log.info("End: onExecuteCloseTrip", "inMotion");
}

function onExecuteCloseTripAfterLogSent(params) {
	Rho.Log.info("Start: onExecuteCloseTripAfterLogSent()", "inMotion");
	var status = params.status;
	if (status == "ok"){
		updateProgress("Trip Closed (log sent)", 100);
		Rho.Log.cleanLogFile();
	}
	else {
		Rho.Log.info("Error: onExecuteCloseTripAfterLogSent (" + JSON.stringify(params) + ")", "inMotion");
	}
	userDatabase.close();
	Rho.RhoConnectClient.logout();
	Rho.Log.info("End: onExecuteCloseTripAfterLogSent", "inMotion");
	Rho.Application.quit();
}

function onFailedTripClose(jsonObj) {
	if (document.getElementById("loadingMessage")){
		modal.close();
	}
	setModelsSync();
	setModelNotifications();
	jsonObj = jsonObj ? jsonObj : getValidateJsonObject("closeTrip");
	$.get("/public/templates/validationModal.html", function(data){
		var template = Handlebars.compile(data);
		var templateWithData = template(jsonObj);
		jsonObj = null;
		modal.open({
			content: templateWithData,
			hideSave: true,
			fullScreen: true
		});
	});	
}

function collapseAllAccounts(accountId){
	Rho.Log.info("Start: collapseAllAccounts(" + accountId + ")", "inMotion");
	$(".accountLetterDetailContainer").hide();
	refreshFrameListScroll();
	Rho.Log.info("End: collapseAllAccounts", "inMotion");
}

function createTripDetailObject(tripDetail){
	Rho.Log.info("Start: createTripDetailObject()", "inMotion");

	var tripDetailObj = {};
	tripDetailObj.accountId = tripDetail.accountId;
	if (tripDetail.taskType == "D"){
		tripDetailObj.taskType = "Delivery";
	}
	else if (tripDetail.taskType == "P"){
		tripDetailObj.taskType = "Pickup";
	}
	else if (tripDetail.taskType == "F"){
		tripDetailObj.taskType = "Find";
	}
	else {
		tripDetailObj.taskType = "Unknown";
		Rho.Log.info("Running: createTripDetailObject(" + JSON.stringify(tripDetail) + ")", "inMotion");
	}

	if (tripDetail.taskReferenceId != 0){
		if (tripDetail.taskReferenceId.length > 9){
			tripDetailObj.dspTaskReferenceId = tripDetail.taskReferenceId.substr(0,9) + "...";
		}
		else {
			tripDetailObj.dspTaskReferenceId = tripDetail.taskReferenceId;
		}
	}
	else {
		if (tripDetail.localTaskReferenceId.length > 9){
			tripDetailObj.dspTaskReferenceId = tripDetail.localTaskReferenceId.substr(0,9) + "...";
		}
		else {
			tripDetailObj.dspTaskReferenceId = tripDetail.localTaskReferenceId;
		}
	}
	tripDetailObj.taskReferenceId = tripDetail.taskReferenceId;
	tripDetailObj.localTaskReferenceId = tripDetail.localTaskReferenceId;
	tripDetailObj.equipmentOrderCount = tripDetail.equipmentOrderCount;

	if (tripDetail.department.length > 14){
		tripDetailObj.department = tripDetail.department.substr(0,14) + "...";
	}
	else {
		tripDetailObj.department = tripDetail.department;
	}
	tripDetailObj.scanLevel = tripDetail.scanLevel;

	if (tripDetail.taskType == "D"){
		if (tripDetail.scanLevel == "1"){
			tripDetailObj.tripDetailImage = "images/uhs/checkedOut.png";
		}
		else {
			tripDetailObj.tripDetailImage = "images/uhs/blank.png";
		}
	}
	else if (tripDetail.taskType == "P"){
		tripDetailObj.tripDetailImage = "images/uhs/blank.png";
	}
	else if (tripDetail.taskType == "F"){
		tripDetailObj.tripDetailImage = "images/uhs/blank.png";
	}
	else {
		tripDetailObj.tripDetailImage = "images/uhs/blank.png";
	}
	Rho.Log.info("End: createTripDetailObject", "inMotion");
	return tripDetailObj;
}

function displayAccountTasks(accountList, byOption, menuOption){
	Rho.Log.info("Start: displayAccountTasks(" + byOption + "," + menuOption + ")", "inMotion");
	var accountObj;
	var accountObjList = [];
	var firstLetterCheck = "";
	for (var i=0; i < accountList.length; i++){
		//create account object
		accountObj = accountList[i];

		if (byOption == "name"){
			if (firstLetterCheck != accountList[i].accountName.substr(0,1)){
				accountObj.firstLetter = accountList[i].accountName.substr(0,1);
			}
			else {
				accountObj.firstLetter = "";
			}
			accountObj.accountLetterId = "accountLetter" + accountList[i].accountName.substr(0,1);
		}
		else {
			if (firstLetterCheck != accountList[i].accountId.substr(0,3)){
				accountObj.firstLetter = accountList[i].accountId.substr(0,3);
				}
				else {
					accountObj.firstLetter = "";
				}
				accountObj.accountLetterId = "accountLetter" + accountList[i].accountId.substr(0,3);
		}

		accountObjList.push(accountObj);

		if (byOption == "name"){
			firstLetterCheck = accountList[i].accountName.substr(0,1);
		}
		else {
			firstLetterCheck = accountList[i].accountId.substr(0,3);
		}
	}

	var jsonAccounts = {};
	jsonAccounts.accounts = accountObjList;

	//populate header template
	$.get("/public/templates/allAccountsHeader.html", function(data){
		$("#headerListContent").replaceWith(data);
	});

	//populate readAccountlist template
	$.get("/public/templates/allAccounts.html", function(data){
		var template = Handlebars.compile(data);
		$("#frameListContent").replaceWith(template(jsonAccounts));
		jsonAccounts = null;
		refreshFrameListScroll();

		$("#allAccountsTitle").html(menuOption);
		$(".accountLetter").off("click");
		$(".accountLetter").on("click", toggleAccount);
		if (menuOption == "All Accounts"){
			$("#sortByName").off("click");
			$("#sortByName").on("click", function(){
				readAllAccounts("name");
			});
			$("#sortByNumber").off("click");
			$("#sortByNumber").on("click", function(){
				readAllAccounts("number");
			});
		}
		else {
			$("#sortByName").off("click");
			$("#sortByName").on("click", function(){
				readHeldTransfers("name");
			});
			$("#sortByNumber").off("click");
			$("#sortByNumber").on("click", function(){
				readHeldTransfers("number");
			});
		}
		$(".accountLetterDetailImageContainer").off("click");
		$(".accountLetterDetailImageContainer").on("click", addTransfersForAccount);
		collapseAllAccounts();
		hideMenu();
	});
	Rho.Log.info("End: displayAccountTasks", "inMotion");
}

function displayUpdateTrip(){
	Rho.Log.info("Start: updateTrip()", "inMotion");
	var localTripId = $("#tripContainer").attr("data-localTripId");

	//set sql parameter array
	var sqlExpression = [];
	sqlExpression[0] = localTripId;

	var sql = "select t.employeeId, ";
	sql += "e.employeeName, ";
	sql += "case when tripCheckoutDateDevice = '0001-01-01 00:00:00.0' then tripCheckoutDateDevice else datetime(tripCheckoutDateDevice, 'localTime') end as dspTripCheckoutDateDevice, ";
	sql += "tripCheckoutDateDevice, ";
	sql += "case when tripCreateDateDevice = '0001-01-01 00:00:00.0' then tripCreateDateDevice else datetime(tripCreateDateDevice, 'localTime') end as dspTripCreateDateDevice, ";
	sql += "tripCreateDateDevice, ";
	sql += "case when tripEndDateDevice = '0001-01-01 00:00:00.0' then tripEndDateDevice else datetime(tripEndDateDevice, 'localTime') end as dspTripEndDateDevice, ";
	sql += "tripEndDateDevice, ";
	sql += "case when tripStartDateDevice = '0001-01-01 00:00:00.0' then tripStartDateDevice else datetime(tripStartDateDevice, 'localTime') end as dspTripStartDateDevice, ";
	sql += "tripStartDateDevice, ";
	sql += "tripId, ";
	sql += "localTripId, ";
	sql += "vehicleId, ";
	sql += "t.object ";
	sql += "from trip t, employee e ";
	sql += "where localTripId = ?";
	var trip = userDatabase.executeSql(sql, sqlExpression);

	var tripObj = trip[0];
	if (trip[0].tripId != 0){
		tripObj.dspTripId = trip[0].tripId;
	}
	else {
		tripObj.dspTripId = trip[0].object;
	}
	if (trip[0].tripCheckoutDateDevice != "0001-01-01 00:00:00.0"){
		tripObj.status = "In Transit";
	}
	else if (trip[0].tripEndDateDevice != "0001-01-01 00:00:00.0"){
		tripObj.status = "Closed";
	}
	else if (trip[0].tripCreateDateDevice != "0001-01-01 00:00:00.0"){
		tripObj.status = "Loading Vehicle";
	}
	else {
		tripObj.status = "Not Created";
	}
	sql = "SELECT client_id FROM client_info";
	trip = userDatabase.executeSql(sql);
	if (trip.length > 0) {
		tripObj.client_id = trip[0].client_id;
	}
	else {
		tripObj.client_id = "Unknown client";
	}
	tripObj.version = Rho.Application.version;
	
	$.get("/public/templates/editTrip.html", function(data){
		var template = Handlebars.compile(data);
		var templateWithData = template(tripObj);
		modal.open({
			content: templateWithData
		}, updateTrip);
		enableScanner();
		tripObj = null;
	});
	Rho.Log.info("End: updateTrip", "inMotion");
}

function readAllAccounts(byOption){
	Rho.Log.info("Start: readAllAccounts(" + byOption + ")", "inMotion");
	var sortField = [];
	if (byOption == "name"){
		sortField = "accountName";
	}
	else {
		sortField = "accountId";
	}

	var sql = "select a.accountId, ";
	sql += "a.accountName, ";
	sql += "a.addressLine1, ";
	sql += "a.addressLine2, ";
	sql += "a.city, ";
	sql += "a.state, ";
	sql += "a.zip, ";
	sql += "case when th.taskCount is null then 0 else th.taskCount end as taskCount ";
	sql += "from Account a ";
	sql += "left outer join ( ";
	sql += "select accountId, ";
	sql += "count(*) as taskCount ";
	sql += "from TransferHeader ";
	sql += "where status = 'H' ";
	sql += "group by accountId) th ";
	sql += "on a.accountId = th.accountId ";
	sql += "order by a." + sortField + " asc";
	var accountList = userDatabase.executeSql(sql);
	displayAccountTasks(accountList, byOption, "All Accounts");
	Rho.Log.info("End: readAllAccounts", "inMotion");
}

function readHeldTransfers(byOption){
	Rho.Log.info("Start: readHeldTransfers(" + byOption + ")", "inMotion");
	var sortField = [];
	if (byOption == "name"){
		sortField = "accountName";
	}
	else {
		sortField = "accountId";
	}

	var sql = "SELECT a.accountId, ";
	sql += "a.accountName, ";
	sql += "a.addressLine1, ";
	sql += "a.addressLine2, ";
	sql += "a.city, ";
	sql += "a.state, ";
	sql += "a.zip, ";
	sql += "count(*) as taskCount ";
	sql += "from TransferHeader th ";
	sql += "inner join Account a ";
	sql += "on th.accountId = a.accountId ";
	sql += "where status = 'H' ";
	sql += "group by a.accountId, ";
	sql += "a.accountName, ";
	sql += "a.addressLine1, ";
	sql += "a.addressLine2, ";
	sql += "a.city, ";
	sql += "a.state, ";
	sql += "a.zip ";
	sql += "order by a." + sortField + " asc";

	var accountList = userDatabase.executeSql(sql);
	displayAccountTasks(accountList, byOption, "Held Transfers");
	Rho.Log.info("End: readHeldTransfers", "inMotion");
}

function readTrip(){
	Rho.Log.info("Start: readTrip()", "inMotion");
	var sql = "select employeeId, ";
	sql += "employeeName, ";
	sql += "employeeInitials, ";
	sql += "shortName, ";
	sql += "email ";
	sql += "from Employee ";

	var employeeArray = userDatabase.executeSql(sql);
	var currentEmployeeId = 99999;
	var currentEmployeeInitials = "ISD";
	var currentEmployeeShortName = "ISDEV01";
	var currentEmployeeName = "IS Development";
	if (employeeArray.length > 0){
		currentEmployeeId = employeeArray[0].employeeId;
		currentEmployeeInitials = employeeArray[0].employeeInitials;
		currentEmployeeShortName = employeeArray[0].shortName;
		currentEmployeeName = employeeArray[0].employeeName;
	}

	sql = "select t.employeeId, ";
	sql += "e.employeeName, ";
	sql += "tripCheckoutDateDevice, ";
	sql += "case when tripCreateDateDevice = '0001-01-01 00:00:00.0' then tripCreateDateDevice else datetime(tripCreateDateDevice, 'localTime') end as dspTripCreateDateDevice, ";
	sql += "tripCreateDateDevice, ";
	sql += "tripEndDateDevice, ";
	sql += "tripStartDateDevice, ";
	sql += "tripId, ";
	sql += "localTripId, ";
	sql += "vehicleId, ";
	sql += "t.object ";
	sql += "from trip t, employee e ";

	var tripList = userDatabase.executeSql(sql);
	if (tripList.length > 0){
		var obj = tripList[0];
		if (obj.tripId != 0){
			obj.dspTripId = obj.tripId;
		}
		else {
			obj.dspTripId = obj.object;
		}
		if (obj.tripEndDateDevice != "0001-01-01 00:00:00.0"){
			obj.status = "Closed";
		}
		else if (obj.tripCheckoutDateDevice != "0001-01-01 00:00:00.0"){
			obj.status = "In Transit";
		}
		else if (obj.tripCreateDateDevice != "0001-01-01 00:00:00.0"){
			obj.status = "Loading Vehicle";
		}
		else {
			obj.status = "Not Created";
		}
		obj.currentEmployeeId = currentEmployeeId;
		obj.currentEmployeeInitials = currentEmployeeInitials;
		obj.currentEmployeeShortName = currentEmployeeShortName;

		$.get("/public/templates/readTrip.html", function(data){
			var template = Handlebars.compile(data);
			$("#headerSideContent").replaceWith(template(obj));
			$( "#tripImageContainer" ).on( "click", function() {
				showMenu("left", "trip");
			});
			obj = null;
			if (isFullyLoaded) {
				getValidateJsonObject();
			}
			else {
				$("#syncMessage").text("- Loading data");
			}
			if (isNewTrip) {
				isNewTrip = false;
				readHeldTransfers('name');
			}
			else {
				readTripDetail();
			}
		});
	}
	Rho.Log.info("End: readTrip", "inMotion");
}

function readTripDetail(){
	Rho.Log.info("Start: readTripDetail()", "inMotion");

	var localTripId = $("#tripContainer").attr("data-localTripId");
	var sqlExpression = [];
	sqlExpression[0] = localTripId;

	var sql = "SELECT  td.accountId as accountId, ";
	sql += "td.taskReferenceId as taskReferenceId, ";
	sql += "td.localTaskReferenceId as localTaskReferenceId, ";
	sql += "td.taskType as taskType, ";
	sql += "td.scanLevel as scanLevel, ";
	sql += "case when a.accountName is null then 'Unknown Account' else a.accountName end as accountName, ";
	sql += "case when eo.equipmentOrderCount is null then 0 else eo.equipmentOrderCount end as equipmentOrderCount, ";
	sql += "th.status as status, ";
	sql += "th.department as department ";
	sql += "FROM TripDetail td ";
	sql += "left outer join Account a ";
	sql += "on td.accountId = a.accountId ";
	sql += "left outer join TransferHeader th ";
	sql += "on td.localTaskReferenceId = th.localTransferNumber ";
	sql += "left outer join ( ";
	sql += "select sum(quantityOrdered) as equipmentOrderCount, localTransferNumber ";
	sql += "from transferEquipmentOrder ";
	sql += "group by localTransferNumber ";
	sql += ") eo ";
	sql += "on td.localTaskReferenceId = eo.localTransferNumber ";
	sql += "where td.localTripId = ? ";
	sql += "union ";
	sql += "select td.accountId, ";
	sql += "td.taskReferenceId, ";
	sql += "td.localTaskReferenceId, ";
	sql += "td.taskType, ";
	sql += "td.scanLevel, ";
	sql += "case when a.accountName is null then 'Unknown Account' else a.accountName end as accountName, ";
	sql += "0, ";
	sql += "th.status, ";
	sql += "th.department ";
	sql += "FROM TripDetailTemporary td ";
	sql += "left outer join Account a ";
	sql += "on td.accountId = a.accountId ";
	sql += "left outer join TransferHeader th ";
	sql += "on td.localTaskReferenceId = th.localTransferNumber ";
	sql += "order by case when a.accountName is null then 'Unknown Account' else a.accountName end";
	var tripDetailList = userDatabase.executeSql(sql, sqlExpression);

	var accountObj;
	var accountObjList = [];
	var tripDetailListObj = [];
	var accountIdCheck = 0;
	var recordCount = 0;
	var taskCount = 0;
	var tripDetailObj;

	for (var i=0; i < tripDetailList.length; i++){
		if (!((tripDetailList[i].status == "C") || (tripDetailList[i].status == "" && (!(tripDetailList[i].taskType == "X" || tripDetailList[i].taskType == "F"))))) {
			/* TODO
				Do completed transfers appear in the tripDetail List?
					ie: tranfers after signature, pickup transfers created during refusal process
			*/
			if (tripDetailList[i].accountId != accountIdCheck){
				//add tripDetailListObj to previous account and then add accountObj to accountObjList
				if (recordCount !== 0){
					accountObj.taskCount = taskCount;
					accountObj.tripDetails = tripDetailListObj;
					accountObjList.push(accountObj);
					tripDetailListObj = [];
				}

				//create new account object
				accountObj = {};
				if (tripDetailList[i].accountName.length > 21){
					accountObj.accountName = tripDetailList[i].accountName.substr(0,21) + "...";
				}
				else {
					accountObj.accountName = tripDetailList[i].accountName;
				}
				accountObj.accountId = tripDetailList[i].accountId;
				taskCount = 0;

				if (tripDetailList[i].taskType != "X"){
					tripDetailObj = createTripDetailObject(tripDetailList[i]);
					tripDetailListObj.push(tripDetailObj);
					taskCount ++;
				}
			}
			else {
				if (tripDetailList[i].taskType != "X"){
					tripDetailObj = createTripDetailObject(tripDetailList[i]);
					tripDetailListObj.push(tripDetailObj);
					taskCount ++;
				}
			}
			accountIdCheck = tripDetailList[i].accountId;
			recordCount ++;
		}
		else {
			Rho.Log.info("Run: readTripDetail(" + JSON.stringify(tripDetailList[i]) + ")", "inMotion");
		}
	}

	if (accountObj){
		//create last account obj
		accountObj.taskCount = taskCount;
		accountObj.tripDetails = tripDetailListObj;
		accountObjList.push(accountObj);
	}

	var jsonAccounts = {};
	jsonAccounts.accounts = accountObjList;

	$.get("/public/templates/readTripDetail.html", function(data){
		var template = Handlebars.compile(data);
		$("#frameSideContent").replaceWith(template(jsonAccounts));
		refreshFrameSideScroll();

		$(".taskTextContainer").off("click");
		$(".taskTextContainer").on("click", function() {
			var localTaskReferenceId = $(this).attr("data-localTaskReferenceId");
			var taskType = $(this).attr("data-taskType");
			var accountId = $(this).attr("data-accountId");
			var id = taskType + "~" + localTaskReferenceId + "~" + accountId;
		    readTask(id);
		});

		$(".accountTextContainer").off("click");
		$(".accountTextContainer").on("click", toggleTripDetailAccount);
		$(".accountImageContainer").off("click");
		$(".accountImageContainer").on("click", function() {
			var id = $(this).attr("data-accountId");
			showMenu("left", "account", id);
		});
		enableScanner();
		jsonAccounts = null;
	});
	Rho.Log.info("End: readTripDetail", "inMotion");
}

function saveCheckout(){
	Rho.Log.info("Start: saveCheckout()", "inMotion");
	//TODO call sync to update syncErrorTable. Task can be moved to next step as long as no errors exist

	//wrap in try catch with commit and rollback
	userDatabase.startTransaction();
	try {
		var currentTimestamp = getCurrentTimestampString();

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
		var tripArray = userDatabase.executeSql(sql);

		if (tripArray.length > 0){
			if (tripArray[0].tripCheckoutDateDevice == '0001-01-01 00:00:00.0'){
				var tripInstance = tripModel.make({
					"employeeId": tripArray[0].employeeId,
					"employeeName": tripArray[0].employeeName,
					"localTripId": tripArray[0].localTripId,
					"tripCheckoutDateDevice": currentTimestamp,
					"tripCreateDateDevice": tripArray[0].tripCreateDateDevice,
					"tripEndDateDevice": tripArray[0].tripEndDateDevice,
					"tripId": tripArray[0].tripId,
					"tripStartDateDevice": currentTimestamp,
					"vehicleId": tripArray[0].vehicleId,
					"object": tripArray[0].object
				});

				tripInstance.save();
			}
		}

		//update tripDetail delivery records with checkoutFlag. CheckoutFlag will be used to enable the correct scannerCallback method.
		var localTripId = $("#tripContainer").attr("data-localTripId");
		var tripId = $("#tripContainer").attr("data-tripId");
		var currentEmployeeId = $("#tripContainer").attr("data-currentEmployeeId");

		var sqlExpression = [];
		sqlExpression[0] = localTripId;

		sql = "select td.accountId, ";
		sql += "td.employeeId, ";
		sql += "td.localTaskReferenceId, ";
		sql += "td.localTripDetailId, ";
		sql += "td.localTripId, ";
		sql += "td.taskReferenceId, ";
		sql += "td.taskType, ";
		sql += "td.tripDetailId, ";
		sql += "td.tripId, ";
		sql += "td.scanLevel, ";
		sql += "td.object, ";
		sql += "th.swapOutFlag ";
		sql += "from TripDetail td ";
		sql += "left outer join TransferHeader th ";
		sql += "on td.localTaskReferenceId = th.localTransferNumber ";
		sql += "where localTripId = ? ";
		sql += "and taskType = 'D' ";
		sql += "and scanLevel = 0 ";
		var tripDetailArray = userDatabase.executeSql(sql, sqlExpression);

		for (var i=0; i < tripDetailArray.length; i++){

			var tripDetailInstance = tripDetailModel.make({
				"accountId": tripDetailArray[i].accountId,
				"employeeId": tripDetailArray[i].employeeId,
				"localTaskReferenceId": tripDetailArray[i].localTaskReferenceId,

				"localTripId": tripDetailArray[i].localTripId,
				"taskReferenceId": tripDetailArray[i].taskReferenceId,
				"taskType": tripDetailArray[i].taskType,
				"tripDetailId": tripDetailArray[i].tripDetailId,
				"tripId": tripDetailArray[i].tripId,
				"scanLevel": 1,
				"object": tripDetailArray[i].object
			});

			tripDetailInstance.save();

			//TODO if swapout flag is Y then create pickup, create order lines for each prefix quantity
			if (tripDetailArray[i].swapOutFlag == "Y"){

				//TODO check to see if swapout pickup has already been created
				sqlExpression = [];
				sqlExpression[0] = tripDetailArray[i].localTaskReferenceId;
				sql = "SELECT * ";
				sql += "FROM TransferHeader th ";
				sql += "where localSwapoutNumber = ?";
				var pickupArray = userDatabase.executeSql(sql, sqlExpression);

				if (pickupArray.length === 0){
					sqlExpression = [];
					sqlExpression[0] = tripDetailArray[i].localTaskReferenceId;

					sql = "SELECT th.accountId, ";
					sql += "th.localTransferNumber, ";
					sql += "th.transferNumber, ";
					sql += "th.orderDate, ";
					sql += "th.transferDate, ";
					sql += "td.prefix, ";
					sql += "count(*) as unitCount ";
					sql += "FROM TransferHeader th ";
					sql += "inner join TransferDetail td ";
					sql += "on th.localTransferNumber = td.localTransferNumber ";
					sql += "where th.localTransferNumber = ? ";
					sql += "group by th.accountId, ";
					sql += "th.localTransferNumber, ";
					sql += "th.transferNumber, ";
					sql += "th.orderDate, ";
					sql += "th.transferDate, ";
					sql += "td.prefix ";
					var resultArray = userDatabase.executeSql(sql, sqlExpression);
					var transferHeaderInstance;

					for (var j=0; j < resultArray.length; j++){
						if (j === 0){
							//create pickup header
							//var orderDate = new Date(resultArray[j].orderDate);
							var d = resultArray[j].transferDate;
							var orderDate = new Date(d.substring(0,4), (d.substring(5,7) - 1), d.substring(8,10), d.substring(11,13), d.substring(14,16), d.substring(17,19), d.substring(20, 27));
							var adjOrderDate = orderDate;
							adjOrderDate.setDate(adjOrderDate.getDate() - 1);
							var adjOrderDateString = adjOrderDate.getFullYear() + "-" + formatNumberLength((adjOrderDate.getMonth() + 1),2) + "-" + formatNumberLength(adjOrderDate.getDate(),2) + " " + formatNumberLength(adjOrderDate.getHours(),2) + ":" + formatNumberLength(adjOrderDate.getMinutes(),2) + ":" + formatNumberLength(adjOrderDate.getSeconds(),2) + "." + adjOrderDate.getMilliseconds();

							transferHeaderInstance = transferHeaderModel.create({
								"accountId": resultArray[j].accountId,
								"comment": "Swapout pickup for Transfer " + resultArray[j].transferNumber,
								"cstat": "",
								"deliveredByEmployeeId": 0,
								"deliveryDate": "0001-01-01 00:00:00.0",
								"department": "",
								"localSwapOutNumber": resultArray[j].localTransferNumber,
								"localTransferNumber": 0,
								"localUhsPatientId": 0,
								"orderBy": "",
								"orderDate": adjOrderDateString,
								"postedByEmployeeId": currentEmployeeId,
								"purchaseOrder": "",
								"status": "H",
								"swapOutFlag": "",
								"swapOutNumber": resultArray[j].transferNumber,
								"telephoneNumber": 0,
								"transferDate": resultArray[j].transferDate,
								"transferNumber": 0,
								"transferType": "P",
								"transferredByEmployeeId": currentEmployeeId,
								"uhsPatientId": 0,
								"employeeId": currentEmployeeId
							});

							transferHeaderInstance.updateAttributes({
								"localTransferNumber": transferHeaderInstance.get("object")
							});

							//add pickup to TripDetail
							tripDetailInstance = tripDetailModel.create({
								"accountId": resultArray[j].accountId,
								"employeeId": currentEmployeeId,
								"localTaskReferenceId": transferHeaderInstance.get("localTransferNumber"),
								"localTripDetailId": 0,
								"localTripId": localTripId,
								"taskReferenceId": transferHeaderInstance.get("transferNumber"),
								"taskType": transferHeaderInstance.get("transferType"),
								"tripDetailId": 0,
								"tripId": tripId,
								"scanLevel": 0
							});

							tripDetailInstance.updateAttributes({
								"localTripDetailId": tripDetailInstance.get("object")
							});
						}

						//create transferEquipmentOrder
						var transferEquipmentOrderInstance = transferEquipmentOrderModel.create({
							"department": "",
							"description": "",
							"employeeId": currentEmployeeId,
							"equipmentOrderId": "",
							"localEquipmentOrderId": "",
							"localTransferNumber": transferHeaderInstance.get("localTransferNumber"),
							"model": "",
							"prefix": resultArray[j].prefix,
							"purchaseOrder": "",
							"quantityOrdered": resultArray[j].unitCount,
							"transferNumber": transferHeaderInstance.get("transferNumber"),
							"vendor": ""
						});

						transferEquipmentOrderInstance.updateAttributes({
							"localEquipmentOrderId": transferEquipmentOrderInstance.get("object")
						});
					}
				}
			}
		}
		//commit transactions
		userDatabase.commitTransaction();
		readTrip();
		$("#headerListContent").empty();
		$("#frameListContent").empty();
	}
	catch(e){
		Rho.Log.info("Error: saveCheckout rollback = " + e, "inMotion");
		userDatabase.rollbackTransaction();
		alert ("Unable to saveCheckout");
		return false;
	}
	finally {
		Rho.Log.info("End: saveCheckout", "inMotion");
	}
}

function toggleAccount(){
	Rho.Log.info("Start: toggleAccount()", "inMotion");
	var id = $(this).attr("id");
	var isVisible = $(".accountLetterDetailContainer[data-accountLetterId=" + id + "]").first().is(":visible");
	collapseAllAccounts();
	if (!isVisible) {
		$(".accountLetterDetailContainer[data-accountLetterId=" + id + "]").each(function(){
			if ($(this).is(":visible")){
				$(this).hide();
			}
			else {
				$(this).show();
			}
		});
		refreshFrameListScroll();
		//frameListScroll.scrollToElement(this);
		frameListScroll.scrollTo(0, this.offsetTop, 500);
	}
	Rho.Log.info("End: toggleAccount", "inMotion");
}

function toggleTripDetailAccount(){
	Rho.Log.info("Start: toggleTripDetailAccount()", "inMotion");
	var id = $(this).attr("data-accountId");
	toggleTasks(id);
	Rho.Log.info("End: toggleTripDetailAccount", "inMotion");
}

function updateTrip(){
	Rho.Log.info("Start: updateTrip()", "inMotion");

	var tripId = $("#tripId").val();
	var localTripId = $("#localTripId").val();
	var employeeId = $("#employeeId").val();
	var employeeName = $("#employeeName").val();
	var vehicleId = $("#vehicleId").val();
	var tripCreateDateDevice = $("#tripCreateDateDevice").val();
	var tripCheckoutDateDevice = $("#tripCheckoutDateDevice").val();
	var tripStartDateDevice = $("#tripStartDateDevice").val();
	var tripEndDateDevice = $("#tripEndDateDevice").val();
	var object = $("#object").val();

	var tripOrmInstance = tripModel.make({
		"tripId" : tripId,
		"localTripId" : localTripId,
		"employeeId" : employeeId,
		"employeeName" : employeeName,
		"vehicleId" : vehicleId,
		"tripCreateDateDevice" : tripCreateDateDevice,
		"tripCheckoutDateDevice" : tripCheckoutDateDevice,
		"tripStartDateDevice" : tripStartDateDevice,
		"tripEndDateDevice" : tripEndDateDevice,
		"object": object
	});
	tripOrmInstance.save();
	enableScanner();
	Rho.Log.info("End: updateTrip", "inMotion");
}

function validateTrip(){
	Rho.Log.info("Start: validateTrip()", "inMotion");

	//TODO List of possible errors
		//TODO Warnings
			//TODO Check for trip detail records with a taskType = X. Trip Detail records with taskType = X are created when an account was added to trip from viewAllAccounts but there were no held transfers. It is a placeholder so it will show in trip detail section.
			//TODO Missing items

		//TODO Errors returned from backend stored procedures
			//TODO Not patient ready
			//TODO Customer preferences

	//TODO display all errors. Possibly give details on how to fix either thru inMotion or manual correction in inCommand
	var jsonObj = getValidateJsonObject();
	$.get("/public/templates/validationHeader.html", function(data){
		$("#headerListContent").replaceWith(data);
	});
	$.get("/public/templates/validation.html", function(data){
		var template = Handlebars.compile(data);
		$("#frameListContent").replaceWith(template(jsonObj));
		jsonObj = null;
		refreshFrameListScroll();
	});
	hideMenu();
	Rho.Log.info("End: validateTrip", "inMotion");
}

function viewTableRecords(sourceName){
	Rho.Log.info("Start: viewTableRecords(" + sourceName + ")", "inMotion");

	var sql = "PRAGMA table_info(" + sourceName + ")";
	var tableArray = userDatabase.executeSql(sql);
	var columnArray = [];
	var i;
	var html = "<table id='" + sourceName + "'>";

	html += "<thead class='listHeader'>";
	html += "<tr>";

	var selectString = "select ";
	for (i = 0; i < tableArray.length; i++){
		var column = {};
		column.name = tableArray[i].name;
		column.type = tableArray[i].type;
		columnArray.push(column);

		var sortType = "string";
		if (tableArray[i].type == "integer" || tableArray[i].type == "float"){
			sortType = "number";
		}
		else if (tableArray[i].name.indexOf("date")!=-1){
			sortType = "date";
		}
		else{

		}
		html += "<th style=\"font-family: TahomaBoldLocal;\">";
		if (tableArray[i].name.indexOf("base64")!=-1){
			html += tableArray[i].name;
		}
		else {
			html += "<a href=\"javascript: sortTable('" + sourceName + "', " + i + ", '" + sortType + "');\">";
			html += tableArray[i].name;
			html += "</a>";
		}
		html += "</th>";
		selectString += tableArray[i].name + ", ";
	}
	html += "</tr>";
	html += "</thead>";
	selectString = selectString.substring(0, selectString.length - 2);

	sql = selectString + " ";
	sql += "from " + sourceName + " ";
	sql += "order by 1";
	var recordArray = userDatabase.executeSql(sql);

	html += "<tbody>";
	for (i = 0; i < recordArray.length; i++){
		var obj = recordArray[i];
		if ((i+1)%2 === 0){
			html += "<tr class='listEvenRow'>";
		}
		else {
			html += "<tr class='listOddRow'>";
		}

		for (var j=0; j < columnArray.length; j++){
			var attrName = columnArray[j].name;
			var attrValue = obj[attrName];
			if (attrName.indexOf("base64")!=-1){
				html += "<td><img src='data:image/jpeg;base64," + attrValue + "'></td>";
			}
			else {
				html += "<td>" + attrValue + "</td>";
			}
		}
		html += "</tr>";
	}
	html += "</tbody>";
	html += "</table>";

	var jsonObj = [];
	jsonObj.sourceName = sourceName;
	jsonObj.table = html;

	$.get("/public/templates/tableRecord.html", function(data){
		var template = Handlebars.compile(data);
		var templateWithData = template(jsonObj);
		
		modal.open({
			content: templateWithData,
			hideSave: true,
			enableScroll: true,
			fullScreen: true
		});
		jsonObj = null;

	});
	Rho.Log.info("End: viewTableRecords", "inMotion");
}