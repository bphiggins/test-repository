function addDelivery(id){
	Rho.Log.info("Start: addDelivery(" + id + ")", "inMotion");
	var taskObj = {};
	taskObj.modalTitle = "Edit Delivery";
	taskObj.transferNumber = 0;
	taskObj.localTransferNumber = 0;
	taskObj.transferType = "D";
	taskObj.status = "H";
	taskObj.accountId = id;
	taskObj.orderDate = getCurrentTimestampString();
	taskObj.transferDate = "0001-01-01 00:00:00.0";
	taskObj.orderBy = "";
	taskObj.department = "";
	taskObj.comment = "";
	taskObj.telephoneNumber = 0;
	taskObj.deliveryDate = "0001-01-01 00:00:00.0";
	taskObj.purchaseOrder = "";
	taskObj.postedByEmployeeId = $("#tripContainer").attr("data-currentEmployeeId");
	taskObj.deliveredByEmployeeId = 0;
	taskObj.transferredByEmployeeId = 0;
	taskObj.uhsPatientId = 0;
	taskObj.localUhsPatientId = 0;
	taskObj.cstat = "";
	taskObj.swapOutFlag = "";
	taskObj.swapOutNumber = 0;
	taskObj.localSwapOutNumber = 0;
	displayTaskModal(taskObj);
	Rho.Log.info("End: addDelivery", "inMotion");
}

function addFind(id){
	Rho.Log.info("Start: addFind(" + id + ")", "inMotion");

	//delete any existing tripDetail records with taskType = X
	var sqlExpression = [];
	sqlExpression[0] = id;

	var sql = "select accountId, ";
	sql += "employeeId, ";
	sql += "localTaskReferenceId, ";
	sql += "localTripDetailId, ";
	sql += "localTripId, ";
	sql += "scanLevel, ";
	sql += "taskReferenceId, ";
	sql += "taskType, ";
	sql += "tripDetailId, ";
	sql += "tripId, ";
	sql += "object ";
	sql += "from TripDetailTemporary ";
	sql += "where taskType = 'X' ";
	sql += "and accountId = ?";
	var tripDetailArray = userDatabase.executeSql(sql, sqlExpression);

	for (var i=0; i < tripDetailArray.length; i++){
		var tripDetailTemporaryInstance = tripDetailTemporaryModel.make({
			"accountId": tripDetailArray[i].accountId,
			"employeeId": tripDetailArray[i].employeeId,
			"localTaskReferenceId": tripDetailArray[i].localTaskReferenceId,
			"localTripDetailId": tripDetailArray[i].localTripDetailId,
			"localTripId": tripDetailArray[i].localTripId,
			"scanLevel": tripDetailArray[i].scanLevel,
			"taskReferenceId": tripDetailArray[i].taskReferenceId,
			"taskType": tripDetailArray[i].taskType,
			"tripDetailId": tripDetailArray[i].tripDetailId,
			"tripId": tripDetailArray[i].tripId,
			"object": tripDetailArray[i].object
		});

		tripDetailTemporaryInstance.destroy();
	}

	//check to see if findEquipment records exist for this account
	sqlExpression = [];
	sqlExpression[0] = id;

	sql = "SELECT accountId, ";
	sql += "cstat, ";
	sql += "description, ";
	sql += "prefix, ";
	sql += "unit, ";
	sql += "object ";
	sql += "from FindEquipment ";
	sql += "where accountId = ? ";
	var findEquipmentArray = userDatabase.executeSql(sql, sqlExpression);

	if (findEquipmentArray.length > 0){
		//check to see if a find task already exists
		sqlExpression = [];
		sqlExpression[0] = id;

		sql = "SELECT accountId, ";
		sql += "localTaskReferenceId, ";
		sql += "localTripDetailId, ";
		sql += "localTripId, ";
		sql += "taskReferenceId, ";
		sql += "taskType, ";
		sql += "tripDetailId, ";
		sql += "tripId, ";
		sql += "object ";
		sql += "from tripDetail ";
		sql += "where accountId = ? ";
		sql += "and taskType = 'F' ";
		tripDetailArray = userDatabase.executeSql(sql, sqlExpression);

		if (tripDetailArray.length === 0){
			var localTripId = $("#tripContainer").attr("data-localTripId");
			var tripId = $("#tripContainer").attr("data-tripId");
			var currentEmployeeId = $("#tripContainer").attr("data-currentEmployeeId");
			var currentTimestamp = getCurrentTimestampString();
			var tripDetailInstance = tripDetailModel.create({
				"accountId": id,
				"localTaskReferenceId": currentTimestamp.substr(0,4) + currentTimestamp.substr(5,2) + currentTimestamp.substr(8,2),
				"localTripDetailId": 0,
				"localTripId": localTripId,
				"taskReferenceId": 0,
				"taskType": "F",
				"tripDetailId": 0,
				"tripId": tripId,
				"employeeId": currentEmployeeId,
				"scanLevel": 0
			});

			tripDetailInstance.updateAttributes({
				"localTripDetailId": tripDetailInstance.get("object")
			});
			readTripDetail();
		}
		else {
			alert("A find task already exists for this account.");
		}
	}
	else {
		alert("There is no equipment that needs to be found.");
	}

	hideMenu();
	Rho.Log.info("End: addFind", "inMotion");
}

function addPickup(id){
	Rho.Log.info("Start: addPickup(" + id + ")", "inMotion");
	var taskObj = {};
	taskObj.modalTitle = "Edit Pickup";
	taskObj.transferNumber = 0;
	taskObj.localTransferNumber = 0;
	taskObj.transferType = "P";
	taskObj.status = "H";
	taskObj.accountId = id;
	taskObj.orderDate = getCurrentTimestampString();
	taskObj.transferDate = "0001-01-01 00:00:00.0";
	taskObj.orderBy = "";
	taskObj.department = "";
	taskObj.comment = "";
	taskObj.telephoneNumber = 0;
	taskObj.deliveryDate = "0001-01-01 00:00:00.0";
	taskObj.purchaseOrder = "";
	taskObj.postedByEmployeeId = $("#tripContainer").attr("data-currentEmployeeId");
	taskObj.deliveredByEmployeeId = 0;
	taskObj.transferredByEmployeeId = 0;
	taskObj.uhsPatientId = 0;
	taskObj.localUhsPatientId = 0;
	taskObj.cstat = "";
	taskObj.swapOutFlag = "";
	taskObj.swapOutNumber = 0;
	taskObj.localSwapOutNumber = 0;

	displayTaskModal(taskObj);
	Rho.Log.info("End: addPickup", "inMotion");
}

