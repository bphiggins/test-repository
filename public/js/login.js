function onLogin() {
	Rho.Log.info("Start: onLogin()", "inMotion");
	$("#loginButtonConnect").attr("disabled", "disabled");
	modal.init();
	var userName = $("#loginFormUserName").val();
 	var password = $("#loginFormPassword").val();
 	deleteApplicationReset();
	setLoginUser(userName);
	setLogin(password);
 	var existingUser = Rho.RhoConnectClient.getUserName();

 	if (existingUser != userName && existingUser !== "") {
 		Rho.Log.info("New User on Device: " + userName + " (" + existingUser + ") - " + Rho.RhoConnectClient.isLoggedIn(), "inMotion");
 		resetUser();
 	}
	Rho.RhoConnectClient.login(userName, password, onInitialLogin);
	Rho.RhoConnectClient.setPageSize(5000);

	$.get("/public/templates/loading.html", function(loadingData){
		modal.open({
			content: loadingData,
			hideSave: true,
			hideClose: true
		});
		$("#modal").css("top", "-490px");
	});
	Rho.Log.info("End: onLogin", "inMotion");
}

function onInitialLogin(params) {
	Rho.Log.info("Start: onInitialLogin(" + JSON.stringify(params) + ")", "inMotion");
	
	if(params.error_code == "0") {
		Rho.Log.info("Logged In?: " + Rho.RhoConnectClient.isLoggedIn(), "inMotion");
		Rho.Application.setApplicationNotify(onApplicationNotify);
		
		$.get("/public/templates/pageStructure.html", function(data){
			$("#modal").css("top", "10px");
			$("#content").replaceWith(data);
			loadApplication();
		});
	}
	else {
		var withError = params.error_message ? params.error_message : "Unable to login at this time, please try again."; 
		$.get("/public/templates/login.html", function(){
			$("#loginError").html(withError);
			$("#loginButtonConnect").removeAttr('disabled');
			modal.close(false);
			deleteLogin();
			loadLogin();
			withError = null;
		});
	}
	Rho.Log.info("End: onInitialLogin", "inMotion");
}

function silentLogin() {
	Rho.Log.info("Start: silentLogin()", "inMotion");
	var loginAttempts = getLoginAttempts();

	if (loginAttempts < 4) {
		setLoginAttempts();
		var rhoClient = Rho.RhoConnectClient;
	 	var userName = rhoClient.getUserName();
		var password = getLogin();

		if (rhoClient.isLoggedIn()) {
			rhoClient.logout();
		}
		rhoClient.login(userName, password, onSilentLogin);
		rhoClient.setPageSize(5000);
	}
	else {
		stopRhoSync();
		$.get("/public/templates/login.html", function(data){
			$("#content").replaceWith(data);
			$("#loginError").html("Login failed. Check connectivity and try again. If unsuccessful contact IS Support.");
			$("#loginButtonConnect").removeAttr('disabled');
			modal.close(false);
			deleteLogin();
			loadLogin();
		});
	}
	Rho.Log.info("End: silentLogin", "inMotion");
}

function onSilentLogin(params) {
	Rho.Log.info("Start: onSilentLogin(" + JSON.stringify(params) + ")", "inMotion");

	if(params.error_code == "0") {
		silentLoadApplication();
	}
	else {
		stopRhoSync();
		var withError = params.error_message;
		$.get("/public/templates/login.html", function(){
			if (withError.length > 0) {
				$("#loginError").html(withError);
			}
			$("#loginButtonConnect").removeAttr('disabled');
			deleteLogin();
			loadLogin();
			withError = null;
		});
	}
	Rho.Log.info("End: onSilentLogin", "inMotion");
}

function resetUser() {
	Rho.Log.info("Start: resetUser()", "inMotion");
	
	if (userDatabase === undefined) {
		userDatabase = new Rho.Database(Rho.Application.databaseFilePath('user'), 'user');
	}

	try {
 		userDatabase.destroyTables({include: [], exclude: ["client_info"]});
 		userDatabase.close();
 	}
 	catch(e){
		Rho.Log.info("Error: resetUser(" + e.message + ")", "inMotion");
 	}
 	finally {
		userDatabase = new Rho.Database(Rho.Application.databaseFilePath('user'), 'user');
 		resetClientInfo();
		Rho.Log.info("Running: resetUser", "inMotion");
 	}
	Rho.Log.info("End: resetUser", "inMotion");
}