function displaySignatureValidationModal(params){
	Rho.Log.info("Start: displaySignatureValidationModal()", "inMotion");
	var localTransferNumber = params.data.localTransferNumber;
	var jsonObj = params.data.jsonObj;
	$.get("/public/templates/validationModal.html", function(data) {
		var template = Handlebars.compile(data);
		var templateWithData = template(jsonObj);

		if (jsonObj.captureSignature.errorList.length === 0){
			modal.open({
				content: templateWithData,
				fullScreen: true,
				enableScroll: true
			}, 
			function(){
				//TODO change source image
				var taskImage = $(".taskImage[data-localTaskReferenceId='" + localTransferNumber + "']");
				taskImage.attr("src", "images/uhs/checkbox-checked.png");
				taskImage.off("click");
				taskImage.on("click", {"localTransferNumber": localTransferNumber}, toggleSignatureCheck);
			});
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

	Rho.Log.info("End: displaySignatureValidationModal", "inMotion");
}

function displayTaskModal(taskObj){
	Rho.Log.info("Start: displayTaskModal(" + JSON.stringify(taskObj) + ")", "inMotion");
	$.get("/public/templates/editTask.html", function(data){
		var template = Handlebars.compile(data);
		var templateWithData = template(taskObj);

		modal.open({
			content: templateWithData
		}, function(){
			var errMsgs = [];
			var telephoneNumber = $("#telephoneNumber").val();
			if(telephoneNumber.length === 0 || isNaN(telephoneNumber)){
				errMsgs.push( "Telephone is missing or not a valid number. \n" );
			}
			else if (telephoneNumber < 0 || telephoneNumber > 9999999999){
				errMsgs.push( "Telephone is not in the range 0 to 9999999999. \n" );
			}
			if (errMsgs.length !== 0) {
				alert('The following errors must be corrected before you can continue:\n\n' + errMsgs.join('\n'));
				return false;
			}
			else {
				saveTask();
			}
		});
		if (taskObj.transferType == 'P'){
			$('#swapOutFlag').attr("disabled", true);
		}
		taskObj = null;
	});
	Rho.Log.info("End: displayTaskModal", "inMotion");
}

function readFacilityDetail(id){
	Rho.Log.info("Start: readFacilityDetail(" + id + ")", "inMotion");
	var sqlExpression = [];
	sqlExpression[0] = id;

	var sql = "select accountId, ";
	sql += "accountName, ";
	sql += "addressLine1, ";
	sql += "addressLine2, ";
	sql += "city, ";
	sql += "state, ";
	sql += "zip, ";
	sql += "standingPurchaseOrder, ";
	sql += "districtId ";
	sql += "from Account ";
	sql += "where accountId = ?";
	var account = userDatabase.executeSql(sql, sqlExpression);
	var jsonObj = account[0];

	//populate template
	$.get("/public/templates/facilityDetail.html", function(data){
		var template = Handlebars.compile(data);
		var templateWithData = template(jsonObj);
		modal.open({
			content: templateWithData,
			hideSave: true
		});
		jsonObj = null;
	});
	Rho.Log.info("End: readFacilityDetail", "inMotion");
}

function removeAccount(id){
	Rho.Log.info("Start: removeAccount(" + id + ")", "inMotion");
	//TODO need to delete accessories if they have been created
	var msg = confirm("You are about to remove this account and all its related records from this trip. \n\n Continue?");
	if (msg === true){
		//need to wrap in Rho database api transaction with commit and rollback
		userDatabase.startTransaction();
		try	{
			var currentEmployeeId = $("#tripContainer").attr("data-currentEmployeeId");

			var sqlExpression = [];
			sqlExpression[0] = id;

			var sql = "select hasUnitAccessoryTracking ";
			sql += "from Account ";
			sql += "where accountId = ? ";
			var accountList = userDatabase.executeSql(sql, sqlExpression);

			var hasUnitAccessoryTracking = 0;
			for (var i=0; i < accountList.length; i++){
				hasUnitAccessoryTracking = accountList[i].hasUnitAccessoryTracking;
			}

			sqlExpression = [];
			sqlExpression[0] = id;
			sqlExpression[1] = id;

			//get data for account
			sql = "select accountId as accountId, ";
			sql += "taskReferenceId as taskReferenceId, ";
			sql += "localTaskReferenceId as localTaskReferenceId, ";
			sql += "taskType as taskType, ";
			sql += "tripDetailId as tripDetailId, ";
			sql += "localTripDetailId as localTripDetailId, ";
			sql += "tripId as tripId, ";
			sql += "localTripId as localTripId,";
			sql += "employeeId as employeeId, ";
			sql += "object as object ";
			sql += "from tripDetail td ";
			sql += "where accountId = ? ";
			sql += "union ";
			sql += "select accountId, ";
			sql += "taskReferenceId, ";
			sql += "localTaskReferenceId, ";
			sql += "taskType, ";
			sql += "tripDetailId, ";
			sql += "localTripDetailId, ";
			sql += "tripId, ";
			sql += "localTripId,";
			sql += "employeeId, ";
			sql += "object ";
			sql += "from tripDetailTemporary ";
			sql += "where accountId = ? ";
			var tripDetailList = userDatabase.executeSql(sql, sqlExpression);

			for (i = 0; i < tripDetailList.length; i++){
				//if transferHeader status is not C then
				//set transfer header back to held status
				sqlExpression = [];
				sqlExpression[0] = tripDetailList[i].localTaskReferenceId;

				sql = "select accountId, ";
				sql += "comment, ";
				sql += "cstat, ";
				sql += "deliveredByEmployeeId, ";
				sql += "deliveryDate, ";
				sql += "department, ";
				sql += "localSwapOutNumber, ";
				sql += "localTransferNumber, ";
				sql += "localUhsPatientId, ";
				sql += "orderBy, ";
				sql += "orderDate, ";
				sql += "purchaseOrder, ";
				sql += "status, ";
				sql += "swapOutFlag, ";
				sql += "swapOutNumber, ";
				sql += "telephoneNumber, ";
				sql += "transferDate, ";
				sql += "transferNumber, ";
				sql += "transferType, ";
				sql += "transferredByEmployeeId, ";
				sql += "uhsPatientId, ";
				sql += "object ";
				sql += "from transferHeader ";
				sql += "where localTransferNumber = ?";
				var transferHeaderArray = userDatabase.executeSql(sql, sqlExpression);
				var tripDetailInstance;

				if (transferHeaderArray.length > 0){
					if (transferHeaderArray[0].status != "C"){
						var transferHeaderInstance = transferHeaderModel.make({
							"accountId": transferHeaderArray[0].accountId,
							"comment": transferHeaderArray[0].comment,
							"cstat": transferHeaderArray[0].cstat,
							"deliveredByEmployeeId": transferHeaderArray[0].deliveredByEmployeeId,
							"deliveryDate": transferHeaderArray[0].deliveryDate,
							"department": transferHeaderArray[0].department,
							"localSwapOutNumber": transferHeaderArray[0].localSwapOutNumber,
							"localTransferNumber": transferHeaderArray[0].localTransferNumber,
							"localUhsPatientId": transferHeaderArray[0].localUhsPatientId,
							"orderBy": transferHeaderArray[0].orderBy,
							"orderDate": transferHeaderArray[0].orderDate,
							"postedByEmployeeId": transferHeaderArray[0].postedByEmployeeId,
							"purchaseOrder": transferHeaderArray[0].purchaseOrder,
							"status": "H",
							"swapOutFlag": transferHeaderArray[0].swapOutFlag,
							"swapOutNumber": transferHeaderArray[0].swapOutNumber,
							"telephoneNumber": transferHeaderArray[0].telephoneNumber,
							"transferDate": transferHeaderArray[0].transferDate,
							"transferNumber": transferHeaderArray[0].transferNumber,
							"transferType": transferHeaderArray[0].transferType,
							"transferredByEmployeeId": transferHeaderArray[0].transferredByEmployeeId,
							"uhsPatientId": transferHeaderArray[0].uhsPatientId,
							"employeeId": currentEmployeeId,
							"object": transferHeaderArray[0].object
						});

						transferHeaderInstance.save();

						//Remove Refusals
						sqlExpression = [];
						sqlExpression[0] = tripDetailList[i].localTaskReferenceId;

						sql = "select th.accountId, ";
						sql += "th.comment, ";
						sql += "th.cstat, ";
						sql += "th.deliveredByEmployeeId, ";
						sql += "th.deliveryDate, ";
						sql += "th.department, ";
						sql += "th.localSwapOutNumber, ";
						sql += "th.localTransferNumber, ";
						sql += "th.localUhsPatientId, ";
						sql += "th.orderBy, ";
						sql += "th.orderDate, ";
						sql += "th.postedByEmployeeId, ";
						sql += "th.purchaseOrder, ";
						sql += "th.status, ";
						sql += "th.swapOutFlag, ";
						sql += "th.swapOutNumber, ";
						sql += "th.telephoneNumber, ";
						sql += "th.transferDate, ";
						sql += "th.transferNumber, ";
						sql += "th.transferType, ";
						sql += "th.transferredByEmployeeId, ";
						sql += "th.uhsPatientId, ";
						sql += "th.employeeId as transferHeaderEmployeeId, ";
						sql += "th.object as transferHeaderObject, ";
						sql += "td.cstat, ";
						sql += "td.department, ";
						sql += "td.description, ";
						sql += "td.employeeId, ";
						sql += "td.employeeInitials, ";
						sql += "td.localTransferDetailId, ";
						sql += "td.localTransferNumber, ";
						sql += "td.localUhsPatientId, ";
						sql += "td.model, ";
						sql += "td.prefix, ";
						sql += "td.purchaseOrder, ";
						sql += "td.reasonRefused, ";
						sql += "td.refusedFlag, ";
						sql += "td.scanOffDate, ";
						sql += "td.scanOnDate, ";
						sql += "td.transferDate, ";
						sql += "td.transferDetailId, ";
						sql += "td.transferNumber, ";
						sql += "td.uhsPatientId, ";
						sql += "td.unit, ";
						sql += "td.vendor, ";
						sql += "td.object as transferDetailObject, ";
						sql += "trd.accountId, ";
						sql += "trd.employeeId, ";
						sql += "trd.localTaskReferenceId, ";
						sql += "trd.localTripDetailId, ";
						sql += "trd.localTripId, ";
						sql += "trd.scanLevel, ";
						sql += "trd.taskReferenceId, ";
						sql += "trd.taskType, ";
						sql += "trd.tripDetailId, ";
						sql += "trd.tripId, ";
						sql += "trd.object as tripDetailObject, ";
						sql += "tc.comment, ";
						sql += "tc.commentDate, ";
						sql += "tc.employeeId, ";
						sql += "tc.localTransferCommentId, ";
						sql += "tc.localTransferNumber, ";
						sql += "tc.prefix, ";
						sql += "tc.transferCommentId, ";
						sql += "tc.transferNumber, ";
						sql += "tc.unit, ";
						sql += "tc.object as transferCommentObject ";
						sql += "from TransferDetail td ";
						sql += "inner join TransferHeader th ";
						sql += "on td.localTransferNumber = th.localTransferNumber ";
						sql += "inner join ( ";
						sql += "SELECT prefix, unit ";
						sql += "FROM TransferDetail ";
						sql += "where localTransferNumber = ? ";
						sql += "and refusedFlag = 'Y') del ";
						sql += "on td.prefix = del.prefix ";
						sql += "and td.unit = del.unit ";
						sql += "inner join TripDetail trd ";
						sql += "on th.localTransferNumber = trd.localTaskReferenceId ";
						sql += "left outer join TransferComment tc ";
						sql += "on td.localTransferNumber = tc.localTransferNumber ";
						sql += "and td.prefix = tc.prefix ";
						sql += "and td.unit = tc.unit ";
						sql += "where th.transferType = 'P' ";
						sql += "and  th.status = 'C' ";
						sql += "and refusedFlag = 'Y' ";
						var refusalList = userDatabase.executeSql(sql, sqlExpression);
						var commentInstance;

						for (var j=0; j < refusalList.length; j++){
							var refusalPickupInstance = transferHeaderModel.make({
								"accountId": refusalList[j].accountId,
								"comment": refusalList[j].comment,
								"cstat": refusalList[j].cstat,
								"deliveredByEmployeeId": refusalList[j].deliveredByEmployeeId,
								"deliveryDate": refusalList[j].deliveryDate,
								"department": refusalList[j].department,
								"localSwapOutNumber": refusalList[j].localSwapOutNumber,
								"localTransferNumber": refusalList[j].localTransferNumber,
								"localUhsPatientId": refusalList[j].localUhsPatientId,
								"orderBy": refusalList[j].orderBy,
								"orderDate": refusalList[j].orderDate,
								"postedByEmployeeId": refusalList[j].postedByEmployeeId,
								"purchaseOrder": refusalList[j].purchaseOrder,
								"status": refusalList[j].status,
								"swapOutFlag": refusalList[j].swapOutFlag,
								"swapOutNumber": refusalList[j].swapOutNumber,
								"telephoneNumber": refusalList[j].telephoneNumber,
								"transferDate": refusalList[j].transferDate,
								"transferNumber": refusalList[j].transferNumber,
								"transferType": refusalList[j].transferType,
								"transferredByEmployeeId": refusalList[j].transferredByEmployeeId,
								"uhsPatientId": refusalList[j].uhsPatientId,
								"employeeId": currentEmployeeId,
								"object": refusalList[j].transferHeaderObject
							});

							refusalPickupInstance.destroy();

							var refusalPickupDetailInstance = transferDetailModel.make({
								"cstat": refusalList[j].cstat,
								"department": refusalList[j].department,
								"description": refusalList[j].description,
								"employeeId": refusalList[j].employeeId,
								"employeeInitials": refusalList[j].employeeInitials,
								"localTransferDetailId": refusalList[j].localTransferDetailId,
								"localTransferNumber": refusalList[j].localTransferNumber,
								"localUhsPatientId": refusalList[j].localUhsPatientId,
								"model": refusalList[j].model,
								"prefix": refusalList[j].prefix,
								"purchaseOrder": refusalList[j].purchaseOrder,
								"reasonRefused": refusalList[j].reasonRefused,
								"refusedFlag": refusalList[j].refusedFlag,
								"scanOffDate": refusalList[j].scanOffDate,
								"scanOnDate": refusalList[j].scanOnDate,
								"transferDate": refusalList[j].transferDate,
								"transferDetailId": refusalList[j].transferDetailId,
								"transferNumber": refusalList[j].transferNumber,
								"uhsPatientId": refusalList[j].uhsPatientId,
								"unit": refusalList[j].unit,
								"vendor": refusalList[j].vendor,
								"object": refusalList[j].transferDetailObject
							});

							refusalPickupDetailInstance.destroy();

							//remove any refusal transfer comment on the pickup
							commentInstance = transferCommentModel.make({
								"comment": refusalList[j].comment,
								"commentDate": refusalList[j].commentDate,
								"employeeId": refusalList[j].employeeId,
								"localTransferCommentId": refusalList[j].localTransferCommentId,
								"localTransferNumber": refusalList[j].localTransferNumber,
								"prefix": refusalList[j].prefix,
								"transferCommentId": refusalList[j].transferCommentId,
								"transferNumber": refusalList[j].transerNumber,
								"unit": refusalList[j].unit,
								"object": refusalList[j].transferCommentObject
							});

							commentInstance.destroy();

							//remove any tripDetail records associated with the pickup
							tripDetailInstance = tripDetailModel.make({
								"accountId": refusalList[j].accountId,
								"employeeId": refusalList[j].employeeId,
								"localTaskReferenceId": refusalList[j].localTaskReferenceId,
								"localTripDetailId": refusalList[j].localTripDetailId,
								"localTripId": refusalList[j].localTripId,
								"scanLevel": refusalList[j].scanLevel,
								"taskReferenceId": refusalList[j].taskReferenceId,
								"taskType": refusalList[j].taskType,
								"tripDetailId": refusalList[j].tripDetailId,
								"tripId": refusalList[j].tripId,
								"object": refusalList[j].tripDetailObject
							});

							tripDetailInstance.destroy();
						}

						//remove any refusal transfer comments on the delivery
						sqlExpression = [];
						sqlExpression[0] = tripDetailList[i].localTaskReferenceId;

						sql = "select comment, ";
						sql += "commentDate, ";
						sql += "employeeId, ";
						sql += "localTransferCommentId, ";
						sql += "localTransferNumber, ";
						sql += "prefix, ";
						sql += "transferCommentId, ";
						sql += "transferNumber, ";
						sql += "unit, ";
						sql += "object ";
						sql += "from TransferComment ";
						sql += "where localTransferNumber = ? ";
						var commentList = userDatabase.executeSql(sql, sqlExpression);

						for (j = 0; j < commentList.length; j++){
							commentInstance = transferCommentModel.make({
								"comment": commentList[j].comment,
								"commentDate": commentList[j].commentDate,
								"employeeId": commentList[j].employeeId,
								"localTransferCommentId": commentList[j].localTransferCommentId,
								"localTransferNumber": commentList[j].localTransferNumber,
								"prefix": commentList[j].prefix,
								"transferCommentId": commentList[j].transferCommentId,
								"transferNumber": commentList[j].transerNumber,
								"unit": commentList[j].unit,
								"object": commentList[j].object
							});

							commentInstance.destroy();
						}

						sqlExpression = [];
						sqlExpression[0] = tripDetailList[i].localTaskReferenceId;

						sql = "select cstat, ";
						sql += "department, ";
						sql += "description, ";
						sql += "employeeInitials, ";
						sql += "localTransferDetailId, ";
						sql += "localTransferNumber, ";
						sql += "localUhsPatientId, ";
						sql += "model, ";
						sql += "prefix, ";
						sql += "purchaseOrder, ";
						sql += "reasonRefused, ";
						sql += "refusedFlag, ";
						sql += "scanOffDate, ";
						sql += "scanOnDate, ";
						sql += "transferDate, ";
						sql += "transferDetailId, ";
						sql += "transferNumber, ";
						sql += "uhsPatientId, ";
						sql += "unit, ";
						sql += "vendor, ";
						sql += "employeeId, ";
						sql += "object ";
						sql += "from transferDetail ";
						sql += "where localTransferNumber = ?";
						var transferDetailList = userDatabase.executeSql(sql, sqlExpression);

						for (j = 0; j < transferDetailList.length; j++){
							var transferDetailInstance = transferDetailModel.make({
								"cstat": transferDetailList[j].cstat,
								"department": transferDetailList[j].department,
								"description": transferDetailList[j].description,
								"employeeInitials": transferDetailList[j].employeeInitials,
								"localTransferDetailId": transferDetailList[j].localTransferDetailId,
								"localTransferNumber": transferDetailList[j].localTransferNumber,
								"localUhsPatientId": transferDetailList[j].localUhsPatientId,
								"model": transferDetailList[j].model,
								"prefix": transferDetailList[j].prefix,
								"purchaseOrder": transferDetailList[j].purchaseOrder,
								"reasonRefused": transferDetailList[j].reasonRefused,
								"refusedFlag": transferDetailList[j].refusedFlag,
								"scanOffDate": transferDetailList[j].scanOffDate,
								"scanOnDate": transferDetailList[j].scanOnDate,
								"transferDate": transferDetailList[j].transferDate,
								"transferDetailId": transferDetailList[j].transferDetailId,
								"transferNumber": transferDetailList[j].transferNumber,
								"uhsPatientId": transferDetailList[j].uhsPatientId,
								"unit": transferDetailList[j].unit,
								"vendor": transferDetailList[j].vendor,
								"employeeId": transferDetailList[j].employeeId,
								"object": transferDetailList[j].object,
							});

							transferDetailInstance.destroy();
						}

						sqlExpression = [];
						sqlExpression[0] = tripDetailList[i].localTaskReferenceId;
						var accessoriesList;
						var accessoryInstance;
						var l;

						if (hasUnitAccessoryTracking == 0){
							sql = "select accessory, ";
							sql += "employeeId, ";
							sql += "localTransferNumber, ";
							sql += "localTransferPrefixId, ";
							sql += "prefix, ";
							sql += "quantity, ";
							sql += "transferNumber, ";
							sql += "transferPrefixId, ";
							sql += "object ";
							sql += "from TransferredPrefixAccessories ";
							sql += "where localTransferNumber = ?";
							accessoriesList = userDatabase.executeSql(sql, sqlExpression);

							for (l = 0; l < accessoriesList.length; l++){
								accessoryInstance = transferredPrefixAccessoriesModel.make({
									"accessory": accessoriesList[l].accessory,
									"employeeId": accessoriesList[l].employeeId,
									"localTransferNumber": accessoriesList[l].localTransferNumber,
									"localTransferPrefixId": accessoriesList[l].localTransferPrefixId,
									"prefix": accessoriesList[l].prefix,
									"quantity": accessoriesList[l].quantity,
									"transferNumber": accessoriesList[l].transferNumber,
									"transferPrefixId": accessoriesList[l].transferPrefixId,
									"object": accessoriesList[l].object
								});
								accessoryInstance.destroy();
							}
						}
						else {
							sql = "select accessoryIsDamaged, ";
							sql += "accessoryIsLost, ";
							sql += "accessoryTransferId, ";
							sql += "employeeId, ";
							sql += "localAccessoryTransferId, ";
							sql += "employeeId, ";
							sql += "localAccessoryTransferId, ";
							sql += "localMatchingAccessoryTransferId, ";
							sql += "localTransferNumber, ";
							sql += "lostReportUserId, ";
							sql += "lostStatusDate, ";
							sql += "matchingAccessoryTransferId, ";
							sql += "outOfStock, ";
							sql += "prefix, ";
							sql += "stockNumber, ";
							sql += "substitutedStockNumber, ";
							sql += "transferDate, ";
							sql += "transferNumber, ";
							sql += "transferType, ";
							sql += "unit, ";
							sql += "object ";
							sql += "from TransferredUnitAccessories ";
							sql += "where localTransferNumber = ?";
							accessoriesList = userDatabase.executeSql(sql, sqlExpression);

							for (l = 0; l < accessoriesList.length; l++){
								//TODO Get Surplus Retrieved Accessories
								sqlExpression = [];
								sqlExpression[0] = accessoriesList[l].localAccessoryTransferId;

								sql = "select customerDepartment, ";
								sql += "deliveryAccessoryTransferId, ";
								sql += "employeeId, ";
								sql += "localDeliveryAccessoryTransferId, ";
								sql += "localRetrievalAccessoryTransferId, ";
								sql += "localSurplusId, ";
								sql += "matchDate, ";
								sql += "matchUserId, ";
								sql += "retrievalAccessoryTransferId, ";
								sql += "surplusId, ";
								sql += "object ";
								sql += "from SurplusRetrievedAccessories ";
								sql += "where localRetrievalAccessoryTransferId = ? ";
								var surplusList = userDatabase.executeSql(sql, sqlExpression);
								var surplusInstance;

								for (var m=0; m < surplusList.length; m++){
									surplusInstance = surplusRetrievedAccessoriesModel.make({
										"customerDepartment": surplusList[m].customerDepartment,
										"deliveryAccessoryTransferId": surplusList[m].deliveryAccessoryTransferId,
										"employeeId": surplusList[m].employeeId,
										"localDeliveryAccessoryTransferId": surplusList[m].localDeliveryAccessoryTransferId,
										"localRetrievalAccessoryTransferId": surplusList[m].localRetrievalAccessoryTransferId,
										"localSurplusId": surplusList[m].localSurplusId,
										"matchDate": surplusList[m].matchDate,
										"matchUserId": surplusList[m].matchUserId,
										"retrievalAccessoryTransferId": surplusList[m].retrievalAccessoryTransferId,
										"surplusId": surplusList[m].surplusId,
										"object": surplusList[m].object
									});
									surplusInstance.destroy();
								}

								accessoryInstance = transferredUnitAccessoriesModel.make({
									"accessoryIsDamaged": accessoriesList[l].accessoryIsDamaged,
									"accessoryIsLost": accessoriesList[l].accessoryIsLost,
									"accessoryTransferId": accessoriesList[l].accessoryTransferId,
									"employeeId": accessoriesList[l].employeeId,
									"localAccessoryTransferId": accessoriesList[l].localAccessoryTransferId,
									"localMatchingAccessoryTransferId": accessoriesList[l].localMatchingAccessoryTransferId,
									"localTransferNumber": accessoriesList[l].localTansferNumber,
									"lostReportUserId": accessoriesList[l].lostReportUserId,
									"lostStatusId": accessoriesList[l].lostStatusId,
									"matchingAccessoryTransferId": accessoriesList[l].matchingAccessoryTransferId,
									"outOfStock": accessoriesList[l].outOfStock,
									"prefix": accessoriesList[l].prefix,
									"stockNumber": accessoriesList[l].stockNumber,
									"substituteStockNumber": accessoriesList[l].substituteStockNumber,
									"transferDate": accessoriesList[l].transferDate,
									"transferNumber": accessoriesList[l].transferNumber,
									"transferType": accessoriesList[l].transferType,
									"unit": accessoriesList[l].unit,
									"object": accessoriesList[l].object,
								});
								accessoryInstance.destroy();
							}
						}

						//TODO Remove damaged item detail records
						sqlExpression = [];
						sqlExpression[0] = tripDetailList[i].localTaskReferenceId;

						sql = "select base64Image ";
						sql += "damagedItemDetailId, ";
						sql += "damagedItemId, ";
						sql += "employeeId, ";
						sql += "localDamagedItemDetailId, ";
						sql += "localDamagedItemId, ";
						sql += "object ";
						sql += "from DamagedItemDetail ";
						sql += "where localDamagedItemId in ( ";
						sql += "select localDamagedItemId ";
						sql += "from DamagedItem ";
						sql += "where localTransferNumber = ? ";
						sql += ")";
						var damagedItemDetailList = userDatabase.executeSql(sql, sqlExpression);

						for (j = 0; j < damagedItemDetailList.length; j++){
							var damagedItemDetailInstance = damagedItemDetailModel.make({
								"base64Image": damagedItemDetailList[j].base64Image,
								"damagedItemDetailId": damagedItemDetailList[j].damagedItemDetailId,
								"damagedItem": damagedItemDetailList[j].damagedItem,
								"employeeId": damagedItemDetailList[j].employeeId,
								"localDamagedItemDetailId": damagedItemDetailList[j].localDamagedItemDetailId,
								"localDamagedItemId": damagedItemDetailList[j].localDamagedItemId,
								"object": damagedItemDetailList[j].object
							});

							damagedItemDetailInstance.destroy();
						}

						//TODO Remove damaged item records
						sqlExpression = [];
						sqlExpression[0] = tripDetailList[i].localTaskReferenceId;

						sql = "select accessoryMissing ";
						sql += "customerReportedFailure, ";
						sql += "damagedItemDate, ";
						sql += "damagedItemId, ";
						sql += "employeeId, ";
						sql += "localDamagedItemId, ";
						sql += "localTransferNumber, ";
						sql += "localTripId, ";
						sql += "notes, ";
						sql += "transferNumber, ";
						sql += "tripId, ";
						sql += "unit, ";
						sql += "visibleDamage, ";
						sql += "object ";
						sql += "from DamagedItem ";
						sql += "where localTransferNumber = ? ";
						var damagedItemList = userDatabase.executeSql(sql, sqlExpression);

						for (j = 0; j < damagedItemList.length; j++){
							var damagedItemInstance = damagedItemModel.make({
								"accessoryMissing": damagedItemList[j].accessoryMissing,
								"customerReportedFailure": damagedItemList[j].customerReportedFailure,
								"damagedItemDate": damagedItemList[j].damagedItemDate,
								"damagedItemId": damagedItemList[j].damagedItemId,
								"employeeId": damagedItemList[j].employeeId,
								"localDamagedItemId": damagedItemList[j].localDamagedItemId,
								"localTransferNumber": damagedItemList[j].localTransferNumber,
								"localTripId": damagedItemList[j].localTripId,
								"notes": damagedItemList[j].notes,
								"otherDamage": damagedItemList[j].otherDamage,
								"prefix": damagedItemList[j].prefix,
								"transferNumber": damagedItemList[j].transferNumber,
								"tripId": damagedItemList[j].tripId,
								"unit": damagedItemList[j].unit,
								"visibleDamage": damagedItemList[j].visibleDamage,
								"object": damagedItemList[j].object
							});

							damagedItemInstance.destroy();
						}

						//TODO Remove swapouts
						sqlExpression = [];
						sqlExpression[0] = tripDetailList[i].localTaskReferenceId;

						sql = "select deliveryPrefix ";
						sql += "deliveryTransferNumber, ";
						sql += "deliveryUnit, ";
						sql += "employeeId, ";
						sql += "enterDate, ";
						sql += "enteredBy, ";
						sql += "entryMethod, ";
						sql += "localDeliveryTransferNumber, ";
						sql += "localPickupTransferNumber, ";
						sql += "localSwapoutId, ";
						sql += "pickupPrefix, ";
						sql += "pickupTransferNumber, ";
						sql += "pickupUnit, ";
						sql += "swapoutId, ";
						sql += "object ";
						sql += "from TransferSwapout ";
						sql += "where localPickupTransferNumber = ? ";

						var swapoutList = userDatabase.executeSql(sql, sqlExpression);

						for (j = 0; j < swapoutList.length; j++){
							var swapoutInstance = transferSwapoutModel.make({
								"deliveryPrefix": swapoutList[j].deliveryPrefix,
								"deliveryTransferNumber": swapoutList[j].deliveryTransferNumber,
								"deliveryUnit": swapoutList[j].deliveryUnit,
								"employeeId": swapoutList[j].employeeId,
								"enterDate": swapoutList[j].enterDate,
								"enteredBy": swapoutList[j].enteredBy,
								"entryMethod": swapoutList[j].entryMethod,
								"localDeliveryTransferNumber": swapoutList[j].localDeliveryTransferNumber,
								"localPickupTransferNumber": swapoutList[j].localPickupTransferNumber,
								"localSwapoutId": swapoutList[j].localSwapoutId,
								"pickupPrefix": swapoutList[j].pickupPrefix,
								"pickupTransferNumber": swapoutList[j].pickupTransferNumber,
								"pickupUnit": swapoutList[j].pickupUnit,
								"swapoutId": swapoutList[j].swapoutId,
								"object": swapoutList[j].object
							});

							swapoutInstance.destroy();
						}

						tripDetailInstance = tripDetailModel.make({
							"accountId": tripDetailList[i].accountId,
							"taskReferenceId": tripDetailList[i].taskReferenceId,
							"localTaskReferenceId": tripDetailList[i].localTaskReferenceId,
							"taskType": tripDetailList[i].taskType,
							"tripDetailId": tripDetailList[i].tripDetailId,
							"localTripDetailId": tripDetailList[i].localTripDetailId,
							"tripId": tripDetailList[i].tripId,
							"localTripId": tripDetailList[i].localTripId,
							"employeeId": tripDetailList[i].employeeId,
							"object": tripDetailList[i].object
						});
						tripDetailInstance.destroy();
					}
				}
				if (tripDetailList[i].taskType == "X"){
					tripDetailInstance = tripDetailTemporaryModel.make({
						"accountId": tripDetailList[i].accountId,
						"taskReferenceId": tripDetailList[i].taskReferenceId,
						"localTaskReferenceId": tripDetailList[i].localTaskReferenceId,
						"taskType": tripDetailList[i].taskType,
						"tripDetailId": tripDetailList[i].tripDetailId,
						"localTripDetailId": tripDetailList[i].localTripDetailId,
						"tripId": tripDetailList[i].tripId,
						"localTripId": tripDetailList[i].localTripId,
						"employeeId": tripDetailList[i].employeeId,
						"object": tripDetailList[i].object
					});
					tripDetailInstance.destroy();
				}
				if (tripDetailList[i].taskType == "F"){
					tripDetailInstance = tripDetailModel.make({
						"accountId": tripDetailList[i].accountId,
						"taskReferenceId": tripDetailList[i].taskReferenceId,
						"localTaskReferenceId": tripDetailList[i].localTaskReferenceId,
						"taskType": tripDetailList[i].taskType,
						"tripDetailId": tripDetailList[i].tripDetailId,
						"localTripDetailId": tripDetailList[i].localTripDetailId,
						"tripId": tripDetailList[i].tripId,
						"localTripId": tripDetailList[i].localTripId,
						"employeeId": tripDetailList[i].employeeId,
						"object": tripDetailList[i].object
					});
					tripDetailInstance.destroy();
				}
			}
			userDatabase.commitTransaction();
			readTripDetail();
			$("#headerListContent").empty();
			$("#frameListContent").empty();
			hideMenu();
		}
		catch (e) {
			Rho.Log.info("Error: removeAccount(" + e.message + ") - rolled back", "inMotion");
			userDatabase.rollbackTransaction();
		}
		finally {
			Rho.Log.info("End: removeAccount", "inMotion");
		}
	}
}

function signatureCheck(id){
	Rho.Log.info("Start: signatureCheck(" + id + ")", "inMotion");
	hideMenu();
	var jsonObj = getValidateJsonObject("captureSignature");
	if (jsonObj.trip.tripCheckoutDateDevice == "0001-01-01 00:00:00.0"){
		alert("You must checkout your trip before capturing a signature");
	}
	else {
		progressBar.signatureId = id;
		detectUHSRhoServer(signatureCheckWithNetwork, signatureCheckNoNetworkWarning);
	}
	Rho.Log.info("End: signatureCheck", "inMotion");
}

function signatureCheckWithNetwork(){
	Rho.Log.info("Start: signatureCheckWithNetwork()", "inMotion");
	var jsonObj = getValidateJsonObject("captureSignature");
	if (parseInt(jsonObj.trip.unsyncedRecordCount) > 0 || jsonObj.syncErrors.errorList.length > 0){
		progressBar.currentStep = 0;
		progressBar.loadingSteps = 2;
		progressBar.loadingModel = "";
		$.get("/public/templates/loading.html", signatureProgress);
	}
	else {
		var id = progressBar.signatureId;
		delete progressBar.signatureId;
		showSignature(id);
	}
	Rho.Log.info("End: signatureCheckWithNetwork", "inMotion");
}

function signatureCheckNoNetworkWarning(){
	Rho.Log.info("Start: signatureCheckNoNetworkWarning()", "inMotion");
	if (Rho.Network.hasWifiNetwork()) {
		alert("Unable to connect to UHS, please:\n1. Turn off Wi-Fi\n OR\n2. Accept the Terms & Conditions of the current wireless network.");
		enableScanner();
	}
	else {
		signatureCheckNoNetwork();
	}
	Rho.Log.info("End: signatureCheckNoNetworkWarning", "inMotion");
}

function signatureCheckNoNetwork(){
	Rho.Log.info("Start: signatureCheckNoNetwork()", "inMotion");
	alert("A network connection could not be found.  You may continue the signature capture process at your own risk.  Any issues with the equipment included on the affected transfers will be listed on the 'Trip Completion' report and will need to be resolved on inCommand.");
	var id = progressBar.signatureId;
	delete progressBar.signatureId;
	showSignature(id);
	Rho.Log.info("End: signatureCheckNoNetwork", "inMotion");
}

function signatureCheckServerErrors(errorCode){
	Rho.Log.info("Start: signatureCheckServerErrors(" + errorCode + ")", "inMotion");
	alert("An error occurred while verifying the data.  You may continue the signature capture process at your own risk.  Any issues with the equipment included on the affected transfers will be listed on the 'Trip Completion' report and will need to be resolved on inCommand.");
	var id = progressBar.signatureId;
	delete progressBar.signatureId;
	showSignature(id);
	Rho.Log.info("End: signatureCheckServerErrors", "inMotion");
}

function signatureProgress(loadingData) {
	Rho.Log.info("Start: signatureProgress()", "inMotion");
	modal.open({
		content: loadingData,
		hideSave: true,
		hideClose: true
	});

	$("#loadingMessage").replaceWith("<div id=\"loadingMessage\">Validating Data to inCommand</div>");
	updateProgress("Validating application data");
	signatureCheckUnits();
	Rho.Log.info("End: signatureProgress", "inMotion");
}

function signatureCheckUnits() {
	Rho.Log.info("Start: signatureCheckUnits()", "inMotion");
	try {
		var urlStr = Rho.RhoConnectClient.syncServer;
		urlStr += "/app/v1/Validate/capturesignature";
	
		var sql = "SELECT prefix, unit from transferDetail d ";
		sql += "left outer join transferHeader h on  d.localTransferNumber = h.localTransferNumber ";
		sql += "where h.accountId = ? and h.transferType = ?";
		var sqlExpression = [progressBar.signatureId, 'P'];
		var sqlArray = userDatabase.executeSql(sql, sqlExpression);
		if (sqlArray.length == 0) {
			Rho.Log.info("Running: signatureCheckUnits (no pickups)", "inMotion");
			updateProgress("Upload Complete - Capture Signature", 100);
			modal.close(false);
			onSignatureSyncComplete();
		}
		else {
			Rho.Log.info("Running: signatureCheckUnits (" + sqlArray.length + ")", "inMotion");
			var jsonObj = {};
			var items = [];
			var item = {};
			jsonObj.employeeId = getEmployeeId();

			for (var i = 0; i < sqlArray.length; i++){
				item = {};
				item["prefix"] = sqlArray[i].prefix;
				item["unit"] = sqlArray[i].unit;
				items.push(item);
			}
			jsonObj.items = items;
			Rho.Network.post(
					{
						"url" : urlStr,
						"body" : jsonObj,
						"headers" : {
							"Content-Type": "application/json",
							"Cookie": getRhoSession()
							}
					},
					onSignatureCheckUnits
			);
		}
	}
	catch (e) {
		Rho.Log.info("Error: signatureCheckUnits(" + e.message + ")", "inMotion");
		signatureCheckNoNetwork();
	}
	Rho.Log.info("End: signatureCheckUnits", "inMotion");
}

function onSignatureCheckUnits(params) {
	Rho.Log.info("Start: onSignatureCheckUnits(" + JSON.stringify(params) + ")", "inMotion");

	if (params.body.length > 0){
		try {
			var jsonObj = JSON.parse(params.body);
			if (jsonObj.capturesignature) {
				var units = jsonObj.capturesignature;
				if (units.length > 0) {
					try {
						var sql;
						var sqlExpression;
						var sqlArray;
						var recordId;
						var syncErrorInstance;

						for (var i = 0; i < units.length; i++) {
							if (units[i].errorText != "") {
								sql = "select distinct recordId from SyncError ";
								sql += "where recordId in ( ";
								sql += "select localTransferDetailId from TransferDetail where prefix = ? and unit = ? )";

								sqlExpression = [units[i].prefix.toUpperCase(), units[i].unit];
								sqlArray = userDatabase.executeSql(sql, sqlExpression);

								if (sqlArray.length == 0) {
									sql = "select localTransferDetailId from TransferDetail where prefix = ? and unit = ? ";
									sqlArray = userDatabase.executeSql(sql, sqlExpression);

									if (sqlArray.length == 0) {
										recordId = "999999";
									}
									else {
										recordId = sqlArray[0].localTransferDetailId;
									}
									syncErrorInstance = syncErrorModel.create({
										"errorCode": 8,
										"errorMessage": units[i].errorText,
										"errorType": "error",
										"recordId": recordId,
										"sourceId": "17",
										"sourceName": "TransferDetail"
									});
								}
							}
						}
					}
					catch (e) {
						Rho.Log.info("Error: onSignatureCheckUnits(" + e.message + ")", "inMotion");
					}
				}
				updateProgress("Upload Complete - Capture Signature", 100);
				modal.close(false);
				onSignatureSyncComplete();
			}
			else {
				var errCode = params.body ? params.body : "Unknown error";
				errCode += params.error_code ? (" (" + params.error_code + ")") : "";
				errCode += params.http_error ? (" [" + params.http_error + "]") : "";
				Rho.Log.info("Error: onSignatureCheckUnits(errorCode=" + errCode + ")", "inMotion");
				updateProgress("Upload Error - Capture Signature", 100);
				modal.close(false);
				signatureCheckServerErrors(errCode);
			}
		}
		catch (e2) {
			var errCode = params.body ? params.body : "Unknown error";
			errCode += params.error_code ? (" (" + params.error_code + ")") : "";
			errCode += params.http_error ? (" [" + params.http_error + "]") : "";
			Rho.Log.info("Error: onSignatureCheckUnits(errorCode=" + errCode + ")", "inMotion");
			updateProgress("Upload Error - Capture Signature", 100);
			modal.close(false);
			signatureCheckServerErrors(errCode);
		}
	}	
	else {
		Rho.Log.info("Error: onSignatureCheckUnits(errorCode=" + params.error_code + ")", "inMotion");
		updateProgress("Upload Complete - Capture Signature", 100);
		modal.close(false);
		signatureCheckNoNetwork();
	}
	Rho.Log.info("End: onSignatureCheckUnits", "inMotion");
}

function onSignatureSyncComplete() {
	Rho.Log.info("Start: onSignatureSyncComplete()", "inMotion");
	var id = progressBar.signatureId;
	delete progressBar.signatureId;
	showSignature(id);
	Rho.Log.info("End: onSignatureSyncComplete", "inMotion");
}

function showSignature(id){
	Rho.Log.info("Start: showSignature(" + id + ")", "inMotion");
	/*hide trip menu options. This handled in in showMenu()
		View Held Transfers, View All Accounts, Checkout, Close Trip, Edit Trip, Sync, Administration
	  hide account menu options. This is handled in showMenu()
		Add Delivery, Add Pickup, Add Find, Remove Account
	*/
	var localTransferNumber;
	var jsonObj;
	var allowContinue = true;
	var i;
	var sqlExpression = [];
	sqlExpression[0] = id;

	var sql = "select localTaskReferenceId, ";
	sql += "taskType ";
	sql += "from TripDetail ";
	sql += "where accountId = ? ";
	var tripDetailList = userDatabase.executeSql(sql, sqlExpression);

	for (i = 0; i < tripDetailList.length; i++){
		localTransferNumber = tripDetailList[i].localTaskReferenceId;
		jsonObj = getValidateJsonObject("captureSignature", localTransferNumber);
		$(".taskContainer[data-localTaskReferenceId='" + localTransferNumber + "']").each(function(){
			var taskImage = $(this).find(".taskImage");
			if (tripDetailList[i].taskType == "F"){
				//do nothing
			}
			else if (jsonObj.captureSignature.errorList.length > 0){
				taskImage.attr("src", "images/uhs/signatureError.png");
				taskImage.off("click");
				taskImage.on("click", {"jsonObj": jsonObj, "localTransferNumber": localTransferNumber}, displaySignatureValidationModal);
			}
			else if (jsonObj.captureSignature.warningList.length > 0){
				taskImage.attr("src", "images/uhs/signatureWarning.png");
				taskImage.off("click");
				taskImage.on("click", {"jsonObj": jsonObj, "localTransferNumber": localTransferNumber}, displaySignatureValidationModal);
			}
			else {
				taskImage.attr("src", "images/uhs/checkbox-unchecked.png");
				taskImage.off("click");
				taskImage.on("click", {"localTransferNumber": localTransferNumber}, toggleSignatureCheck);
			}
			jsonObj = null;	//why nulled here?? - to release memory bph 10-18-2014
		});
	}
	if (allowContinue) {
		showSignatureContinue(id);
	}
	hideMenu();
}

function showSignatureContinue(id) {
	replaceMaxLength();	
	$(".taskTextContainer").off("click");
	$("#tripContainer").attr("data-applicationMode", "capture signature");
	$.get("/public/templates/signatureHeader.html", function(data){
		$("#headerListContent").replaceWith(data);
	});

	var sql = "SELECT ac.accountContactId, ";
	sql += "ac.accountId, ";
	sql += "ac.contactLastUsedDate, ";
	sql += "ac.contactType, ";
	sql += "ac.contactValue, ";
	sql += "ac.localAccountContactId ";
	sql += "from AccountContact ac ";
	sql += "where accountId = " + id + " ";
	sql += "order by contactLastUsedDate desc";
	var contactList = userDatabase.executeSql(sql);

	var emailList = [];
	var faxList = [];
	var contactObj;
	for (var i=0; i < contactList.length; i++){
		contactObj = {};
		contactObj.accountContactId = contactList[i].accountContactId;
		contactObj.accountId = contactList[i].accountId;
		contactObj.contactLastUsedDate = contactList[i].contactLastUsedDate;
		contactObj.contactType = contactList[i].contactType;
		contactObj.contactValue = contactList[i].contactValue;
		contactObj.localAccountContactId = contactList[i].localAccountContactId;

		if (contactList[i].contactType == "E"){
			emailList.push(contactObj);
		}
		else if (contactList[i].contactType == "F"){
			faxList.push(contactObj);
		}
		else {
			//uknown contact type do nothing
		}
	}

	var jsonObject = {};
	jsonObject.emailList = emailList;
	jsonObject.faxList = faxList;
	jsonObject.accountId = id;
	$.get("/public/templates/signature.html", function(data){
		var template = Handlebars.compile(data);
		$("#frameListContent").replaceWith(template(jsonObject));
		jsonObject = null;
		refreshFrameListScroll();

		$("#signatureCancel").off("click");
		$("#signatureCancel").on("click", function(){
			signatureCancel();
		});
		$("#signatureContinue").off("click");
		$("#signatureContinue").on("click", function(){
			signatureContinue();
		});
		$("#signatureSave").off("click");
		$("#signatureSave").on("click", function(){
			signatureSave();
		});
		$("#signatureDocumentation").off("click");
		$("#signatureDocumentation").on("click", function(){
			signatureDocumentation();
		});

		if (!Rho.System.isRhoSimulator){
			$("#clearInlineSignature").off("click");
			$("#clearInlineSignature").on("click", function(){
				clearInlineSignature();
			});
		}
		$("#selectEmailFaxForm").show();
		$(".emailContactImage").off("click");
		$(".emailContactImage").on("click", function(){
			var index = $(this).attr("data-index");
			toggleCheckbox("emailContactImage" + index);
		});
		$(".faxContactImage").off("click");
		$(".faxContactImage").on("click", function(){
			var index = $(this).attr("data-index");
			toggleRadioButton("faxContactImage" + index, "faxContactImage");
		});
		$("#captureSignatureForm").hide();
		$("#signatureSave").hide();
		$("#signatureDocumentation").hide();
		$("#clearInlineSignature").hide();
	});
	Rho.Log.info("End: showSignature", "inMotion");
}

function signatureCancel(){
	Rho.Log.info("Start: signatureCancel()", "inMotion");
	$("#tripContainer").attr("data-applicationMode", "");

	//remove onclick events from img[data-taskReferenceId]. handled by readTripDetail()
	readTripDetail();
	hideInlineSignature();

	/*unhide trip menu options. handled by showMenu()
		View Held Transfers, View All Accounts, Checkout, Close Trip, Edit Trip, Sync, Administration
	*/
	/*unhide account menu options. handled by showMenu()
		Add Delivery, Add Pickup, Add Find, Remove Account
	*/
	$("#headerListContent").empty();
	$("#frameListContent").empty();
	Rho.Log.info("End: signatureCancel", "inMotion");
}

function isValidEmailAddress(emailAddress) {
    var pattern = new RegExp(/^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i);
    return pattern.test(emailAddress);
}

function signatureContinue(){
	Rho.Log.info("Start: signatureContinue()", "inMotion");
	var errMsgs = [];
	if ($(".taskImage[src='images/uhs/checkbox-checked.png']").length < 1){
		errMsgs.push("You must select a task.\n" );
	}
	var emailInput = $("#emailInput").val();
	if (emailInput.length > 0) {
		if(emailInput.indexOf(" ") != -1){
			errMsgs.push("Email cannot contain spaces. Separate multiple emails with a comma. \n" );
		}
		var emailArray = emailInput.split(",");
		for (var i = 0; i < emailArray.length; i++){
			if(!isValidEmailAddress(emailArray[i])){
				errMsgs.push("Invalid email address entered: " + emailArray[i]);
			}
		}
	}
	var faxInput = $("#faxInput").val();
	if (faxInput.length > 0) {
		var regexFax = /\d{10}/;
		if(!faxInput.match(regexFax)){
	    	errMsgs.push("Invalid fax entered. Must contain 10 numeric characters. \n");
	    }
	}
	if (errMsgs.length !== 0) {
		alert('The following errors must be corrected before you can continue:\n\n' + errMsgs.join('\n'));
	}
	else {
		$("#selectEmailFaxForm").hide();
		$("#captureSignatureForm").show();
		$("#acceptTermCondition").off("click");
		$("#acceptTermCondition").on("click", function(){
			if($("#acceptTermCondition").attr("src") == "images/uhs/checkbox-unchecked.png"){
				$("#acceptTermCondition").attr("src", "images/uhs/checkbox-checked.png");
			}
			else{
				$("#acceptTermCondition").attr("src", "images/uhs/checkbox-unchecked.png");
			}
		});
		$("#signatureDocumentation").show();
		$("#signatureContinue").hide();
		$("#clearInlineSignature").show();
		$("#signatureSave").show();
		
		refreshFrameListScroll();
		setTimeout(showInlineSignature, 500);
	}
	Rho.Log.info("End: signatureContinue", "inMotion");
}

function signatureDocumentation(){
	Rho.Log.info("Start: signatureDocumentation()", "inMotion");
	//TODO still need to develop only skeleton code currently
	//TODO need to include accessories once it is defined
	var accountId = $("#captureSignatureForm").attr("data-accountId");
	var sqlExpression = [];
	sqlExpression[0] = accountId;

	var sql = "select a.accountId, ";
	sql += "a.accountName, ";
	sql += "addressLine1, ";
	sql += "addressLine2, ";
	sql += "city, ";
	sql += "districtId, ";
	sql += "employeeId, ";
	sql += "hasUnitAccessoryTracking, ";
	sql += "standingPurchaseOrder, ";
	sql += "state, ";
	sql += "zip, ";
	sql += "object ";
	sql += "from Account a ";
	sql += "where accountId = ? ";
	var accountArray = userDatabase.executeSql(sql, sqlExpression);

	if (accountArray.length > 0){
		var hasUnitAccessoryTracking = accountArray[0].hasUnitAccessoryTracking;
		var transferList = [];

		$(".taskImage[src='images/uhs/checkbox-checked.png']").each(function (){
			var localTaskReferenceId = $(this).attr("data-localTaskReferenceId");
			if (hasUnitAccessoryTracking == "1"){
				sqlExpression = [];
				sqlExpression[0] = localTaskReferenceId;
				sqlExpression[1] = localTaskReferenceId;

				sql = "select ";
				sql += "th.localTransferNumber, ";
				sql += "th.transferNumber, ";
				sql += "th.transferType, ";
				sql += "td.vendor, ";
				sql += "td.model, ";
				sql += "td.description, ";
				sql += "td.prefix, ";
				sql += "td.unit, ";
				sql += "ta.stockNumber, ";
				sql += "case when stockNumberCount is null then 0 else stockNumberCount end as stockNumberCount ";
				sql += "from TransferHeader th ";
				sql += "left outer join TransferDetail td ";
				sql += "on th.localTransferNumber = td.localTransferNumber ";
				sql += "left outer join ( select ";
				sql += "localTransferNumber, ";
				sql += "prefix, ";
				sql += "unit, ";
				sql += "stockNumber, ";
				sql += "count(*) as stockNumberCount ";
				sql += "from transferredUnitAccessories ";
				sql += "where localTransferNumber = ? ";
				sql += "group by localTransferNumber, prefix, unit, stockNumber ) ta ";
				sql += "on td.localTransferNumber = ta.localTransferNumber ";
				sql += "and td.prefix = ta.prefix ";
				sql += "and td.unit = ta.unit ";
				sql += "where th.localTransferNumber = ? ";
				sql += "order by th.localTransferNumber, td.prefix, td.unit ";
			}
			else {
				sqlExpression = [];
				sqlExpression[0] = localTaskReferenceId;
				sqlExpression[1] = localTaskReferenceId;
				sqlExpression[2] = localTaskReferenceId;

				sql = "select ";
				sql += "th.localTransferNumber, ";
				sql += "th.transferNumber, ";
				sql += "th.transferType, ";
				sql += "td.vendor, ";
				sql += "td.model, ";
				sql += "td.description, ";
				sql += "td.prefix, ";
				sql += "td.unit, ";
				sql += "ta.stockNumber, ";
				sql += "case when stockNumberCount is null then 0 else case when unitCount > 0 then stockNumberCount / unitCount else 0 end end as stockNumberCount ";
				sql += "from TransferHeader th ";
				sql += "left outer join TransferDetail td ";
				sql += "on th.localTransferNumber = td.localTransferNumber ";
				sql += "left outer join ( select ";
				sql += "localTransferNumber, ";
				sql += "prefix, ";
				sql += "'' as unit,";
				sql += "accessory as stockNumber, ";
				sql += "quantity as stockNumberCount ";
				sql += "from transferredPrefixAccessories ";
				sql += "where localTransferNumber = ? ";
				sql += "group by localTransferNumber, prefix, unit, stockNumber ) ta ";
				sql += "on td.localTransferNumber = ta.localTransferNumber ";
				sql += "and td.prefix = ta.prefix ";
				sql += "left outer join ( ";
				sql += "select localTransferNumber, prefix, count(*) as unitCount ";
				sql += "from TransferDetail ";
				sql += "where localTransferNumber = ? ";
				sql += "group by localTransferNumber, prefix ";
				sql += ") td2 ";
				sql += "on td.prefix = td2.prefix ";
				sql += "where th.localTransferNumber = ? ";
				sql += "order by th.localTransferNumber, td.prefix, td.unit ";
			}
			var resultArray = userDatabase.executeSql(sql, sqlExpression);
			var transferNumber = 0;

			if (resultArray[0].transferNumber > 0){
				transferNumber = resultArray[0].transferNumber;
			}
			else {
				transferNumber = resultArray[0].localTransferNumber;
			}

			var transferType = resultArray[0].transferType;
			var prefixCheck = "";
			var unitCheck = "";
			var prefixList = [];
			var prefixObj = null;
			var unitList = [];
			var unitObj = null;
			var accessoryList = [];
			var accessoryCount = 0;

			for (var i=0; i < resultArray.length; i++) {
				var prefix = resultArray[i].prefix;
				var unit = resultArray[i].unit;

				if (prefix + unit != unitCheck) {
					if (unitObj !== null){
						if (accessoryList !== null){
							unitObj.accessoryList = accessoryList;
							unitList.push(unitObj);
							unitObj = null;
							accessoryList = [];
							accessoryCount = 0;
						}
					}
					unitObj = {};
					unitObj.prefix = resultArray[i].prefix;
					unitObj.unit = resultArray[i].unit;
					unitCheck = resultArray[i].prefix + resultArray[i].unit;
				}

				if (prefix != prefixCheck) {
					if (prefixObj !== null){
						if (unitList !== null){
							prefixObj.unitList = unitList;
							prefixList.push(prefixObj);
							prefixObj = null;
							unitList = [];
							accessoryList = [];
							accessoryCount = 0;
						}
					}
					prefixObj = {};
					prefixObj.prefix = resultArray[i].prefix;
					prefixObj.vendor = resultArray[i].vendor;
					prefixObj.model = resultArray[i].model;
					prefixObj.description = resultArray[i].description;
					prefixCheck = resultArray[i].prefix;
				}

				var accessoryObj = {};
				if (accessoryCount === 0) {
					accessoryObj.title = "Accessories:";
				}
				else {
					accessoryObj.title = "";
				}
				accessoryObj.stockNumber = resultArray[i].stockNumber;
				accessoryObj.stockNumberCount = resultArray[i].stockNumberCount;
				accessoryList.push(accessoryObj);
				accessoryCount ++;
			}

			if (unitObj !== null){
				if (accessoryList !== null){
					unitObj.accessoryList = accessoryList;
					unitList.push(unitObj);
					unitObj = null;
					accessoryList = [];
					accessoryCount = 0;
				}
			}
			if (prefixObj !== null){
				if (unitList !== null){
					prefixObj.unitList = unitList;
					prefixList.push(prefixObj);
					prefixObj = null;
					unitList = [];
					accessoryList = [];
					accessoryCount = 0;
				}
			}
			var transferObj = {};

			if (transferType == "D"){
				transferObj.transferType = "Delivery";
			}
			else if (transferType == "P"){
				transferObj.transferType = 	"Pickup";
			}
			else if (transferType == "F"){
				transferObj.transferType = 	"Find";
			}
			else {

			}
			transferObj.transferNumber = transferNumber;
			transferObj.prefixList = prefixList;
			transferList.push(transferObj);
			}
		);

		var jsonObj = {};
 		jsonObj.transferList = transferList;

 		$.get("/public/templates/signatureDocumentation.html", function(data) {
			var template = Handlebars.compile(data);
			var templateWithData = template(jsonObj);
			jsonObj = null;

			hideInlineSignature();
			modal.open({
				content: templateWithData,
				hideSave: true,
				fullScreen: true,
				enableScroll: true
			});
			$("#modalClose").on("click", function(){
				showInlineSignature();
			});
		});
	}
	Rho.Log.info("End: signatureDocumentation", "inMotion");
}

function signatureSave(){
	Rho.Log.info("Start: signatureSave()", "inMotion");

	var errMsgs = [];
	if ($(".taskImage[src='images/uhs/checkbox-checked.png']").length < 1){
		errMsgs.push("You must select a task.\n" );
	}
	if ($("#acceptTermCondition").attr("src")=="images/uhs/checkbox-unchecked.png"){
		errMsgs.push("You must accept UHS terms and conditions.\n" );
	}
	var customerName = $("#customerName").val();
	if(customerName.length === 0){
		errMsgs.push("Customer Name is required.\n" );
	}
	if (errMsgs.length !== 0) {
		alert('The following errors must be corrected before you can continue:\n\n' + errMsgs.join('\n'));
	}
	else {
		if (!Rho.System.isRhoSimulator){
			Rho.Signature.capture(signatureSaveCallback);
		}
		//TODO remove else statement this was used for testing
		else {
			signatureSaveCallback({"status": "ok", "imageUri": ""});
		}
	}
	Rho.Log.info("End: signatureSave", "inMotion");
}

function signatureTermsConditions(){
	Rho.Log.info("Start: signatureTermsConditions()", "inMotion");
	$.get("/public/templates/termsConditions.html", function(data){
		hideInlineSignature();
		modal.open({
			content: data,
			fullScreen: true,
			hideSave: true,
			enableScroll: true
		});
		$("#modalClose").on("click", function(){
			showInlineSignature();
		});
	});
	Rho.Log.info("End: signatureTermsConditions", "inMotion");
}

function toggleSignatureCheck(params){
	Rho.Log.info("Start: toggleSignatureCheck(" + JSON.stringify(params.data) + ")", "inMotion");
	var id = params.data.localTransferNumber;
	if ($("img[data-localTaskReferenceId='" + id +"']").attr("src") == "images/uhs/checkbox-unchecked.png"){
		$("img[data-localTaskReferenceId='" + id + "']").attr("src", "images/uhs/checkbox-checked.png");
	}
	else {
		$("img[data-localTaskReferenceId='" + id + "']").attr("src", "images/uhs/checkbox-unchecked.png");
	}
	Rho.Log.info("End: toggleSignatureCheck", "inMotion");
}

function clearInlineSignature(){
	Rho.Log.info("Start: clearInlineSignature()", "inMotion");
	if (!Rho.System.isRhoSimulator){
		Rho.Signature.clear();
		showInlineSignature();
	}
	Rho.Log.info("End: clearInlineSignature", "inMotion");
}

function hideInlineSignature(){
	Rho.Log.info("Start: hideInlineSignature()", "inMotion");
	if (!Rho.System.isRhoSimulator){
		Rho.Signature.hide();
	}
	Rho.Log.info("End: hideInlineSignature", "inMotion");
}

function showInlineSignature(){
	Rho.Log.info("Start: showInLineSignature()", "inMotion");
	var pixelRatio = 1;
	if (Rho.System.platform == 'ANDROID'){
		pixelRatio = window.devicePixelRatio;
	}

	var elementLeft = Math.round($("#signatureImagePlaceholder").offset().left * pixelRatio);
	var elementTop = Math.round($("#signatureImagePlaceholder").offset().top * pixelRatio);
	var elementWidth = Math.round($("#signatureImagePlaceholder").width() * pixelRatio);
	var elementHeight =  Math.round($("#signatureImagePlaceholder").height() * pixelRatio);
	if (!Rho.System.isRhoSimulator){
		Rho.Signature.show({left: elementLeft, top: elementTop, width: elementWidth, height: elementHeight, outputFormat: "dataUri"});
	}
	else {
		$("#signatureImagePlaceholder").attr("src", "images/uhs/placeHolder400x200.png");
	}
	Rho.Log.info("End: showInLineSignature", "inMotion");
}

function signatureSaveCallback(params){
	Rho.Log.info("Start: signatureSaveCallback(" + params + ")", "inMotion");
	if (params.status == "ok") {
		if (params.imageUri.replace(/(\r\n|\n|\r)/gm,"") == "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAlgAAAEsCAYAAAAfPc2WAAAABHNCSVQICAgIfAhkiAAABWRJREFUeJzt1sEJACAQwDB1/53PJQqCJBP02T0zswAAyJzXAQAAvzFYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAELtFfAZUNqHyVgAAAABJRU5ErkJggg=="){
			alert("Signature cannot be blank.");
		}
		else {
			userDatabase.startTransaction();
			try{
				var imageUri = params.imageUri;
				var adjImageUri = imageUri.replace(/(\r\n|\n|\r)/gm,"");
				var base64Image = adjImageUri.substring(22);
				var customerName = $("#customerName").val();
				var currentEmployeeId = $("#tripContainer").attr("data-currentEmployeeId");
				var tripId = $("#tripContainer").attr("data-tripId");
				var localTripId = $("#tripContainer").attr("data-localTripId");
				var accountId = $("#captureSignatureForm").attr("data-accountId");
				var currentTimestamp = getCurrentTimestampString();
				var signatureHeaderInstance = signatureHeaderModel.create({
					"accountId": accountId,
					"customerName": customerName,
					"employeeId": currentEmployeeId,
					"localSignatureId": 0,
					"signatureDateDevice": currentTimestamp,
					"signatureId": 0,
					"tripId": tripId,
					"localTripId": localTripId
				});

				signatureHeaderInstance.updateAttributes({
					"localSignatureId": signatureHeaderInstance.get("object")
				});

				$(".taskImage[src='images/uhs/checkbox-checked.png']").each(function (){
					var localTaskReferenceId = $(this).attr("data-localTaskReferenceId");
					var taskReferenceId = $(this).attr("data-taskReferenceId");
					var signatureDetailInstance = signatureDetailModel.create({
						"localReferenceId": localTaskReferenceId,
						"localSignatureDetailId": 0,
						"localSignatureId": signatureHeaderInstance.get("localSignatureId"),
						"referenceId": taskReferenceId,
						"signatureDetailId": 0,
						"signatureId": signatureHeaderInstance.get("signatureId"),
						"employeeId": currentEmployeeId,
						"documentationSent": 0
					});
					signatureDetailInstance.updateAttributes({
						"localSignatureDetailId": signatureDetailInstance.get("object")
					});
				});

				//create signature image record
				var signatureImageInstance = signatureImageModel.create({
					"base64Image": base64Image,
					"localSignatureId": signatureHeaderInstance.get("localSignatureId"),
					"localSignatureImageId": 0,
					"signatureId": signatureHeaderInstance.get("signatureId"),
					"signatureImageId": 0,
					"employeeId": currentEmployeeId
				});

				signatureImageInstance.updateAttributes({
					"localSignatureImageId": signatureImageInstance.get("object")
				});

				//create signature send to records
				var sendArray = [];
				var accountContactInstance;
				var sql;
				var sqlExpression;
				var accountContactArray;

				$(".emailContactImage[src='images/uhs/checkbox-checked.png']").each(function(){
					var localAccountContactId = $(this).attr("data-localAccountContactId");
					var accountContactId = $(this).attr("data-accountContactId");
					var contactValue = $(this).attr("data-contactValue");
					sendArray.push(localAccountContactId + "~" + accountContactId + "~" + contactValue);

					//TODO update accountContact contactLastUseDate
					sqlExpression = [];
					sqlExpression[0] = localAccountContactId;

					sql = "select accountContactId, ";
					sql += "accountId, ";
					sql += "contactLastUsedDate, ";
					sql += "contactType, ";
					sql += "contactValue, ";
					sql += "employeeId, ";
					sql += "localAccountContactId, ";
					sql += "object ";
					sql += "from AccountContact ";
					sql += "where localAccountContactId = ? ";
					accountContactArray = userDatabase.executeSql(sql, sqlExpression);

					for (i = 0; i < accountContactArray.length; i++){
						accountContactInstance = accountContactModel.make({
							"accountContactId": accountContactArray[i].accountContactId,
							"accountId": accountContactArray[i].accountId,
							"contactLastUsedDate": getCurrentTimestampString(),
							"contactType": accountContactArray[i].contactType,
							"contactValue": accountContactArray[i].contactValue,
							"employeeId": accountContactArray[i].employeeId,
							"localAccountContactId": accountContactArray[i].localAccountContactId,
							"object": accountContactArray[i].object
						});
						accountContactInstance.save();
					}
				});
				if($("#emailInput").val().length > 0) {
					var emailInput = $("#emailInput").val();
					var emailArray = emailInput.split(",");
					for (i = 0; i < emailArray.length; i++){
						//TODO lookup accountContact if it exists update contactLastUsedDate if it does not exist create a new accountContact
						sqlExpression = [];
						sqlExpression[0] = emailArray[i];
						sqlExpression[1] = accountId;

						sql = "select accountContactId, ";
						sql += "accountId, ";
						sql += "contactLastUsedDate, ";
						sql += "contactType, ";
						sql += "contactValue, ";
						sql += "employeeId, ";
						sql += "localAccountContactId, ";
						sql += "object ";
						sql += "from AccountContact ";
						sql += "where contactValue = ? ";
						sql += "and contactType = 'E' ";
						sql += "and accountId = ? ";
						accountContactArray = userDatabase.executeSql(sql, sqlExpression);

						if (accountContactArray.length > 0){
							accountContactInstance = accountContactModel.make({
								"accountContactId": accountContactArray[0].accountContactId,
								"accountId": accountContactArray[0].accountId,
								"contactLastUsedDate": getCurrentTimestampString(),
								"contactType": accountContactArray[0].contactType,
								"contactValue": accountContactArray[0].contactValue,
								"employeeId": accountContactArray[0].employeeId,
								"localAccountContactId": accountContactArray[0].localAccountContactId,
								"object": accountContactArray[0].object
							});
							accountContactInstance.save();
						}
						else {
							accountContactArray = userDatabase.executeSql(sql, sqlExpression);
							accountContactInstance = accountContactModel.create({
								"accountContactId": 0,
								"accountId": accountId,
								"contactLastUsedDate": getCurrentTimestampString(),
								"contactType": "E",
								"contactValue": emailArray[i],
								"localAccountContactId": 0,
								"employeeId": currentEmployeeId
							});
							accountContactInstance.updateAttributes({
								"localAccountContactId": accountContactInstance.get("object")
							});
						}
						sendArray.push(accountContactInstance.get("localAccountContactId") + "~" + accountContactInstance.get("accountContactId") + "~" + accountContactInstance.get("contactValue"));
					}
				}
				if($("#faxInput").val().length > 0) {
					var faxInput = $("#faxInput").val();
					//TODO lookup accountContact if it exists update contactLastUsedDate if it does not exist create a new accountContact
					sqlExpression = [];
					sqlExpression[0] = faxInput;
					sqlExpression[1] = accountId;

					sql = "select accountContactId, ";
					sql += "accountId, ";
					sql += "contactLastUsedDate, ";
					sql += "contactType, ";
					sql += "contactValue, ";
					sql += "employeeId, ";
					sql += "localAccountContactId, ";
					sql += "object ";
					sql += "from AccountContact ";
					sql += "where contactValue = ? ";
					sql += "and contactType = 'F' ";
					sql += "and accountId = ? ";

					accountContactArray = userDatabase.executeSql(sql, sqlExpression);
					if (accountContactArray.length > 0){
						accountContactInstance = accountContactModel.make({
							"accountContactId": accountContactArray[0].accountContactId,
							"accountId": accountContactArray[0].accountId,
							"contactLastUsedDate": getCurrentTimestampString(),
							"contactType": accountContactArray[0].contactType,
							"contactValue": accountContactArray[0].contactValue,
							"employeeId": accountContactArray[0].employeeId,
							"localAccountContactId": accountContactArray[0].localAccountContactId,
							"object": accountContactArray[0].object
						});
						accountContactInstance.save();
					}
					else {
						accountContactInstance = accountContactModel.create({
							"accountContactId": 0,
							"accountId": accountId,
							"contactLastUsedDate": getCurrentTimestampString(),
							"contactType": "F",
							"contactValue": faxInput,
							"localAccountContactId": 0,
							"employeeId": currentEmployeeId
						});
						accountContactInstance.updateAttributes({
							"localAccountContactId": accountContactInstance.get("object")
						});
					}
					sendArray.push(accountContactInstance.get("localAccountContactId") + "~" + accountContactInstance.get("accountContactId") + "~" + accountContactInstance.get("contactValue"));
				}
				else {
					$(".faxContactImage[src='images/uhs/radiobutton-checked.png']").each(function(){
						var localAccountContactId = $(this).attr("data-localAccountContactId");
						var accountContactId = $(this).attr("data-accountContactId");
						var contactValue = $(this).attr("data-contactValue");
						sendArray.push(localAccountContactId + "~" + accountContactId + "~" + contactValue);

						//TODO update accountContact contactLastUsedDate
						sqlExpression = [];
						sqlExpression[0] = localAccountContactId;

						sql = "select accountContactId, ";
						sql += "accountId, ";
						sql += "contactLastUsedDate, ";
						sql += "contactType, ";
						sql += "contactValue, ";
						sql += "employeeId, ";
						sql += "localAccountContactId, ";
						sql += "object ";
						sql += "from AccountContact ";
						sql += "where localAccountContactId = ? ";
						var accountContactArray = userDatabase.executeSql(sql, sqlExpression);

						for (i = 0; i < accountContactArray.length; i++){
							var accountContactInstance = accountContactModel.make({
								"accountContactId": accountContactArray[i].accountContactId,
								"accountId": accountContactArray[i].accountId,
								"contactLastUsedDate": getCurrentTimestampString(),
								"contactType": accountContactArray[i].contactType,
								"contactValue": accountContactArray[i].contactValue,
								"employeeId": accountContactArray[i].employeeId,
								"localAccountContactId": accountContactArray[i].localAccountContactId,
								"object": accountContactArray[i].object
							});
							accountContactInstance.save();
						}
					});
				}
				var i;

				for (i = 0; i < sendArray.length; i++){
					var localAccountContactId = sendArray[i].split("~")[0];
					var accountContactId = sendArray[i].split("~")[1];
					var signatureSendInstance = signatureSendModel.create({
						"accountContactId": accountContactId,
						"localAccountContactId": localAccountContactId,
						"localSignatureId": signatureHeaderInstance.get("localSignatureId"),
						"localSignatureSendId": 0,
						"signatureId": signatureHeaderInstance.get("signatureId"),
						"signatureSendId": 0,
						"employeeId": currentEmployeeId
					});
					signatureSendInstance.updateAttributes({
						"localSignatureSendId": signatureSendInstance.get("object")
					});
				}

				var transferHeaderString = "";
				$(".taskImage[src='images/uhs/checkbox-checked.png']").each(function (){
					var localTaskReferenceId = $(this).attr("data-localTaskReferenceId");
					transferHeaderString += localTaskReferenceId + ",";
				});
				transferHeaderString = transferHeaderString.substr(0, transferHeaderString.length - 1);

				sql = "select accountId, ";
				sql += "comment, ";
				sql += "cstat, ";
				sql += "deliveredByEmployeeId, ";
				sql += "deliveryDate, ";
				sql += "localSwapOutNumber, ";
				sql += "localTransferNumber, ";
				sql += "localUhsPatientId, ";
				sql += "orderBy, ";
				sql += "orderDate, ";
				sql += "postedByEmployeeId, ";
				sql += "purchaseOrder, ";
				sql += "status, ";
				sql += "swapOutFlag, ";
				sql += "swapOutNumber, ";
				sql += "telephoneNumber, ";
				sql += "transferDate, ";
				sql += "transferNumber, ";
				sql += "transferType, ";
				sql += "transferredByEmployeeId, ";
				sql += "uhsPatientId, ";
				sql += "object ";
				sql += "from transferHeader ";
				sql += "where localTransferNumber in ( " + transferHeaderString + " ) ";
				var transferHeaderArray = userDatabase.executeSql(sql);

				for (i = 0; i < transferHeaderArray.length; i++){
					var deliveryDate = "0001-01-01 00:00:00.0";
					var deliveredByEmployeeId = 0;
					if (transferHeaderArray[i].transferType == "P"){
						deliveryDate = currentTimestamp;
						deliveredByEmployeeId = currentEmployeeId;
					}
					else {
						deliveryDate = transferHeaderArray[i].deliveryDate;
						deliveredByEmployeeId = transferHeaderArray[i].deliveredByEmployeeId;
					}
					var transferHeaderInstance = transferHeaderModel.make({
						"accountId": transferHeaderArray[i].accountId,
						"comment": transferHeaderArray[i].comment,
						"cstat" : transferHeaderArray[i].cstat,
						"deliveredByEmployeeId": deliveredByEmployeeId,
						"deliveryDate": deliveryDate,
						"department": transferHeaderArray[i].department,
						"localSwapOutNumber": transferHeaderArray[i].localSwapOutNumber,
						"localTransferNumber": transferHeaderArray[i].localTransferNumber,
						"localUhsPatientId": transferHeaderArray[i].localUhsPatientId,
						"orderBy": transferHeaderArray[i].orderby,
						"orderDate": transferHeaderArray[i].orderDate,
						"postedByEmployeeId": transferHeaderArray[i].postedByEmployeeId,
						"purchaseOrder": transferHeaderArray[i].purchaseOrder,
						"status": "C",
						"swapOutFlag": transferHeaderArray[i].swapOutFlag,
						"swapOutNumber": transferHeaderArray[i].swapOutNumber,
						"telephoneNumber": transferHeaderArray[i].telephoneNumber,
						"transferDate": transferHeaderArray[i].transferDate,
						"transferNumber": transferHeaderArray[i].transferNumber,
						"transferType" : transferHeaderArray[i].transferType,
						"transferredByEmployeeId": transferHeaderArray[i].transferredByEmployeeId,
						"uhsPatientId": transferHeaderArray[i].uhsPatientId,
						"employeeId": currentEmployeeId,
						"object": transferHeaderArray[i].object
					});
					transferHeaderInstance.save();
				}

				hideInlineSignature();
				$("#tripContainer").attr("data-applicationMode", "");
				readTripDetail();
				$("#headerListContent").empty();
				$("#frameListContent").empty();
				userDatabase.commitTransaction();
			}
			catch(e) {
				Rho.Log.info("Error: signatureSaveCallback rollback = " + e, "inMotion");
				userDatabase.rollbackTransaction();
			}
			finally {
				Rho.Log.info("End: signatureSaveCallback", "inMotion");
			}
		}
	}
	else {
		Rho.Log.info("Error: signatureSaveCallback = Signature capture failed", "inMotion");
		alert("Signature capture failed");
	}
}

function toggleTasks(id){
	Rho.Log.info("Start: toggleTasks(" + id + ")", "inMotion");
	$(".taskContainer[data-accountId=" + id + "]").each(function(){
		if ($(this).is(":visible")){
			$(this).hide();
		}
		else {
			$(this).show();
		}
	});
	enableScanner();
	hideMenu();
	Rho.Log.info("End: toggleTasks", "inMotion");
}