function resetUserScript() {
	Rho.Log.info("Start: resetUserScript()", "inMotion");
	try {
		setLogURI();
		Rho.Log.sendLogFile();
	}
	catch (e) {
		Rho.Log.info("Error: resetUserScript: " + e.message, "inMotion");
	}
	resetUser();
	silentLogin();
	Rho.Log.info("End: resetUserScript", "inMotion");
}

function applicationResetScript() {
	Rho.Log.info("Start: applicationResetScript()", "inMotion");
	var attempts = getApplicationReset();
	initialLoadData = {
			restartSync : true,
			sourceName : "",
			errorCode : "",
			loginErrorMessage : ""
	};
	if (attempts == 0) {
		//reset only client info reset flag
		resetClientInfo();
	}
	else if (attempts == 1) {
		//second time through -- try to leave employee, trip, account, and prefAcc
		dropModelTables();
	}
	else {
		//third+ time through -- reset everything
		resetUser();
	}
	setApplicationReset();
	detectUHSRhoServer(
		function(){
			resetModel("All");
		}
	);
	Rho.Log.info("End: applicationResetScript", "inMotion");
}

function resetClientInfo() {
	Rho.Log.info("Start: resetClientInfo()", "inMotion");
 	try {
		var sql = "UPDATE client_info SET reset=1";
		var sqlArray = userDatabase.executeSql(sql);
		userDatabase.close();
 	}
	catch(e){
		Rho.Log.info("Error: resetClientInfo(" + e.message + ")", "inMotion");
	}
	finally {
		userDatabase = new Rho.Database(Rho.Application.databaseFilePath('user'), 'user');
	}
	Rho.Log.info("End: resetClientInfo", "inMotion");
}

function dropModelTables() {
	Rho.Log.info("Start: dropModelTables()", "inMotion");
 	try {
		var sql;
		var sqlArray;
		var dropArray;
		sql = "SELECT name from sources where name not in ('Employee', 'Trip', 'Account', 'PreferredAccessory')";
		sqlArray = userDatabase.executeSql(sql);
		for (var i = 0; i < sqlArray.length; i++) {
			sql = "DROP TABLE " + sqlArray[i].name;
			dropArray = userDatabase.executeSql(sql);
		}
		userDatabase.close();
 	}
	catch(e){
		//nothing for now
	}
	finally {
		userDatabase = new Rho.Database(Rho.Application.databaseFilePath('user'), 'user');
		resetClientInfo();
	}
	Rho.Log.info("End: dropModelTables", "inMotion");
}

function resetModel(model) {
	Rho.Log.info("Start: resetModel(" + model + ")", "inMotion");
	try {
		var urlStr = Rho.RhoConnectClient.syncServer;
		urlStr += "/app/v1/Validate/resetmodel";
		var jsonObj = {};
		var models = [];
		var modelLabel = "";
		var continueOn = false;
		
		if (model == "All") {
			continueOn = true;
		}
		else {
			if (model == "TransferPatient") {
				modelLabel = "transfer and patient";
			}
			else {
				modelLabel = model.toLowerCase();
			}
			var msg = "You are about to retrieve " + modelLabel + " data from inCommand.\n\n";
			msg += "Choose OK to continue (please be patient as data is synchronized), otherwise choose Cancel.";
			continueOn = confirm(msg);
		}

		if (continueOn) {
			switch (model) {
				case "Transfer":
					models.push("TransferHeader");
					models.push("TransferEquipmentOrder");
					break;
				case "TransferPatient":
					models.push("TransferHeader");
					models.push("TransferEquipmentOrder");
					models.push("Patient");
					break;
				case "Patient":
					models.push("Patient");
					break;
				case "Account":
					models.push("Account");
					accountModel.setSync_type("incremental");
					accountModel.initModel();
					break;
				case "All":
					models.push("AccountContact");
					models.push("Account");
					models.push("DamagedItemDetail");
					models.push("DamagedItem");
					models.push("FindEquipment");
					models.push("Patient");
					models.push("PreferredAccessory");
					models.push("SignatureDetail");
					models.push("SignatureHeader");
					models.push("SignatureImage");
					models.push("SignatureSend");
					models.push("SurplusRetrievedAccessories");
					models.push("TransferComment");
					models.push("TransferDetail");
					models.push("TransferEquipmentOrder");
					models.push("TransferHeader");
					models.push("TransferredPrefixAccessories");
					models.push("TransferredUnitAccessories");
					models.push("TransferSwapout");
					models.push("TripDetail");
					accountModel.setSync_type("incremental");
					accountModel.initModel();
					preferredAccessoryModel.setSync_type("incremental");
					preferredAccessoryModel.initModel();
					break;
				default:
					models.push(model);
					break;
			}
			jsonObj.models = models;
			Rho.Network.post(
				{
					"url" : urlStr,
					"body" : jsonObj,
					"headers" : {
						"Content-Type": "application/json",
						"Cookie": getRhoSession()
					}
				},
				function(){
					if (model == "All") {
						continueResetRhoConnect();
					}
					else {
						Rho.RhoConnectClient.doSync(false, "", false);
					}
					model = null;
				}
			);
		}
	}
	catch (e) {
		Rho.Log.info("Error: resetModel(" + e.message + ")", "inMotion");
	}
	Rho.Log.info("End: resetModel", "inMotion");
}

function continueResetRhoConnect() {
	Rho.Log.info("Start: continueResetRhoConnect()", "inMotion");
	resetProgress("Reloading application data...");
	loadApplication(true);
	Rho.Log.info("End: continueResetRhoConnect", "inMotion");
}

function resetRhoConnectTrip(callBackFunction) {
	Rho.Log.info("Start: resetRhoConnectTrip()", "inMotion");
	var jsonObj = {};
	var models = [];
	var urlStr = Rho.RhoConnectClient.syncServer;
	urlStr += "/app/v1/Validate/resetmodel";
	models.push("Trip");
	jsonObj.models = models;
	
	Rho.Network.post({
		"url" : urlStr,
		"body" : jsonObj,
		"headers" : {
			"Content-Type": "application/json",
			"Cookie": getRhoSession()
		}
	}, callBackFunction);
	Rho.Log.info("End: resetRhoConnectTrip", "inMotion");
}

function setLogin(password) {
	sessionStorage.setItem("userPass", password);
}

function getLogin() {
	return sessionStorage.getItem("userPass");
}

function setLoginUser(username) {
	sessionStorage.setItem("userName", username);
}

function getLoginUser() {
	return sessionStorage.getItem("userName");
}

function setApplicationReset() {
	var attempts = getApplicationReset();
	if (attempts === 0) {
		sessionStorage.setItem("applicationReset", 1);
	}
	else {
		attempts++;
		sessionStorage.setItem("applicationReset", attempts);
	}
}

function getApplicationReset() {
	var attempts = sessionStorage.getItem("applicationReset");
	if (attempts === null) {
		return 0;
	}
	else {
		return parseInt(attempts);
	}
}

function deleteApplicationReset() {
	sessionStorage.removeItem("applicationReset");
}

function deleteLogin() {
	sessionStorage.removeItem("userPass");
	sessionStorage.removeItem("userName");
	sessionStorage.removeItem("loginAttempts");
	sessionStorage.removeItem("silentLoginAttempts");
	sessionStorage.removeItem("applicationReset");
}

function setLoginAttempts() {
	var attempts = getLoginAttempts();
	if (attempts === 0) {
		sessionStorage.setItem("loginAttempts", 1);
	}
	else {
		attempts++;
		sessionStorage.setItem("loginAttempts", attempts);
	}
}

function getLoginAttempts() {
	var attempts = sessionStorage.getItem("loginAttempts");
	if (attempts === null) {
		return 0;
	}
	else {
		return parseInt(attempts);
	}
}

function setSilentLoginAttempts() {
	var attempts = getSilentLoginAttempts();
	if (attempts === 0) {
		sessionStorage.setItem("silentLoginAttempts", 1);
	}
	else {
		attempts++;
		sessionStorage.setItem("silentLoginAttempts", attempts);
	}
}

function getSilentLoginAttempts() {
	var attempts = sessionStorage.getItem("silentLoginAttempts");
	if (attempts === null) {
		return 0;
	}
	else {
		return parseInt(attempts);
	}
}