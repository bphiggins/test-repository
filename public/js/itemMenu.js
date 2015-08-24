function addScan(id) {
	Rho.Log.info("Start: addScan(" + id + ")", "inMotion");

	userDatabase.startTransaction();
	try	{
		var localTransferNumber = $("#taskHeaderContainer").attr("data-localTransferNumber");
		var transferType = $("#taskHeaderContainer").attr("data-transferType");
		var prefix = id.split("~")[0];
		var unit = id.split("~")[1];
		var currentEmployeeId = $("#tripContainer").attr("data-currentEmployeeId");

		//update deliveryDate on transferHeader if first scan off truck
		var sqlExpression = [];
		sqlExpression[0] = localTransferNumber;

		var sql = "select sum(case when scanOffDate = '0001-01-01 00:00:00.0' then 0 else 1 end) as transferDetailCount ";
		sql += "from transferDetail td ";
		sql += "where td.localTransferNumber = ? ";
		var transferDetailCountArray = userDatabase.executeSql(sql, sqlExpression);

		if (transferDetailCountArray.length > 0){
			if (transferDetailCountArray[0].transferDetailCount == 0){
				//retrieve transferHeader
				sqlExpression = [];
				sqlExpression[0] = localTransferNumber;

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
				sql += "where localTransferNumber = ? ";
				var transferHeaderArray = userDatabase.executeSql(sql, sqlExpression);

				if (transferHeaderArray.length > 0){
					var transferHeaderInstance = transferHeaderModel.make({
						"accountId": transferHeaderArray[0].accountId,
						"comment": transferHeaderArray[0].comment,
						"cstat": transferHeaderArray[0].cstat,
						"deliveredByEmployeeId": currentEmployeeId,
						"deliveryDate": getCurrentTimestampString(),
						"department": transferHeaderArray[0].department,
						"localSwapOutNumber": transferHeaderArray[0].localSwapOutNumber,
						"localUhsPatientId": transferHeaderArray[0].localUhsPatientId,
						"orderBy": transferHeaderArray[0].orderBy,
						"orderDate": transferHeaderArray[0].orderDate,
						"postedByEmployeeId": transferHeaderArray[0].postedByEmployeeId,
						"purchaseOrder": transferHeaderArray[0].purchaseOrder,
						"status": transferHeaderArray[0].status,
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
				}
			}
		}

		//add scan off truck.
		sqlExpression = [];
		sqlExpression[0] = localTransferNumber;
		sqlExpression[1] = prefix;
		sqlExpression[2] = unit;

		sql = "select cstat, ";
		sql += "department, ";
		sql += "description, ";
		sql += "employeeId, ";
		sql += "employeeInitials, ";
		sql += "localTransferDetailId, ";
		sql += "localTransferNumber, ";
		sql += "localUhsPatientId, ";
		sql += "model, ";
		sql += "prefix, ";
		sql += "purchaseOrder, ";
		sql += "reasonRefused, ";
		sql += "refusedFlag, ";
		sql += "scanOnDate, ";
		sql += "scanOffDate, ";
		sql += "transferDate, ";
		sql += "transferDetailId, ";
		sql += "transferNumber, ";
		sql += "uhsPatientId, ";
		sql += "unit, ";
		sql += "vendor, ";
		sql += "object ";
		sql += "from TransferDetail ";
		sql += "where localTransferNumber = ? ";
		sql += "and prefix = ? ";
		sql += "and unit = ? ";
		var transferDetailArray = userDatabase.executeSql(sql, sqlExpression);

		if (transferDetailArray.length > 0){
			var transferDetailInstance = transferDetailModel.make({
				"cstat": transferDetailArray[0].cstat,
				"department": transferDetailArray[0].department,
				"description": transferDetailArray[0].description,
				"employeeId": transferDetailArray[0].employeeId,
				"employeeInitials": transferDetailArray[0].employeeInitials,
				"localTransferDetailId": transferDetailArray[0].localTransferDetailId,
				"localTransferNumber": transferDetailArray[0].localTransferNumber,
				"localUhsPatientId": transferDetailArray[0].localUhsPatientId,
				"model": transferDetailArray[0].model,
				"prefix": transferDetailArray[0].prefix,
				"purchaseOrder": transferDetailArray[0].purchaseOrder,
				"reasonRefused": transferDetailArray[0].reasonRefused,
				"refusedFlag": transferDetailArray[0].refusedFlag,
				"scanOffDate": getCurrentTimestampString(),
				"scanOnDate": transferDetailArray[0].scanOnDate,
				"transferDate": transferDetailArray[0].transferDate,
				"transferDetailId": transferDetailArray[0].transferDetailId,
				"transferNumber": transferDetailArray[0].transferNumber,
				"uhsPatientId": transferDetailArray[0].uhsPatientId,
				"unit": transferDetailArray[0].unit,
				"vendor": transferDetailArray[0].vendor,
				"object": transferDetailArray[0].object
			});

			transferDetailInstance.save();
		}

		userDatabase.commitTransaction();
		readTaskDetail(transferType + "~" + localTransferNumber);
		hideMenu();
	}
	catch (e) {
		Rho.Log.info("Error: addScan(" + e.message + ") - rolled back", "inMotion");
		userDatabase.rollbackTransaction();
	}
	finally {
		Rho.Log.info("End: addScan", "inMotion");
	}
}

function clearRefusal(id){
	Rho.Log.info("Start: clearRefusal(" + id + ")", "inMotion");
	var msg = confirm("You are about to clear the refusal from this item. \n\n Continue?");
	if (msg === true){
		userDatabase.startTransaction();
		try {
			var localTransferNumber = $("#taskHeaderContainer").attr("data-localTransferNumber");
			var transferType = $("#taskHeaderContainer").attr("data-transferType");
			var currentEmployeeId = $("#tripContainer").attr("data-currentEmployeeId");
			var prefix = id.split("~")[0];
			var unit = id.split("~")[1];
			var i;

			//remove any refusal pickup transfers, transferdetails, and comments. look for closed pickups with this prefix unit
			var sqlExpression = [];
			sqlExpression[0] = prefix;
			sqlExpression[1] = unit;

			var sql = "select th.accountId, ";
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
			sql += "from TransferHeader th ";
			sql += "inner join TransferDetail td ";
			sql += "on th.localTransferNumber = td.localTransferNumber ";
			sql += "inner join TripDetail trd ";
			sql += "on th.localTransferNumber = trd.localTaskReferenceId ";
			sql += "left outer join TransferComment tc ";
			sql += "on td.localTransferNumber = tc.localTransferNumber ";
			sql += "and td.prefix = tc.prefix ";
			sql += "and td.unit = tc.unit ";
			sql += "where th.transferType = 'P' ";
			sql += "and th.status = 'C' ";
			sql += "and td.refusedFlag = 'Y' ";
			sql += "and td.prefix = ? ";
			sql += "and td.unit = ? ";
			var refusalList = userDatabase.executeSql(sql, sqlExpression);
			var commentInstance;

			for (i = 0; i < refusalList.length; i++){
				var refusalPickupInstance = transferHeaderModel.make({
					"accountId": refusalList[i].accountId,
					"comment": refusalList[i].comment,
					"cstat": refusalList[i].cstat,
					"deliveredByEmployeeId": refusalList[i].deliveredByEmployeeId,
					"deliveryDate": refusalList[i].deliveryDate,
					"department": refusalList[i].department,
					"localSwapOutNumber": refusalList[i].localSwapOutNumber,
					"localTransferNumber": refusalList[i].localTransferNumber,
					"localUhsPatientId": refusalList[i].localUhsPatientId,
					"orderBy": refusalList[i].orderBy,
					"orderDate": refusalList[i].orderDate,
					"postedByEmployeeId": refusalList[i].postedByEmployeeId,
					"purchaseOrder": refusalList[i].purchaseOrder,
					"status": refusalList[i].status,
					"swapOutFlag": refusalList[i].swapOutFlag,
					"swapOutNumber": refusalList[i].swapOutNumber,
					"telephoneNumber": refusalList[i].telephoneNumber,
					"transferDate": refusalList[i].transferDate,
					"transferNumber": refusalList[i].transferNumber,
					"transferType": refusalList[i].transferType,
					"transferredByEmployeeId": refusalList[i].transferredByEmployeeId,
					"uhsPatientId": refusalList[i].uhsPatientId,
					"employeeId": currentEmployeeId,
					"object": refusalList[i].transferHeaderObject
				});
				refusalPickupInstance.destroy();

				var refusalPickupDetailInstance = transferDetailModel.make({
					"cstat": refusalList[i].cstat,
					"department": refusalList[i].department,
					"description": refusalList[i].description,
					"employeeId": refusalList[i].employeeId,
					"employeeInitials": refusalList[i].employeeInitials,
					"localTransferDetailId": refusalList[i].localTransferDetailId,
					"localTransferNumber": refusalList[i].localTransferNumber,
					"localUhsPatientId": refusalList[i].localUhsPatientId,
					"model": refusalList[i].model,
					"prefix": refusalList[i].prefix,
					"purchaseOrder": refusalList[i].purchaseOrder,
					"reasonRefused": refusalList[i].reasonRefused,
					"refusedFlag": refusalList[i].refusedFlag,
					"scanOffDate": refusalList[i].scanOffDate,
					"scanOnDate": refusalList[i].scanOnDate,
					"transferDate": refusalList[i].transferDate,
					"transferDetailId": refusalList[i].transferDetailId,
					"transferNumber": refusalList[i].transferNumber,
					"uhsPatientId": refusalList[i].uhsPatientId,
					"unit": refusalList[i].unit,
					"vendor": refusalList[i].vendor,
					"object": refusalList[i].transferDetailObject
				});

				refusalPickupDetailInstance.destroy();

				//remove any refusal transfer comment on the pickup
				commentInstance = transferCommentModel.make({
					"comment": refusalList[i].comment,
					"commentDate": refusalList[i].commentDate,
					"employeeId": refusalList[i].employeeId,
					"localTransferCommentId": refusalList[i].localTransferCommentId,
					"localTransferNumber": refusalList[i].localTransferNumber,
					"prefix": refusalList[i].prefix,
					"transferCommentId": refusalList[i].transferCommentId,
					"transferNumber": refusalList[i].transerNumber,
					"unit": refusalList[i].unit,
					"object": refusalList[i].transferCommentObject
				});

				commentInstance.destroy();

				//remove any tripDetail records associated with the pickup
				var tripDetailInstance = tripDetailModel.make({
					"accountId": refusalList[i].accountId,
					"employeeId": refusalList[i].employeeId,
					"localTaskReferenceId": refusalList[i].localTaskReferenceId,
					"localTripDetailId": refusalList[i].localTripDetailId,
					"localTripId": refusalList[i].localTripId,
					"scanLevel": refusalList[i].scanLevel,
					"taskReferenceId": refusalList[i].taskReferenceId,
					"taskType": refusalList[i].taskType,
					"tripDetailId": refusalList[i].tripDetailId,
					"tripId": refusalList[i].tripId,
					"object": refusalList[i].tripDetailObject
				});

				tripDetailInstance.destroy();
			}

			//remove any refusal transfer comments on the delivery
			sqlExpression = [];
			sqlExpression[0] = localTransferNumber;
			sqlExpression[1] = prefix;
			sqlExpression[2] = unit;

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
			sql += "and prefix = ? ";
			sql += "and unit = ? ";
			var commentList = userDatabase.executeSql(sql, sqlExpression);

			for (i = 0; i < commentList.length; i++){
				commentInstance = transferCommentModel.make({
					"comment": commentList[i].comment,
					"commentDate": commentList[i].commentDate,
					"employeeId": commentList[i].employeeId,
					"localTransferCommentId": commentList[i].localTransferCommentId,
					"localTransferNumber": commentList[i].localTransferNumber,
					"prefix": commentList[i].prefix,
					"transferCommentId": commentList[i].transferCommentId,
					"transferNumber": commentList[i].transerNumber,
					"unit": commentList[i].unit,
					"object": commentList[i].object
				});

				commentInstance.destroy();
			}

			//TODO update transferDetail record to remove refusal fields
			sqlExpression = [];
			sqlExpression[0] = localTransferNumber;
			sqlExpression[1] = prefix;
			sqlExpression[2] = unit;

			sql = "select cstat, ";
			sql += "department, ";
			sql += "description, ";
			sql += "employeeId, ";
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
			sql += "object ";
			sql += "from transferDetail ";
			sql += "where localTransferNumber = ? ";
			sql += "and prefix = ? ";
			sql += "and unit = ? ";
			var transferDetailList = userDatabase.executeSql(sql, sqlExpression);

			for (i = 0; i < transferDetailList.length; i++){
				var transferDetailInstance = transferDetailModel.make({
					"cstat": transferDetailList[0].cstat,
					"department": transferDetailList[0].department,
					"description": transferDetailList[0].description,
					"employeeId": transferDetailList[0].employeeId,
					"employeeInitials": transferDetailList[0].employeeInitials,
					"localTransferDetailId": transferDetailList[0].localTransferDetailId,
					"localTransferNumber": transferDetailList[0].localTransferNumber,
					"localUhsPatientid": transferDetailList[0].localUhsPatientid,
					"model": transferDetailList[0].model,
					"prefix": transferDetailList[0].prefix,
					"purchaseOrder": transferDetailList[0].purchaseOrder,
					"reasonRefused": "",
					"refusedFlag": "",
					"scanOffDate": transferDetailList[0].scanOffDate,
					"scanOnDate": transferDetailList[0].scanOnDate,
					"transferDate": transferDetailList[0].transferDate,
					"transferDetailId": transferDetailList[0].transferDetailId,
					"transferNumber": transferDetailList[0].transferNumber,
					"uhsPatientId": transferDetailList[0].uhsPatientId,
					"unit": transferDetailList[0].unit,
					"vendor": transferDetailList[0].vendor,
					"object": transferDetailList[0].object
				});

				transferDetailInstance.save();
			}
			userDatabase.commitTransaction();
			readTaskDetail(transferType + "~" + localTransferNumber);
			hideMenu();
		}
		catch(e){
			Rho.Log.info("Error: clearRefusal rollback = " + e, "inMotion");
			userDatabase.rollbackTransaction();
		}
		finally {
			Rho.Log.info("End: clearRefusal", "inMotion");
		}
	}
}

function damagedItem(id) {
	Rho.Log.info("Start: damagedItem(" + id + ")", "inMotion");
	var localTransferNumber = $("#taskHeaderContainer").attr("data-localTransferNumber");
	var transferNumber = $("#taskHeaderContainer").attr("data-transferNumber");
	var prefix = id.split("~")[0];
	var unit = id.split("~")[1];
	var sqlExpression = [];

	sqlExpression[0] = localTransferNumber;
	sqlExpression[1] = prefix;
	sqlExpression[2] = unit;

	var sql = "select d.accessoryMissing, ";
	sql += "d.customerReportedFailure, ";
	sql += "d.damagedItemDate, ";
	sql += "d.damagedItemId, ";
	sql += "d.localDamagedItemId, ";
	sql += "d.localTransferNumber, ";
	sql += "d.notes, ";
	sql += "d.otherDamage, ";
	sql += "d.prefix, ";
	sql += "d.transferNumber, ";
	sql += "d.unit, ";
	sql += "d.visibleDamage, ";
	sql += "d.object as damagedItemObject, ";
	sql += "dd.base64Image, ";
	sql += "dd.damagedItemDetailId, ";
	sql += "dd.damagedItemId, ";
	sql += "dd.localDamagedItemDetailId, ";
	//sql += "dd.localDamagedItemId, ";
	sql += "dd.object as damagedItemDetailObject ";
	sql += "from DamagedItem d ";
	sql += "left outer join DamagedItemDetail dd ";
	sql += "on d.localDamagedItemId = dd.localDamagedItemId ";
	sql += "where d.localTransferNumber = ? ";
	sql += "and d.prefix = ? ";
	sql += "and d.unit = ? ";
	var resultArray = userDatabase.executeSql(sql, sqlExpression);

	var damagedItemObj = {};
	var customerReportedFailure = 0;
	var accessoryMissing = 0;
	var visibleDamage = 0;
	var other = 0;
	var imageArray = [];
	
	if (resultArray.length === 0) {
		accessoryMissing = 0;
		customerReportedFailure = 0;
		other = 0;
		visibleDamage = 0;
		damagedItemObj.damagedItemDate = getCurrentTimestampString();
		damagedItemObj.damagedItemId = 0;
		damagedItemObj.localDamagedItemId = 0;
		damagedItemObj.localTransferNumber = localTransferNumber;
		damagedItemObj.notes = "";
		damagedItemObj.prefix = prefix;
		damagedItemObj.transferNumber = transferNumber;
		damagedItemObj.unit = unit;
	}
	else {
		for (var i=0; i < resultArray.length; i++){
			if (i === 0){
				accessoryMissing = resultArray[i].accessoryMissing;
				customerReportedFailure = resultArray[i].customerReportedFailure;
				other = resultArray[i].otherDamage;
				visibleDamage = resultArray[i].visibleDamage;
				damagedItemObj.damagedItemDate = resultArray[i].damagedItemDate;
				damagedItemObj.damagedItemId = resultArray[i].damagedItemId;
				damagedItemObj.localDamagedItemId = resultArray[i].localDamagedItemId;
				damagedItemObj.localTransferNumber = resultArray[i].localTransferNumber;
				damagedItemObj.notes = resultArray[i].notes;
				damagedItemObj.prefix = resultArray[i].prefix;
				damagedItemObj.transferNumber = resultArray[i].transferNumber;
				damagedItemObj.unit = resultArray[i].unit;
				damagedItemObj.object = resultArray[i].damagedItemObject;
			}
			if (resultArray[i].base64Image.length > 0){
				imageArray.push(resultArray[i].base64Image);
			}
		}
	}

	$.get("/public/templates/damagedItem.html", function(data){
		var template = Handlebars.compile(data);
		var templateWithData = template(damagedItemObj);
		
		modal.open({
			content: templateWithData,
			fullScreen: true
		}, saveDamagedItem);

		if (customerReportedFailure == 1){
			$("#customerReportedFailure").attr("src", "images/uhs/checkbox-checked.png");
		}
		if (accessoryMissing == 1){
			$("#accessoryMissing").attr("src", "images/uhs/checkbox-checked.png");
		}
		if (visibleDamage == 1){
			$("#visibleDamage").attr("src", "images/uhs/checkbox-checked.png");
		}
		if (other == 1){
			$("#other").attr("src", "images/uhs/checkbox-checked.png");
		}

		for (var i=0; i < imageArray.length; i++){
			$("#damagedItemPicture" + (i + 1)).attr("src", "data:image/jpeg;base64," + imageArray[i]);
			$("#damagedItemPicture" + (i + 1)).css({"height":"100px", "width":"133px"});
		}

		$("#customerReportedFailureLabel").off("click");
		$("#customerReportedFailureLabel").on("click", function(){
			toggleCheckbox("customerReportedFailure");
		});
		$("#customerReportedFailure").off("click");
		$("#customerReportedFailure").on("click", function(){
			toggleCheckbox("customerReportedFailure");
		});
		$("#accessoryMissingLabel").off("click");
		$("#accessoryMissingLabel").on("click", function(){
			toggleCheckbox("accessoryMissing");
		});
		$("#accessoryMissing").off("click");
		$("#accessoryMissing").on("click", function(){
			toggleCheckbox("accessoryMissing");
		});
		$("#visibleDamageLabel").off("click");
		$("#visibleDamageLabel").on("click", function(){
			toggleCheckbox("visibleDamage");
		});
		$("#visibleDamage").off("click");
		$("#visibleDamage").on("click", function(){
			toggleCheckbox("visibleDamage");
		});
		$("#otherLabel").off("click");
		$("#otherLabel").on("click", function(){
			toggleCheckbox("other");
		});
		$("#other").off("click");
		$("#other").on("click", function(){
			toggleCheckbox("other");
		});
		if (imageArray.length > 3){
			$("#takeDamagedItemPictureButton").off("click");
			$("#takeDamagedItemPictureButton").hide();
		}
		else {
			$("#takeDamagedItemPictureButton").off("click");
			$("#takeDamagedItemPictureButton").on("click", function(){
				takeDamagedItemPicture();
			});
		}
		damagedItemObj = null;
		imageArray = null;
	});
	Rho.Log.info("End: damagedItem", "inMotion");
}

function editItem(id) {
	Rho.Log.info("Start: editItem(" + id + ")", "inMotion");
	//do we need to populate the possible cstats from the backend database or can we hardcode them in the editItem template.
	//Current solution is hardcoding possible cstats in the editItem template
	//retrieve values from transfer detail record
	var localTransferNumber = $("#taskHeaderContainer").attr("data-localTransferNumber");
	var prefix = id.split("~")[0];
	var unit = id.split("~")[1];
	var sqlExpression = [];

	sqlExpression[0] = localTransferNumber;
	sqlExpression[1] = prefix;
	sqlExpression[2] = unit;

	var sql = "select cstat, ";
	sql += "department, ";
	sql += "description, ";
	sql += "employeeInitials, ";
	sql += "localTransferDetailId, ";
	sql += "localTransferNumber, ";
	sql += "localUhsPatientId, ";
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
	sql += "object ";
	sql += "from transferDetail ";
	sql += "where localTransferNumber = ? ";
	sql += "and prefix = ? ";
	sql += "and unit = ? ";
	var transferDetailArray = userDatabase.executeSql(sql, sqlExpression);

	if (transferDetailArray.length > 0){
		var transferDetailObj = transferDetailArray[0];
		$.get("/public/templates/editItem.html", function(data){
			var template = Handlebars.compile(data);
			var templateWithData = template(transferDetailObj);

			modal.open({
				content: templateWithData
			}, saveItem);
			$('#cstat').val(transferDetailArray[0].cstat);
			transferDetailArray = null;
			transferDetailObj = null;
		});
	}
	Rho.Log.info("End: editItem", "inMotion");
}

function editItemPatient(id) {
	Rho.Log.info("Start: editItemPatient(" + id + ")", "inMotion");
	//retrieve values from transfer detail record
	var localTransferNumber = $("#taskHeaderContainer").attr("data-localTransferNumber");
	var accountId = $("#taskHeaderContainer").attr("data-accountId");
	var prefix = id.split("~")[0];
	var unit = id.split("~")[1];

	var sqlExpression = [];
	sqlExpression[0] = localTransferNumber;
	sqlExpression[1] = prefix;
	sqlExpression[2] = unit;

	var sql = "select th.accountId, ";
	sql += "p.additionalPatientId, ";
	sql += "p.deliveryLocation, ";
	sql += "p.firstName, ";
	sql += "p.hospitalPatientId, ";
	sql += "p.lastName, ";
	sql += "p.localUhsPatientid, ";
	sql += "p.middleInitial, ";
	sql += "p.physiciansId, ";
	sql += "p.roomNumber, ";
	sql += "p.tradingPartnerId, ";
	sql += "p.uhsPatientId, ";
	sql += "p.object ";
	sql += "from TransferDetail td ";
	sql += "left outer join Patient p ";
	sql += "on td.localUhsPatientId = p.localUhsPatientId ";
	sql += "left outer join TransferHeader th ";
	sql += "on td.localTransferNumber = th.localTransferNumber ";
	sql += "where td.localTransferNumber = ? ";
	sql += "and td.prefix = ? ";
	sql += "and td.unit = ? ";
	var patientArray = userDatabase.executeSql(sql, sqlExpression);

	var patientObj = {};
	if (patientArray.length > 0){
		if (patientArray[0].object.length > 0){
			patientObj.accountId = patientArray[0].accountId;
			patientObj.additionalPatientId = patientArray[0].additionalPatientId;
			patientObj.deliveryLocation = patientArray[0].deliveryLocation;
			patientObj.firstName = patientArray[0].firstName;
			patientObj.hospitalPatientId = patientArray[0].hospitalPatientId;
			patientObj.lastName = patientArray[0].lastName;
			patientObj.localUhsPatientid = patientArray[0].localUhsPatientid;
			patientObj.middleInitial = patientArray[0].middleInitial;
			patientObj.physiciansId = patientArray[0].physiciansId;
			patientObj.roomNumber = patientArray[0].roomNumber;
			patientObj.tradingPartnerId = patientArray[0].tradingPartnerId;
			patientObj.uhsPatientId = patientArray[0].uhsPatientId;
			patientObj.object = patientArray[0].object;
		}

		else {
			patientObj.accountId = accountId;
			patientObj.additionalPatientId = "";
			patientObj.deliveryLocation = "";
			patientObj.firstName = "";
			patientObj.hospitalPatientId = "";
			patientObj.localUhsPatientid = 0;
			patientObj.lastName = "";
			patientObj.middleInitial = "";
			patientObj.physiciansId = "";
			patientObj.roomNumber = "";
			patientObj.tradingPartnerId = "";
			patientObj.uhsPatientId = 0;
		}
	}

	//get template
	$.get("/public/templates/editPatient.html", function(data){
		var template = Handlebars.compile(data);
		var templateWithData = template(patientObj);

		modal.open({
			content: templateWithData
		}, function(){
			var hospitalPatientId = $("#hospitalPatientId").val().toUpperCase();
			var lastName = $("#lastName").val().toUpperCase();
			var roomNumber = $("#roomNumber").val().toUpperCase();
			var errMsgs = [];
			if (hospitalPatientId.length === 0 && lastName.length === 0 && roomNumber.length === 0) {
				errMsgs.push("You must provide last name, room number, or hospital patient ID.\n" );
			}

			if (errMsgs.length !== 0) {
				alert('The following errors must be corrected before you can continue:\n\n' + errMsgs.join('\n'));
				return false;
			}
			else {
				saveEditItemPatient(id);
				id = null;
			}
		});
		patientObj = null;
	});
	Rho.Log.info("End: editItemPatient", "inMotion");
}

function editPreferredAccessory(id) {
	Rho.Log.info("Start: editPreferredAccessory(" + id + ")", "inMotion");

	var prefix = id.split("~")[0];
	var unit = id.split("~")[1];
	var department = id.split("~")[2];
	var localTransferNumber = $("#taskHeaderContainer").attr("data-localTransferNumber");
	var accountId = $("#taskHeaderContainer").attr("data-accountId");
	var hasUnitAccessoryTracking = $("#taskHeaderContainer").attr("data-hasUnitAccessoryTracking");
	var sqlExpression;
	var sql;
	var accessoryArray;
	var accessoryObjList;
	var accessoryObj;
	var i;

	if (hasUnitAccessoryTracking == "1"){
		sqlExpression = [];
		sqlExpression[0] = localTransferNumber;
		sqlExpression[1] = prefix.toUpperCase();
		sqlExpression[2] = unit;
		sqlExpression[3] = accountId;
		sqlExpression[4] = department;
		sqlExpression[5] = prefix.toUpperCase();

		//get records
		sql = "SELECT itemDescription, ";
		sql += "quantity, ";
		sql += "pa.stockNumber, ";
		sql += "case when ta.actualQuantity is null then 0 else ta.actualQuantity end as actualQuantity ";
		sql += "FROM PreferredAccessory pa ";
		sql += "left outer join (SELECT stockNumber, count(*) as actualQuantity ";
		sql += "FROM transferredUnitAccessories ";
		sql += "where localTransferNumber = ? ";
		sql += "and prefix = ? ";
		sql += "and unit = ? ";
		sql += "group by stockNumber) ta ";
		sql += "on pa.stockNumber = ta.stockNumber ";
		sql += "where accountId = ? ";
		sql += "and department = ? ";
		sql += "and prefix = ? ";
		accessoryArray = userDatabase.executeSql(sql, sqlExpression);

		accessoryObjList = [];
		for (i = 0; i < accessoryArray.length; i++){
			accessoryObj = {};
			accessoryObj.quantity = accessoryArray[i].quantity;
			accessoryObj.actualQuantity = accessoryArray[i].actualQuantity;
			accessoryObj.stockNumber = accessoryArray[i].stockNumber;
			accessoryObj.itemDescription = accessoryArray[i].itemDescription;
			accessoryObjList.push(accessoryObj);
		}
	}
	else {
		sqlExpression = [];
		sqlExpression[0] = localTransferNumber;
		sqlExpression[1] = prefix.toUpperCase();
		sqlExpression[2] = localTransferNumber;
		sqlExpression[3] = prefix.toUpperCase();
		sqlExpression[4] = accountId;
		sqlExpression[5] = department;
		sqlExpression[6] = prefix.toUpperCase();

		sql = "SELECT itemDescription, ";
		sql += "quantity as preferredUnitQuantity, ";
		sql += "pa.stockNumber, ";
		sql += "pa.itemDescription, ";
		sql += "case when ta.totalQuantity is null then 0 else ta.totalQuantity end as totalQuantity, ";
 		sql += "case when td.unitCount is null then 0 else td.unitCount end as unitCount ";
		sql += "FROM PreferredAccessory pa ";
		sql += "left outer join ( ";
		sql += "SELECT accessory, quantity as totalQuantity ";
		sql += "FROM transferredPrefixAccessories ";
		sql += "where localTransferNumber = ? ";
		sql += "and prefix = ? ";
		sql += "group by accessory ";
		sql += ") ta ";
		sql += "on pa.itemDescription = ta.accessory ";
		sql += "left outer join ( ";
		sql += "select localTransferNumber, prefix, count(*) as unitCount ";
		sql += "from TransferDetail ";
		sql += "where localTransferNumber = ? ";
		sql += "and prefix= ? ";
		sql += "group by localTransferNumber, prefix ";
		sql += ") td ";
		sql += "on pa.prefix = td.prefix ";
		sql += "where accountId = ? ";
		sql += "and department = ? ";
		sql += "and pa.prefix = ? ";

		accessoryArray = userDatabase.executeSql(sql, sqlExpression);
		accessoryObjList = [];

		for (i = 0; i < accessoryArray.length; i++){
			accessoryObj = {};
			accessoryObj.quantity = accessoryArray[i].preferredUnitQuantity;

			if (accessoryArray[i].unitCount > 0){
				accessoryObj.actualQuantity = accessoryArray[i].totalQuantity / accessoryArray[i].unitCount;
			}
			else {
				accessoryObj.actualQuantity = 0;
			}

			accessoryObj.stockNumber = accessoryArray[i].stockNumber;
			accessoryObj.itemDescription = accessoryArray[i].itemDescription;
			accessoryObjList.push(accessoryObj);
		}
	}

	var jsonAccessory = {};
	jsonAccessory.prefix = prefix.toUpperCase();
	jsonAccessory.unit = unit;
	jsonAccessory.accessoryList = accessoryObjList;
	$.get("/public/templates/preferredAccessory.html", function(data){
		var template = Handlebars.compile(data);
		var templateWithData = template(jsonAccessory);

		modal.open({
			content: templateWithData,
			fullScreen: true,
			hideSave: (jsonAccessory.accessoryList.length === 0),
			enableScroll: true
		}, savePreferredAccessory);
		jsonAccessory = null;
	});
	Rho.Log.info("End: editPreferredAccessory", "inMotion");
}

function readTaskDetail(id) {
	Rho.Log.info("Start: readTaskDetail(" + id + ")", "inMotion");

	var taskType = id.split("~")[0];
	var taskId = id.split("~")[1];
	var accountId;
	var sqlExpression;
	var sql;
	var i;

	if (taskType == "Find"){
		accountId = id.split("~")[2];
		sqlExpression = [];
		sqlExpression[0] = accountId;
		
		sql = "SELECT fe.prefix, "; 
		sql += "fe.unit, ";
		sql += "description, "; 
		sql += "cstat "; 
		sql += "from FindEquipment fe ";
		sql += "left outer join ( ";
		sql += "select prefix, unit ";
		sql += "from TransferDetail td ";
		sql += "inner join TransferHeader th ";
		sql += "on td.localTransferNumber = th.localTransferNumber ";
		sql += "where transferType = 'P' ";
		sql += ") tdh ";
		sql += "on fe.prefix = tdh.prefix ";
		sql += "and fe.unit = tdh.unit ";
		sql += "where cstat in ('N1', 'N2', 'U1', 'U2') "; 
		sql += "and accountId = ? ";
		sql += "and tdh.prefix is null ";
		sql += "order by fe.prefix, fe.unit "; 

		var findEquipmentArray = userDatabase.executeSql(sql, sqlExpression);

		var equipmentObjList = [];
		var equipmentObj;
		for (i = 0; i < findEquipmentArray.length; i++){
			equipmentObj = {};
			equipmentObj.prefix = findEquipmentArray[i].prefix;
			equipmentObj.unit = findEquipmentArray[i].unit;
			equipmentObj.dspUnit = formatNumberLength(findEquipmentArray[i].unit, 4);
			equipmentObj.description = findEquipmentArray[i].description;
			equipmentObj.cstat = findEquipmentArray[i].cstat;
			equipmentObjList.push(equipmentObj);
		}

		var jsonObj = {};
		jsonObj.equipment = equipmentObjList;

		$.get("/public/templates/findEquipment.html", function(data){
			var template = Handlebars.compile(data);
			$("#frameListContent").replaceWith(template(jsonObj));
			refreshFrameListScroll();

			$( ".findEquipmentTextContainer" ).off( "click" );
			$( ".findEquipmentTextContainer" ).on( "click", function() {
				var id = $(this).attr("data-itemId");
				toggleNotFound(id);
			});

			$( "#saveFindEquipmentButton" ).off( "click" );
			$( "#saveFindEquipmentButton" ).on( "click", function() {
				saveFindEquipment();
			});
			enableScanner();
			jsonObj = null;
		});
	}
	else {
		try {
			sqlExpression = [];
			sqlExpression[0] = taskId;
			sqlExpression[1] = taskId;
			sqlExpression[2] = taskId;
			sqlExpression[3] = taskId;

			//get totals of ordered and scanned
			sql = "select trim(eo.prefix) as prefix, ";
			sql += "eo.description as description, ";
			sql += "eo.quantityOrdered as quantityOrdered, ";
			sql += "case when (td.quantityScanned) is null then 0 else td.quantityScanned end as quantityScanned ";
			sql += "from ( ";
			sql += "select trim(prefix) as prefix, ";
			sql += "max(description) as description, ";
			sql += "sum(quantityOrdered) as quantityOrdered ";
			sql += "from transferEquipmentOrder ";
			sql += "where localTransferNumber = ? ";
			sql += "group by trim(prefix) ";
			sql += ") eo ";
			sql += "left outer join ( ";
			sql += "select trim(prefix) as prefix, ";
			sql += "max(description) as description, ";
			sql += "sum(1) as quantityScanned ";
			sql += "from transferDetail ";
			sql += "where localTransferNumber = ? ";
			sql += "group by trim(prefix) ";
			sql += ") td ";
			sql += "on eo.prefix = td.prefix ";
			sql += "union ";
			sql += "select trim(td.prefix) as prefix, ";
			sql += "td.description as description, ";
			sql += "case when eo.quantityOrdered is null then 0 else eo.quantityOrdered end as quantityOrdered, ";
			sql += "quantityScanned as quantityScanned ";
			sql += "from ( ";
			sql += "select trim(prefix) as prefix, ";
			sql += "max(description) as description, ";
			sql += "sum(1) as quantityScanned ";
			sql += "from transferDetail ";
			sql += "where localTransferNumber = ? ";
			sql += "group by trim(prefix) ";
			sql += ") td ";
			sql += "left outer join ( ";
			sql += "select trim(prefix) as prefix, ";
			sql += "max(description) as description, ";
			sql += "sum(quantityOrdered) as quantityOrdered ";
			sql += "from transferEquipmentOrder ";
			sql += "where localTransferNumber = ? ";
			sql += "group by trim(prefix) ";
			sql += ") eo ";
			sql += "on td.prefix = eo.prefix ";
			sql += "where eo.prefix is null ";

			var totalArray = userDatabase.executeSql(sql, sqlExpression);
			var totalObjList = [];
			var totalsObjList = [];
			var totalObj = {};
			var transferDetailObj;
			var transferDetailObjList = [];
			var totalQuantityScanned = 0;
			var totalQuantityOrdered = 0;

			for (i = 0; i < totalArray.length; i++){
				totalObj = {};
				totalObj.prefix = totalArray[i].prefix;
				totalObj.description = totalArray[i].description;
				totalObj.quantityOrdered = totalArray[i].quantityOrdered;
				totalObj.quantityScanned = totalArray[i].quantityScanned;
				if (i % 2 === 0){
					totalObj.rowClass = "listOddRow";
				}
				else {
					totalObj.rowClass = "listEvenRow";
				}
				totalObjList.push(totalObj);

				totalQuantityScanned += parseInt(totalArray[i].quantityScanned);
				totalQuantityOrdered += parseInt(totalArray[i].quantityOrdered);
			}

			totalObj = {};
			totalObj.prefix = "";
			totalObj.rowClass = "";
			totalObj.description = "Total";
			totalObj.quantityOrdered = totalQuantityOrdered;
			totalObj.quantityScanned = totalQuantityScanned;
			totalsObjList.push(totalObj);

			accountId = $("#taskHeaderContainer").attr("data-accountId");
			sqlExpression = [];
			sqlExpression[0] = taskId;
			sqlExpression[1] = accountId;
			sqlExpression[2] = taskId;

			sql = "SELECT ";
			sql += "td.description, ";
			sql += "td.employeeInitials, ";
			sql += "td.employeeId, ";
			sql += "td.prefix, ";
			sql += "td.reasonRefused, ";
			sql += "td.refusedFlag, ";
			sql += "td.transferDate, ";
			sql += "td.transferNumber, ";
			sql += "td.localTransferNumber, ";
			sql += "td.unit, ";
			sql += "td.department, ";
			sql += "td.object, ";
			sql += "td.scanOnDate, ";
			sql += "td.scanOffDate, ";
			sql += "case when th.department <> td.department then td.department else '' end as dspDepartment, ";
			sql += "case when th.purchaseOrder <> td.purchaseOrder then td.purchaseOrder else '' end as purchaseOrder, ";
			sql += "case when th.localUhsPatientId <> td.localUhsPatientId then  ";
			sql += "case when length(tdp.lastName) > 0 then tdp.lastName || case when length(tdp.firstName) > 0 then ', ' || tdp.firstName || ' ' || tdp.middleInitial else '' end || case when length(tdp.roomNumber) > 0 then ', ' || tdp.roomNumber else '' end when length(tdp.hospitalPatientId) > 0 then tdp.hospitalPatientId || case when length(tdp.roomNumber) > 0 then ', ' || tdp.roomNumber else '' end else trim(tdp.additionalPatientId) || case when length(tdp.roomNumber) > 0 then ', ' || tdp.roomNumber else '' end end ";
			sql += "else  ";
			sql += "'' ";
			sql += "end as patientName, ";
			sql += "case when damagedItemCount is not null then 1 else 0 end as damagedItemCount, ";
			sql += "case when preferredAccessoryCount is not null then 1 else 0 end as preferredAccessoryCount ";
			sql += "FROM  TransferDetail td ";
			sql += "left outer join TransferHeader th ";
			sql += "on td.localTransferNumber = th.localTransferNumber ";
			sql += "left outer  join Patient tdp ";
			sql += "on td.localUhsPatientId = tdp.localUhsPatientId ";
			sql += "left outer join (select di.localTransferNumber, di.prefix, di.unit, count(*) as damagedItemCount ";
			sql += "from DamagedItem di ";
			sql += "where localTransferNumber = ? ";
			sql += "group by di.localTransferNumber, di.prefix, di.unit ";
			sql += ") di ";
			sql += "on td.localTransferNumber = di.localTransferNumber ";
			sql += "and td.prefix = di.prefix ";
			sql += "and td.unit = di.unit ";
			sql += "left outer join (SELECT accountId, department, prefix, count(*) as preferredAccessoryCount ";
			sql += "FROM PreferredAccessory pa ";
			sql += "where accountId = ? ";
			sql += "group by accountId, department, prefix) pa ";
			sql += "on th.accountId = pa.accountId ";
			sql += "and td.department = pa.department ";
			sql += "and td.prefix = pa.prefix ";
			sql += "where td.localTransferNumber = ? ";
			sql += "order by td.prefix, td.unit ";
			var resultArray = userDatabase.executeSql(sql, sqlExpression);

			var scanOnDate;
			var scanOffDate;
			var description;
			for (i = 0; i < resultArray.length; i++) {
				transferDetailObj = {};
				transferDetailObj.prefix = resultArray[i].prefix;
				transferDetailObj.unit = resultArray[i].unit;
				transferDetailObj.department = resultArray[i].department;
				if (resultArray[i].description.length > 25){
					description = resultArray[i].description.substr(0,25) + "...";
				}
				else {
					description = resultArray[i].description;
				}
				transferDetailObj.itemDescription = resultArray[i].prefix + " "  + formatNumberLength(resultArray[i].unit,4) + " " + description;
				transferDetailObj.itemDescription2 = resultArray[i].dspDepartment.substr(0, 20) + " " + resultArray[i].purchaseOrder.substr(0, 10) + " " + resultArray[i].patientName.substr(0, 20);

				scanOnDate = resultArray[i].scanOnDate;
				scanOffDate = resultArray[i].scanOffDate;

				if (resultArray[i].refusedFlag == "Y"){
					transferDetailObj.scanImage = "images/uhs/refusedItem.png";
				}
				else if (scanOffDate == "0001-01-01 00:00:00.0"){
					transferDetailObj.scanImage = "images/uhs/scanOnVehicle.png";
				}
				else {
					transferDetailObj.scanImage = "images/uhs/scanOffVehicle.png";
				}

				//display hasAccessories image if the item has accessories
				if (resultArray[i].preferredAccessoryCount == 1){
					transferDetailObj.hasAccessoryImage = "images/uhs/hasAccessory.png";
				}
				else {
					transferDetailObj.hasAccessoryImage = "images/uhs/blank.png";
				}

				//display damagedItem image if the item has damagedItem pictures
				if (resultArray[i].damagedItemCount == 1){
					transferDetailObj.hasDamagedItemImage = "images/uhs/hasDamagedItem.png";
				}
				else {
					transferDetailObj.hasDamagedItemImage = "images/uhs/blank.png";
				}
				transferDetailObjList.push(transferDetailObj);
			}

			var jsonItems = {};
			jsonItems.transferTotals = totalObjList;
			jsonItems.transferUnits = transferDetailObjList;
			jsonItems.transferOrderTotal = totalsObjList;

			$.get("/public/templates/readTaskDetail.html", function(data){
				try {
					var template = Handlebars.compile(data);
					$("#frameListContent").replaceWith(template(jsonItems));
					refreshFrameListScroll();

					$(".taskDetailImageContainer4").off("click");
					$(".taskDetailImageContainer4").on("click", function() {
						var id = $(this).attr("data-itemId");
						showMenu("right", "item", id);
					});
					enableScanner();
					jsonItems = null;
				}
				catch (err) {
					Rho.Log.info("Error: readtaskdetail.html(" + err.message + ")", "inMotion");
				}
			});
		}
		catch (e) {
			Rho.Log.info("Error: readTaskDetail(" + e.message + ")", "inMotion");
		}
	}
	Rho.Log.info("End: readTaskDetail", "inMotion");
}

function refuseItem(id){
	Rho.Log.info("Start: refuseItem(" + id + ")", "inMotion");

	var localTransferNumber = $("#taskHeaderContainer").attr("data-localTransferNumber");
	var prefix = id.split("~")[0];
	var unit = id.split("~")[1];

	//get all transfer detail records
	//set sql parameter array
	var sqlExpression = [];
	sqlExpression[0] = localTransferNumber;
	sqlExpression[1] = prefix;
	sqlExpression[2] = unit;

	var sql = "select td.cstat, ";
	sql += "td.department, ";
	sql += "td.description, ";
	sql += "td.employeeInitials, ";
	sql += "td.prefix, ";
	sql += "td.purchaseOrder, ";
	sql += "td.reasonRefused, ";
	sql += "td.refusedFlag, ";
	sql += "td.transferDate, ";
	sql += "td.transferNumber, ";
	sql += "td.uhsPatientId, ";
	sql += "td.unit, ";
	sql += "td.object, ";
	sql += "case when length(p.lastName) > 0 then p.lastName || case when length(p.firstName) > 0 then ', ' || p.firstName || ' ' || p.middleInitial else '' end || case when length(p.roomNumber) > 0 then ', ' || p.roomNumber else '' end when length(p.hospitalPatientId) > 0 then p.hospitalPatientId || case when length(p.roomNumber) > 0 then ', ' || p.roomNumber else '' end else trim(p.additionalPatientId) || case when length(p.roomNumber) > 0 then ', ' || p.roomNumber else '' end end as patientName ";
	sql += "from TransferDetail td ";
	sql += "left outer join Patient p ";
	sql += "on td.localUhsPatientId = p.localUhsPatientId ";
	sql += "where localTransferNumber = ? ";
	sql += "and prefix = ? ";
	sql += "and unit = ? ";
	sql += "and refusedFlag = '' ";
	var resultArray = userDatabase.executeSql(sql, sqlExpression);

	displayRefusedDialog(resultArray, "item");
	Rho.Log.info("End: refuseItem", "inMotion");
}

function removeItemPatient(id){
	Rho.Log.info("Start: removeItemPatient(" + id + ")", "inMotion");

	var msg = confirm("You are about to remove the patient from this item. \n\n Continue?");
	if (msg === true){

		//update transfer detail with uhspatientid
		var localTransferNumber = $("#taskHeaderContainer").attr("data-localTransferNumber");
		var transferType = $("#taskHeaderContainer").attr("data-transferType");
		var prefix = id.split("~")[0];
		var unit = id.split("~")[1];

		var sqlExpression = [];
		sqlExpression[0] = localTransferNumber;
		sqlExpression[1] = prefix;
		sqlExpression[2] = unit;

		var sql = "select cstat, ";
		sql += "department, ";
		sql += "description, ";
		sql += "employeeInitials, ";
		sql += "localTransferDetailId, ";
		sql += "localTransferNumber, ";
		sql += "localUhsPatientid, ";
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
		sql += "employeeId, ";
		sql += "object ";
		sql += "from transferDetail ";
		sql += "where localTransferNumber = ? ";
		sql += "and prefix = ? ";
		sql += "and unit = ? ";
		var transferDetailArray = userDatabase.executeSql(sql, sqlExpression);

		if (transferDetailArray.length > 0){
			var transferDetailInstance = transferDetailModel.make({
				"cstat": transferDetailArray[0].cstat,
				"department": transferDetailArray[0].department,
				"description": transferDetailArray[0].description,
				"employeeInitials": transferDetailArray[0].employeeInitials,
				"localTransferDetailId": transferDetailArray[0].localTransferDetailId,
				"localTransferNumber": transferDetailArray[0].localTransferNumber,
				"localUhsPatientId": 0,
				"prefix": transferDetailArray[0].prefix,
				"purchaseOrder": transferDetailArray[0].purchaseOrder,
				"reasonRefused": transferDetailArray[0].reasonRefused,
				"refusedFlag": transferDetailArray[0].refusedFlag,
				"scanOffDate": transferDetailArray[0].scanOffDate,
				"scanOnDate": transferDetailArray[0].scanOnDate,
				"transferDate": transferDetailArray[0].transferDate,
				"transferDetailId": transferDetailArray[0].transferDetailId,
				"transferNumber": transferDetailArray[0].transferNumber,
				"uhsPatientId": 0,
				"unit": transferDetailArray[0].unit,
				"employeeId": transferDetailArray[0].employeeId,
				"object": transferDetailArray[0].object
			});

			transferDetailInstance.save();
			readTaskDetail(transferType + "~" + localTransferNumber);
			hideMenu();
		}
	}
	Rho.Log.info("End: removeItemPatient", "inMotion");
}

function removeScan(id){
	Rho.Log.info("Start: removeScan(" + id + ")", "inMotion");

	var localTransferNumber = $("#taskHeaderContainer").attr("data-localTransferNumber");
	var transferType = $("#taskHeaderContainer").attr("data-transferType");
	var scanLevel = $("#taskHeaderContainer").attr("data-scanLevel");
	var hasUnitAccessoryTracking = $("#taskHeaderContainer").attr("data-hasUnitAccessoryTracking");
	var currentEmployeeId = $("#tripContainer").attr("data-currentEmployeeId");
	var prefix = id.split("~")[0];
	var unit = id.split("~")[1];
	var sql = "";
	var sqlExpression = [];
	var resultArray;

	try {
		sqlExpression[0] = localTransferNumber;
		sqlExpression[1] = prefix;
		sqlExpression[2] = unit;

		sql = "select ";
		sql += "tfd.cstat, ";
		sql += "tfd.department, ";
		sql += "tfd.description, ";
		sql += "tfd.employeeInitials, ";
		sql += "tfd.localTransferDetailId, ";
		sql += "tfd.localTransferNumber, ";
		sql += "tfd.localUhsPatientid, ";
		sql += "tfd.prefix, ";
		sql += "tfd.purchaseOrder, ";
		sql += "tfd.reasonRefused, ";
		sql += "tfd.refusedFlag, ";
		sql += "tfd.scanOffDate, ";
		sql += "tfd.scanOnDate, ";
		sql += "tfd.transferDate, ";
		sql += "tfd.transferDetailId, ";
		sql += "tfd.transferNumber, ";
		sql += "tfd.uhsPatientId, ";
		sql += "tfd.unit, ";
		sql += "tfd.employeeId, ";
		sql += "tfd.object as transferDetailObject ";
		sql += "from TransferDetail tfd ";
		sql += "left outer join TripDetail td ";
		sql += "on tfd.localTransferNumber = td.localTaskReferenceId ";
		sql += "where tfd.localTransferNumber = ? ";
		sql += "and tfd.prefix = ? ";
		sql += "and tfd.unit = ?";
		resultArray = userDatabase.executeSql(sql, sqlExpression);
	}
	catch (e) {
		Rho.Log.info("Error: removeScan(" + e.message + ")", "inMotion");
		alert("Unable to process request");
		return;
	}

	var msgText = "You are about to remove the scanned item from the task. \n\n Continue?";
	if (scanLevel == "1" && resultArray[0].scanOffDate == "0001-01-01 00:00:00.0") {
		alert("You may not remove an item after checkout, please refuse the item instead.");
		return;
	}
	else if (scanLevel == "1") {
		msgText = "You are about to remove the \"scan off truck\" confirmation. \n\n Continue?";
	}

	var msg = confirm(msgText);
	if (msg === true){
		/*
			depending on the trip status remove the proper scan.
			If after checkout remove the scan off truck.
			If before checkout remove the transfer detail record and the equipment scan record
		*/
		userDatabase.startTransaction();
		try {
			var accessoriesList;
			var accessoryInstance;
			var transferDetailInstance;
			var i;

			if (scanLevel == "0"){
				sqlExpression = [];
				sqlExpression[0] = localTransferNumber;
				sqlExpression[1] = prefix;
				sqlExpression[2] = localTransferNumber;

				if (hasUnitAccessoryTracking == 0){
					sql = "select accessory, ";
					sql += "employeeId, ";
					sql += "pa.localTransferNumber, ";
					sql += "localTransferPrefixId, ";
					sql += "pa.prefix, ";
					sql += "quantity, ";
					sql += "transferNumber, ";
					sql += "transferPrefixId, ";
					sql += "unitCount, ";
					sql += "object ";
					sql += "from TransferredPrefixAccessories pa ";
					sql += "left outer join ( ";
					sql += "select localTransferNumber, prefix, count(*) as unitCount ";
					sql += "from TransferDetail ";
					sql += "where localTransferNumber = ? ";
					sql += "and prefix= ? ";
					sql += "group by localTransferNumber, prefix ";
					sql += ") td ";
					sql += "on td.localTransferNumber = pa.localTransferNumber ";
					sql += "and pa.prefix = td.prefix ";
					sql += "where pa.localTransferNumber = ?";
					accessoriesList = userDatabase.executeSql(sql, sqlExpression);

					for (i = 0; i < accessoriesList.length; i++){
						var accessoryPerUnitCount = accessoriesList[i].quantity / accessoriesList[i].unitCount;
						var adjAccessoryQuantity = accessoryPerUnitCount * (accessoriesList[i].unitCount - 1);
						if (adjAccessoryQuantity > 0){
							accessoryInstance = transferredPrefixAccessoriesModel.make({
								"accessory": accessoriesList[i].accessory,
								"employeeId": accessoriesList[i].employeeId,
								"localTransferNumber": accessoriesList[i].localTransferNumber,
								"localTransferPrefixId": accessoriesList[i].localTransferPrefixId,
								"prefix": accessoriesList[i].prefix,
								"quantity": adjAccessoryQuantity,
								"transferNumber": accessoriesList[i].transferNumber,
								"transferPrefixId": accessoriesList[i].transferPrefixId,
								"object": accessoriesList[i].object
							});

							accessoryInstance.save();
						}
						else {
							accessoryInstance = transferredPrefixAccessoriesModel.make({
								"accessory": accessoriesList[i].accessory,
								"employeeId": accessoriesList[i].employeeId,
								"localTransferNumber": accessoriesList[i].localTransferNumber,
								"localTransferPrefixId": accessoriesList[i].localTransferPrefixId,
								"prefix": accessoriesList[i].prefix,
								"quantity": accessoriesList[i].quantity,
								"transferNumber": accessoriesList[i].transferNumber,
								"transferPrefixId": accessoriesList[i].transferPrefixId,
								"object": accessoriesList[i].object
							});

							accessoryInstance.destroy();
						}
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

					for (i = 0; i < accessoriesList.length; i++){

						//TODO Get Surplus Retrieved Accessories
						sqlExpression = [];
						sqlExpression[0] = accessoriesList[i].localAccessoryTransferId;

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

						//delete surplusRetrievedAccessories
						for (var m=0; m < surplusList.length; m++){
							var surplusInstance = surplusRetrievedAccessoriesModel.make({
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

						//delete transferredUnitAccessories
						accessoryInstance = transferredUnitAccessoriesModel.make({
							"accessoryIsDamaged": accessoriesList[i].accessoryIsDamaged,
							"accessoryIsLost": accessoriesList[i].accessoryIsLost,
							"accessoryTransferId": accessoriesList[i].accessoryTransferId,
							"employeeId": accessoriesList[i].employeeId,
							"localAccessoryTransferId": accessoriesList[i].localAccessoryTransferId,
							"localMatchingAccessoryTransferId": accessoriesList[i].localMatchingAccessoryTransferId,
							"localTransferNumber": accessoriesList[i].localTansferNumber,
							"lostReportUserId": accessoriesList[i].lostReportUserId,
							"lostStatusId": accessoriesList[i].lostStatusId,
							"matchingAccessoryTransferId": accessoriesList[i].matchingAccessoryTransferId,
							"outOfStock": accessoriesList[i].outOfStock,
							"prefix": accessoriesList[i].prefix,
							"stockNumber": accessoriesList[i].stockNumber,
							"substituteStockNumber": accessoriesList[i].substituteStockNumber,
							"transferDate": accessoriesList[i].transferDate,
							"transferNumber": accessoriesList[i].transferNumber,
							"transferType": accessoriesList[i].transferType,
							"unit": accessoriesList[i].unit,
							"object": accessoriesList[i].object,
						});

						accessoryInstance.destroy();
					}
				}

				//TODO remove any swapouts
				sqlExpression = [];
				sqlExpression[0] = localTransferNumber;
				sqlExpression[1] = prefix;
				sqlExpression[2] = unit;

				sql = "select deliveryPrefix ";
				sql += "deliveryTransferNumber, ";
				sql += "deliveryUnit, ";
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
				sql += "and pickupPrefix = ? ";
				sql += "and pickupUnit = ? ";
				var swapoutList = userDatabase.executeSql(sql, sqlExpression);

				for (i = 0; i < swapoutList.length; i++){
					var swapoutInstance = transferSwapoutModel.make({
						"deliveryPrefix": swapoutList[i].deliveryPrefix,
						"deliveryTransferNumber": swapoutList[i].deliveryTransferNumber,
						"deliveryUnit": swapoutList[i].deliveryUnit,
						"enterDate": swapoutList[i].enterDate,
						"enteredBy": swapoutList[i].enteredBy,
						"entryMethod": swapoutList[i].entryMethod,
						"localDeliveryTransferNumber": swapoutList[i].localDeliveryTransferNumber,
						"localPickupTransferNumber": swapoutList[i].localPickupTransferNumber,
						"localSwapoutId": swapoutList[i].localSwapoutId,
						"pickupPrefix": swapoutList[i].pickupPrefix,
						"pickupTransferNumber": swapoutList[i].pickupTransferNumber,
						"pickupUnit": swapoutList[i].pickupUnit,
						"swapoutId": swapoutList[i].swapoutId,
						"object": swapoutList[i].object
					});

					swapoutInstance.destroy();
				}

				//remove any Damaged Items and Damaged Item Details
				sqlExpression = [];
				sqlExpression[0] = localTransferNumber;
				sqlExpression[1] = prefix;
				sqlExpression[2] = unit;

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
				sql += "and prefix = ? ";
				sql += "and unit = ? ";
				var damagedItemList = userDatabase.executeSql(sql, sqlExpression);

				for (i = 0; i < damagedItemList.length; i++){
					var localDamagedItemId = damagedItemList[i].localDamagedItemId;

					//find all associated damagedItemDetail records
					sqlExpression = [];
					sqlExpression[0] = localDamagedItemId;

					sql = "select base64Image ";
					sql += "damagedItemDetailId, ";
					sql += "damagedItemId, ";
					sql += "employeeId, ";
					sql += "localDamagedItemDetailId, ";
					sql += "localDamagedItemId, ";
					sql += "object ";
					sql += "from DamagedItemDetail ";
					sql += "where localDamagedItemId = ? ";
					var damagedItemDetailList = userDatabase.executeSql(sql, sqlExpression);

					for (var j=0; j < damagedItemDetailList.length; j++){
						var damagedItemDetailInstance = damagedItemDetailModel.make({
							"base64Image": damagedItemDetailList[j].base64Image,
							"damagedItemDetailId": damagedItemDetailList[j].damagedItemDetailId,
							"damagedItemId": damagedItemDetailList[j].damagedItemId,
							"employeeId": damagedItemDetailList[j].employeeId,
							"localDamagedItemDetailId": damagedItemDetailList[j].localDamagedItemDetailId,
							"localDamagedItemId": damagedItemDetailList[j].localDamagedItemId,
							"object": damagedItemDetailList[j].object
						});

						damagedItemDetailInstance.destroy();
					}

					var damagedItemInstance = damagedItemModel.make({
						"accessoryMissing": damagedItemList[i].accessoryMissing,
						"customerReportedFailure": damagedItemList[i].customerReportedFailure,
						"damagedItemDate": damagedItemList[i].damagedItemDate,
						"damagedItemId": damagedItemList[i].damagedItemId,
						"employeeId": damagedItemList[i].employeeId,
						"localDamagedItemId": damagedItemList[i].localDamagedItemId,
						"localTransferNumber": damagedItemList[i].localTransferNumber,
						"localTripId": damagedItemList[i].localTripId,
						"notes": damagedItemList[i].notes,
						"otherDamage": damagedItemList[i].otherDamage,
						"prefix": damagedItemList[i].prefix,
						"transferNumber": damagedItemList[i].transferNumber,
						"tripId": damagedItemList[i].tripId,
						"unit": damagedItemList[i].unit,
						"visibleDamage": damagedItemList[i].visibleDamage,
						"object": damagedItemList[i].object
					});

					damagedItemInstance.destroy();
				}

				//remove any reufusal pickup transfers, transferdetails, and comments. look for closed pickups with this prefix unit
				sqlExpression = [];
				sqlExpression[0] = prefix;
				sqlExpression[1] = unit;

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
				sql += "from TransferHeader th ";
				sql += "inner join TransferDetail td ";
				sql += "on th.localTransferNumber = td.localTransferNumber ";
				sql += "inner join TripDetail trd ";
				sql += "on th.localTransferNumber = trd.localTaskReferenceId ";
				sql += "left outer join TransferComment tc ";
				sql += "on td.localTransferNumber = tc.localTransferNumber ";
				sql += "and td.prefix = tc.prefix ";
				sql += "and td.unit = tc.unit ";
				sql += "where th.transferType = 'P' ";
				sql += "and th.status = 'C' ";
				sql += "and td.refusedFlag = 'Y' ";
				sql += "and td.prefix = ? ";
				sql += "and td.unit = ? ";
				var refusalList = userDatabase.executeSql(sql, sqlExpression);
				var commentInstance;

				for (i = 0; i < refusalList.length; i++){
					var refusalPickupInstance = transferHeaderModel.make({
						"accountId": refusalList[i].accountId,
						"comment": refusalList[i].comment,
						"cstat": refusalList[i].cstat,
						"deliveredByEmployeeId": refusalList[i].deliveredByEmployeeId,
						"deliveryDate": refusalList[i].deliveryDate,
						"department": refusalList[i].department,
						"localSwapOutNumber": refusalList[i].localSwapOutNumber,
						"localTransferNumber": refusalList[i].localTransferNumber,
						"localUhsPatientId": refusalList[i].localUhsPatientId,
						"orderBy": refusalList[i].orderBy,
						"orderDate": refusalList[i].orderDate,
						"postedByEmployeeId": refusalList[i].postedByEmployeeId,
						"purchaseOrder": refusalList[i].purchaseOrder,
						"status": refusalList[i].status,
						"swapOutFlag": refusalList[i].swapOutFlag,
						"swapOutNumber": refusalList[i].swapOutNumber,
						"telephoneNumber": refusalList[i].telephoneNumber,
						"transferDate": refusalList[i].transferDate,
						"transferNumber": refusalList[i].transferNumber,
						"transferType": refusalList[i].transferType,
						"transferredByEmployeeId": refusalList[i].transferredByEmployeeId,
						"uhsPatientId": refusalList[i].uhsPatientId,
						"employeeId": currentEmployeeId,
						"object": refusalList[i].transferHeaderObject
					});

					refusalPickupInstance.destroy();

					var refusalPickupDetailInstance = transferDetailModel.make({
						"cstat": refusalList[i].cstat,
						"department": refusalList[i].department,
						"description": refusalList[i].description,
						"employeeId": refusalList[i].employeeId,
						"employeeInitials": refusalList[i].employeeInitials,
						"localTransferDetailId": refusalList[i].localTransferDetailId,
						"localTransferNumber": refusalList[i].localTransferNumber,
						"localUhsPatientId": refusalList[i].localUhsPatientId,
						"model": refusalList[i].model,
						"prefix": refusalList[i].prefix,
						"purchaseOrder": refusalList[i].purchaseOrder,
						"reasonRefused": refusalList[i].reasonRefused,
						"refusedFlag": refusalList[i].refusedFlag,
						"scanOffDate": refusalList[i].scanOffDate,
						"scanOnDate": refusalList[i].scanOnDate,
						"transferDate": refusalList[i].transferDate,
						"transferDetailId": refusalList[i].transferDetailId,
						"transferNumber": refusalList[i].transferNumber,
						"uhsPatientId": refusalList[i].uhsPatientId,
						"unit": refusalList[i].unit,
						"vendor": refusalList[i].vendor,
						"object": refusalList[i].transferDetailObject
					});

					refusalPickupDetailInstance.destroy();

					//remove any refusal transfer comment on the pickup
					commentInstance = transferCommentModel.make({
						"comment": refusalList[i].comment,
						"commentDate": refusalList[i].commentDate,
						"employeeId": refusalList[i].employeeId,
						"localTransferCommentId": refusalList[i].localTransferCommentId,
						"localTransferNumber": refusalList[i].localTransferNumber,
						"prefix": refusalList[i].prefix,
						"transferCommentId": refusalList[i].transferCommentId,
						"transferNumber": refusalList[i].transerNumber,
						"unit": refusalList[i].unit,
						"object": refusalList[i].transferCommentObject
					});

					commentInstance.destroy();

					//remove any tripDetail records associated with the pickup
					var tripDetailInstance = tripDetailModel.make({
						"accountId": refusalList[i].accountId,
						"employeeId": refusalList[i].employeeId,
						"localTaskReferenceId": refusalList[i].localTaskReferenceId,
						"localTripDetailId": refusalList[i].localTripDetailId,
						"localTripId": refusalList[i].localTripId,
						"scanLevel": refusalList[i].scanLevel,
						"taskReferenceId": refusalList[i].taskReferenceId,
						"taskType": refusalList[i].taskType,
						"tripDetailId": refusalList[i].tripDetailId,
						"tripId": refusalList[i].tripId,
						"object": refusalList[i].tripDetailObject
					});

					tripDetailInstance.destroy();
				}

				//remove any refusal transfer comments on the delivery
				sqlExpression = [];
				sqlExpression[0] = localTransferNumber;
				sqlExpression[1] = prefix;
				sqlExpression[2] = unit;

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
				sql += "and prefix = ? ";
				sql += "and unit = ? ";
				var commentList = userDatabase.executeSql(sql, sqlExpression);

				for (i = 0; i < commentList.length; i++){
					commentInstance = transferCommentModel.make({
						"comment": commentList[i].comment,
						"commentDate": commentList[i].commentDate,
						"employeeId": commentList[i].employeeId,
						"localTransferCommentId": commentList[i].localTransferCommentId,
						"localTransferNumber": commentList[i].localTransferNumber,
						"prefix": commentList[i].prefix,
						"transferCommentId": commentList[i].transferCommentId,
						"transferNumber": commentList[i].transerNumber,
						"unit": commentList[i].unit,
						"object": commentList[i].object
					});

					commentInstance.destroy();
				}

				//TODO check to see if there are no transferDetail records on the transfer. If there are none set transferHeader status back to H
				sqlExpression = [];
				sqlExpression[0] = localTransferNumber;

				sql = "select count(*) as transferDetailCount ";
				sql += "from transferDetail ";
				sql += "where localTransferNumber = ? ";
				var transferDetailCountArray = userDatabase.executeSql(sql, sqlExpression);
				
				if (transferDetailCountArray.length > 0){
					if (transferDetailCountArray[0].transferDetailCount == 1){
						//retrieve transferHeader
						sqlExpression = [];
						sqlExpression[0] = localTransferNumber;
	
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
						sql += "where localTransferNumber = ? ";
						var transferHeaderArray = userDatabase.executeSql(sql, sqlExpression);
	
						if (transferHeaderArray.length > 0) {
							var transferHeaderInstance = transferHeaderModel.make({
								"accountId": transferHeaderArray[0].accountId,
								"comment": transferHeaderArray[0].comment,
								"cstat": transferHeaderArray[0].cstat,
								"deliveredByEmployeeId": transferHeaderArray[0].deliveredByEmployeeId,
								"deliveryDate": transferHeaderArray[0].deliveryDate,
								"department": transferHeaderArray[0].department,
								"localSwapOutNumber": transferHeaderArray[0].localSwapOutNumber,
								"localUhsPatientId": transferHeaderArray[0].localUhsPatientId,
								"orderBy": transferHeaderArray[0].orderBy,
								"orderDate": transferHeaderArray[0].orderDate,
								"postedByEmployeeId": transferHeaderArray[0].postedByEmployeeId,
								"purchaseOrder": transferHeaderArray[0].purchaseOrder,
								"status": "H",
								"swapOutFlag": transferHeaderArray[0].swapOutFlag,
								"swapOutNumber": transferHeaderArray[0].swapOutNumber,
								"telephoneNumber": transferHeaderArray[0].telephoneNumber,
								"transferDate": "0001-01-01 00:00:00.0",
								"transferNumber": transferHeaderArray[0].transferNumber,
								"transferType": transferHeaderArray[0].transferType,
								"transferredByEmployeeId": 0,
								"uhsPatientId": transferHeaderArray[0].uhsPatientId,
								"employeeId": currentEmployeeId,
								"object": transferHeaderArray[0].object
							});
							transferHeaderInstance.save();
						}
					}
				}

				transferDetailInstance = transferDetailModel.make({
					"cstat": resultArray[0].cstat,
					"department": resultArray[0].department,
					"description": resultArray[0].description,
					"employeeInitials": resultArray[0].employeeInitials,
					"localTransferDetailId": resultArray[0].localTransferDetailId,
					"localTransferNumber": resultArray[0].localTransferNumber,
					"localUhsPatientid": resultArray[0].localUhsPatientid,
					"prefix": resultArray[0].prefix,
					"purchaseOrder": resultArray[0].purchaseOrder,
					"reasonRefused": resultArray[0].reasonRefused,
					"refusedFlag": resultArray[0].refusedFlag,
					"scanOffDate": resultArray[0].scanOffDate,
					"scanOnDate": resultArray[0].scanOnDate,
					"transferDate": resultArray[0].transferDate,
					"transferDetailId": resultArray[0].transferDetailId,
					"transferNumber": resultArray[0].transferNumber,
					"uhsPatientId": resultArray[0].uhsPatientId,
					"unit": resultArray[0].unit,
					"employeeId": resultArray[0].employeeId,
					"object": resultArray[0].transferDetailObject
				});

				transferDetailInstance.destroy();
			}
			else if (scanLevel == "1"){
				transferDetailInstance = transferDetailModel.make({
					"cstat": resultArray[0].cstat,
					"department": resultArray[0].department,
					"description": resultArray[0].description,
					"employeeInitials": resultArray[0].employeeInitials,
					"localTransferDetailId": resultArray[0].localTransferDetailId,
					"localTransferNumber": resultArray[0].localTransferNumber,
					"localUhsPatientid": resultArray[0].localUhsPatientid,
					"prefix": resultArray[0].prefix,
					"purchaseOrder": resultArray[0].purchaseOrder,
					"reasonRefused": resultArray[0].reasonRefused,
					"refusedFlag": resultArray[0].refusedFlag,
					"scanOffDate": "0001-01-01 00:00:00.0",
					"scanOnDate": resultArray[0].scanOnDate,
					"transferDate": resultArray[0].transferDate,
					"transferDetailId": resultArray[0].transferDetailId,
					"transferNumber": resultArray[0].transferNumber,
					"uhsPatientId": resultArray[0].uhsPatientId,
					"unit": resultArray[0].unit,
					"employeeId": resultArray[0].employeeId,
					"object": resultArray[0].transferDetailObject
				});

				transferDetailInstance.save();
			}

			//commit transactions
			userDatabase.commitTransaction();
			readTaskDetail(transferType + "~" + localTransferNumber);
			hideMenu();
		}
		catch(e){
			Rho.Log.info("Error: removeScan rollback = " + e, "inMotion");
			userDatabase.rollbackTransaction();
		}
		finally {
			Rho.Log.info("End: removeScan", "inMotion");
		}
	}
}

function saveAssignItemPatient(id){
	Rho.Log.info("Start: assignPatientToItem(" + id + ")", "inMotion");
	//Get selected uhsPatientId
	if ($(".patientList[src='images/uhs/radiobutton-checked.png']").length > 0){
		$(".patientList[src='images/uhs/radiobutton-checked.png']").each(function(){
			var localUhsPatientId = $(this).attr("data-localUhsPatientId");
			var uhsPatientId = $(this).attr("data-uhsPatientId");
			//update transfer detail with uhspatientid
			var localTransferNumber = $("#taskHeaderContainer").attr("data-localTransferNumber");
			var transferType = $("#taskHeaderContainer").attr("data-transferType");
			var prefix = id.split("~")[0];
			var unit = id.split("~")[1];

			var sqlExpression = [];
			sqlExpression[0] = localTransferNumber;
			sqlExpression[1] = prefix;
			sqlExpression[2] = unit;

			var sql = "select cstat, ";
			sql += "department, ";
			sql += "description, ";
			sql += "employeeInitials, ";
			sql += "localTransferDetailId, ";
			sql += "localTransferNumber, ";
			sql += "localUhsPatientid, ";
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
			sql += "employeeId, ";
			sql += "object ";
			sql += "from transferDetail ";
			sql += "where localTransferNumber = ? ";
			sql += "and prefix = ? ";
			sql += "and unit = ? ";
			var transferDetailArray = userDatabase.executeSql(sql, sqlExpression);

			if (transferDetailArray.length > 0){
				var transferDetailInstance = transferDetailModel.make({
					"cstat": transferDetailArray[0].cstat,
					"department": transferDetailArray[0].department,
					"description": transferDetailArray[0].description,
					"employeeInitials": transferDetailArray[0].employeeInitials,
					"localTransferDetailId": transferDetailArray[0].localTransferDetailId,
					"localTransferNumber": transferDetailArray[0].localTransferNumber,
					"localUhsPatientId": localUhsPatientId,
					"prefix": transferDetailArray[0].prefix,
					"purchaseOrder": transferDetailArray[0].purchaseOrder,
					"reasonRefused": transferDetailArray[0].reasonRefused,
					"refusedFlag": transferDetailArray[0].refusedFlag,
					"scanOffDate": transferDetailArray[0].scanOffDate,
					"scanOnDate": transferDetailArray[0].scanOnDate,
					"transferDate": transferDetailArray[0].transferDate,
					"transferDetailId": transferDetailArray[0].transferDetailId,
					"transferNumber": transferDetailArray[0].transferNumber,
					"uhsPatientId": uhsPatientId,
					"unit": transferDetailArray[0].unit,
					"employeeId": transferDetailArray[0].employeeId,
					"object": transferDetailArray[0].object
				});

				transferDetailInstance.save();
			}
			readTaskDetail(transferType + "~" + localTransferNumber);
		});
	}
	else {
		alert("No patient has been selected");
		return false;
	}

	Rho.Log.info("End: assignPatientToItem", "inMotion");
}

function saveDamagedItem() {
	Rho.Log.info("Start: saveDamagedItem()", "inMotion");
	if (saveDamagedItemUpdate()) {
		var localTransferNumber = $("#taskHeaderContainer").attr("data-localTransferNumber");
		var transferType = $("#taskHeaderContainer").attr("data-transferType");
		readTaskDetail(transferType + "~" + localTransferNumber);
	}
	Rho.Log.info("End: saveDamagedItem", "inMotion");
}

function saveDamagedItemUpdate() {
	Rho.Log.info("Start: saveDamagedItemUpdate()", "inMotion");
	var continueOn = false;
	var currentEmployeeId = $("#tripContainer").attr("data-currentEmployeeId");
	var tripId = $("#tripContainer").attr("data-tripId");
	var localTripId = $("#tripContainer").attr("data-localTripId");
	var localTransferNumber = $("#taskHeaderContainer").attr("data-localTransferNumber");
	var transferNumber = $("#taskHeaderContainer").attr("data-transferNumber");
	var localDamagedItemId = $("#localDamagedItemId").val();
	var damagedItemId = $("#damagedItemId").val();
	var prefix = $("#prefix").val();
	var unit = $("#unit").val();
	var customerReportedFailure = 0;
	var accessoryMissing = 0;
	var visibleDamage = 0;
	var other = 0;
	var notes = $("#notes").val();
	var isValid = false;
	var damagedItemDate = $("#damagedItemDate").val();
	var damagedItemInstance;

	if ($("#customerReportedFailure").attr("src") == "images/uhs/checkbox-checked.png"){
		customerReportedFailure = 1;
		isValid = true;
	}
	if ($("#accessoryMissing").attr("src") == "images/uhs/checkbox-checked.png"){
		accessoryMissing = 1;
		isValid = true;
	}
	if ($("#visibleDamage").attr("src") == "images/uhs/checkbox-checked.png"){
		visibleDamage = 1;
		isValid = true;
	}
	if ($("#other").attr("src") == "images/uhs/checkbox-checked.png"){
		other = 1;
		if (notes.length > 0) {
			isValid = true;
		}
		else {
			isValid = false;
		}
	}

	if (isValid) {
		if (localDamagedItemId > 0 ){
			var sqlExpression = [];
			sqlExpression[0] = localDamagedItemId;
	
			var sql = "select accessoryMissing, ";
			sql += "customerReportedFailure, ";
			sql += "damagedItemDate, ";
			sql += "damagedItemId, ";
			sql += "employeeId, ";
			sql += "localDamagedItemId, ";
			sql += "localTransferNumber, ";
			sql += "localTripId, ";
			sql += "notes, ";
			sql += "otherDamage, ";
			sql += "prefix, ";
			sql += "transferNumber, ";
			sql += "tripId, ";
			sql += "unit, ";
			sql += "visibleDamage, ";
			sql += "object ";
			sql += "from DamagedItem ";
			sql += "where localDamagedItemId = ? ";
			var damagedItemArray = userDatabase.executeSql(sql, sqlExpression);

			if (damagedItemArray.length > 0){
				damagedItemInstance = damagedItemModel.make({
					"accessoryMissing": accessoryMissing,
					"customerReportedFailure": customerReportedFailure,
					"damagedItemDate": damagedItemArray[0].damagedItemDate,
					"damagedItemId": damagedItemArray[0].damagedItemId,
					"localDamagedItemId": damagedItemArray[0].localDamagedItemId,
					"localTransferNumber": damagedItemArray[0].localTransferNumber,
					"notes": notes,
					"otherDamage": other,
					"prefix": damagedItemArray[0].prefix,
					"transferNumber": damagedItemArray[0].transferNumber,
					"unit": damagedItemArray[0].unit,
					"visibleDamage": visibleDamage,
					"tripId": damagedItemArray[0].tripId,
					"localTripId": damagedItemArray[0].localTripId,
					"employeeId": damagedItemArray[0].currentEmployeeId,
					"object": damagedItemArray[0].object
				});
				damagedItemInstance.save();
				$("#damagedItemId").val(damagedItemArray[0].damagedItemId);
			}
		}
		else {
			damagedItemInstance = damagedItemModel.create({
				"accessoryMissing": accessoryMissing,
				"customerReportedFailure": customerReportedFailure,
				"damagedItemDate": damagedItemDate,
				"damagedItemId": damagedItemId,
				"localDamagedItemId": localDamagedItemId,
				"localTransferNumber": localTransferNumber,
				"notes": notes,
				"otherDamage": other,
				"prefix": prefix,
				"transferNumber": transferNumber,
				"unit": unit,
				"visibleDamage": visibleDamage,
				"tripId": tripId,
				"localTripId": localTripId,
				"employeeId": currentEmployeeId
			});
			damagedItemInstance.updateAttributes ({
				"localDamagedItemId": damagedItemInstance.get("object")
			});
			$("#localDamagedItemId").val(damagedItemInstance.get("localDamagedItemId"));
		}
		continueOn = true;
	}
	else {
		if (customerReportedFailure + accessoryMissing + visibleDamage + other === 0) {
			alert("You must select a reason for reporting unit as damaged.");
		}
		else {
			alert("If Other is selected, you must supply notes.");
		}
	}
	Rho.Log.info("End: saveDamagedItemUpdate", "inMotion");
	return continueOn;
}

function saveEditItemPatient(id){
	Rho.Log.info("Start: saveEditItemPatient(" + id + ")", "inMotion");
	//wrap in Rho database api with commit and rollback
	userDatabase.startTransaction();
	try {
		var currentEmployeeId = $("#tripContainer").attr("data-currentEmployeeId");
		var localTransferNumber = $("#taskHeaderContainer").attr("data-localTransferNumber");
		var transferType = $("#taskHeaderContainer").attr("data-transferType");
		var accountId = $("#accountId").val();
		var additionalPatientId = $("#additionalPatientId").val();
		var deliveryLocation = $("#deliveryLocation").val();
		var firstName = $("#firstName").val();
		var hospitalPatientId = $("#hospitalPatientId").val();
		var lastName = $("#lastName").val();
		var localUhsPatientid = $("#localUhsPatientid").val();
		var middleInitial = $("#middleInitial").val();
		var physiciansId = $("#physiciansId").val();
		var roomNumber = $("#roomNumber").val();
		var tradingPartnerId = $("#tradingPartnerId").val();
		var uhsPatientId = $("#uhsPatientId").val();
		var object = $("#object").val();
		var patientInstance;

		//create / update patient
		if (object.length === 0){
			patientInstance = patientModel.create({
				"accountId": accountId,
				"additionalPatientId": additionalPatientId,
				"deliveryLocation": deliveryLocation,
				"firstName": firstName,
				"hospitalPatientId": hospitalPatientId,
				"lastName": lastName,
				"localUhsPatientid": localUhsPatientid,
				"middleInitial": middleInitial,
				"physiciansId": physiciansId,
				"roomNumber": roomNumber,
				"tradingPartnerId": tradingPartnerId,
				"uhsPatientId": uhsPatientId,
				"employeeId": currentEmployeeId
			});

			patientInstance.updateAttributes({
				"localUhsPatientId": patientInstance.get("object")
			});

			var updatedLocalUhsPatientId = patientInstance.get("localUhsPatientId");
			var prefix = id.split("~")[0];
			var unit = id.split("~")[1];
			var sqlExpression = [];

			sqlExpression[0] = localTransferNumber;
			sqlExpression[1] = prefix;
			sqlExpression[2] = unit;

			var sql = "select cstat, ";
			sql += "department, ";
			sql += "description, ";
			sql += "employeeInitials, ";
			sql += "localTransferDetailId, ";
			sql += "localTransferNumber, ";
			sql += "localUhsPatientId, ";
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
			sql += "employeeId, ";
			sql += "object ";
			sql += "from transferDetail ";
			sql += "where localTransferNumber = ? ";
			sql += "and prefix = ? ";
			sql += "and unit = ? ";
			var transferDetailArray = userDatabase.executeSql(sql, sqlExpression);

			if (transferDetailArray.length > 0){
				var transferDetailInstance = transferDetailModel.make({
					"cstat": transferDetailArray[0].cstat,
					"department": transferDetailArray[0].department,
					"description": transferDetailArray[0].description,
					"employeeInitials": transferDetailArray[0].employeeInitials,
					"localTransferDetailId": transferDetailArray[0].localTransferDetailId,
					"localTransferNumber": transferDetailArray[0].localTransferNumber,
					"localUhsPatientId": updatedLocalUhsPatientId,
					"prefix": transferDetailArray[0].prefix,
					"purchaseOrder": transferDetailArray[0].purchaseOrder,
					"reasonRefused": transferDetailArray[0].reasonRefused,
					"refusedFlag": transferDetailArray[0].refusedFlag,
					"scanOffDate": transferDetailArray[0].scanOffDate,
					"scanOnDate": transferDetailArray[0].scanOnDate,
					"transferDate": transferDetailArray[0].transferDate,
					"transferDetailId": transferDetailArray[0].transferDetailId,
					"transferNumber": transferDetailArray[0].transferNumber,
					"uhsPatientId": transferDetailArray[0].uhsPatientId,
					"unit": transferDetailArray[0].unit,
					"employeeId": transferDetailArray[0].employeeId,
					"object": transferDetailArray[0].object
				});

				transferDetailInstance.save();
			}
		}
		else {
			patientInstance = patientModel.make({
				"accountId": accountId,
				"additionalPatientId": additionalPatientId,
				"deliveryLocation": deliveryLocation,
				"firstName": firstName,
				"hospitalPatientId": hospitalPatientId,
				"lastName": lastName,
				"localUhsPatientid": localUhsPatientid,
				"middleInitial": middleInitial,
				"physiciansId": physiciansId,
				"roomNumber": roomNumber,
				"tradingPartnerId": tradingPartnerId,
				"uhsPatientId": uhsPatientId,
				"employeeId": currentEmployeeId,
				"object": object
			});
			patientInstance.save();
		}

		userDatabase.commitTransaction();
		readTask(transferType + "~" + localTransferNumber);
	}
	catch(e) {
		Rho.Log.info("Error: saveEditItemPatient rollback=" + e, "inMotion");
		userDatabase.rollbackTransaction();
		alert("Unable to save patient");
		return false;
	}
	finally {
		Rho.Log.info("End: saveEditItemPatient", "inMotion");
	}
}

function saveFindEquipment(){
	Rho.Log.info("Start: saveFindEquipment()", "inMotion");

	userDatabase.startTransaction();
	try {
		var accountId = $("#taskHeaderContainer").attr("data-accountId");
		var currentEmployeeId = $("#tripContainer").attr("data-currentEmployeeId");
		var currentEmployeeInitials = $("#tripContainer").attr("data-currentEmployeeInitials");
		var localTripId = $("#tripContainer").attr("data-localTripId");
		var tripId = $("#tripContainer").attr("data-tripId");
		var pickupHeaderInstance = null;
		
		$(".findEquipmentContainer").each(function(index, element){
			var el = $(element);
			var itemId = el.attr("data-itemId");
			var image = el.find($("img[data-itemId='" + itemId + "']"));
			var imageSrc = image.attr("src");
			var prefix = itemId.split("~")[0];
			var unit = itemId.split("~")[1];

			if (imageSrc == "images/uhs/notFound.png"){
				//update cstat
				var sqlExpression = [];
				sqlExpression[0] = accountId;
				sqlExpression[1] = prefix;
				sqlExpression[2] = unit;

				var sql = "select accountId, ";
				sql += "cstat, ";
				sql += "description, ";
				sql += "prefix, ";
				sql += "unit, ";
				sql += "object ";
				sql += "from FindEquipment ";
				sql += "where accountId = ? ";
				sql += "and prefix = ? ";
				sql += "and unit = ? ";
				var findEquipmentArray = userDatabase.executeSql(sql, sqlExpression);

				if (findEquipmentArray.length > 0){
					var cstat = findEquipmentArray[0].cstat;
					var adjCstat = findEquipmentArray[0].cstat;
					if (cstat == "N1"){
						adjCstat = "N2";
					}
					else if (cstat == "U1"){
						adjCstat = "U2";
					}
					else {
						//leave cstat as is
					}

					var findEquipmentInstance = findEquipmentModel.make({
						"accountId" : findEquipmentArray[0].accountId,
						"cstat": adjCstat,
						"description": findEquipmentArray[0].description,
						"prefix": findEquipmentArray[0].prefix,
						"unit": findEquipmentArray[0].unit,
						"object": findEquipmentArray[0].object
					});

					findEquipmentInstance.save();
				}
			}
			else if (imageSrc == "images/uhs/scanOnVehicle.png"){
				if (pickupHeaderInstance === null){
					var currentTimestamp =  getCurrentTimestampString();
					pickupHeaderInstance = transferHeaderModel.create({
						"transferNumber" : 0,
						"localTransferNumber" : 0,
						"transferType" : "P",
						"status" : "T",
						"accountId": accountId,
						"orderDate": currentTimestamp,
						"transferDate": currentTimestamp,
						"orderBy": "",
						"department": "",
						"comment": "",
						"telephoneNumber": 0,
						"deliveryDate": currentTimestamp,
						"purchaseOrder": "",
						"uhsPatientId": 0,
						"cstat": "",
						"deliveredByEmployeeId": currentEmployeeId,
						"postedByEmployeeId": currentEmployeeId,
						"swapOutFlag": "N",
						"swapOutNumber": 0,
						"localSwapOutNumber": 0,
						"transferredByEmployeeId": currentEmployeeId,
						"localUhsPatientId": 0,
						"employeeId": currentEmployeeId
					});

					pickupHeaderInstance.updateAttributes({
						"localTransferNumber": pickupHeaderInstance.get("object")
					});

					var tripDetailInstance = tripDetailModel.create({
						"accountId": accountId,
						"localTaskReferenceId": pickupHeaderInstance.get("localTransferNumber"),
						"localTripDetailId": 0,
						"localTripId": localTripId,
						"taskReferenceId": pickupHeaderInstance.get("transferNumber"),
						"taskType": pickupHeaderInstance.get("transferType"),
						"tripDetailId": 0,
						"tripId": tripId,
						"employeeId": currentEmployeeId,
						"scanLevel": 0
					});

					tripDetailInstance.updateAttributes({
						"localTripDetailId": tripDetailInstance.get("object")
					});
				}

				var pickupDetailInstance = transferDetailModel.create({
					"cstat": "",
					"department": "",
					"description": "",
					"employeeInitials": currentEmployeeInitials,
					"localTransferDetailId": "",
					"localTransferNumber": pickupHeaderInstance.get("localTransferNumber"),
					"localUhsPatientId": 0,
					"model": "",
					"prefix": prefix,
					"purchaseOrder": "",
					"reasonRefused": "",
					"refusedFlag": "",
					"transferDate": pickupHeaderInstance.get("transferDate"),
					"transferDetailId": "",
					"transferNumber": pickupHeaderInstance.get("transferNumber"),
					"uhsPatientId": 0,
					"unit": unit,
					"vendor": "",
					"employeeId": currentEmployeeId,
					"scanOffDate": "0001-01-01 00:00:00.0",
					"scanOnDate": getCurrentTimestampString(),
				});
				pickupDetailInstance.updateAttributes({
					"localTransferDetailId": pickupDetailInstance.get("object")
				});
			}
			else {
				// if item has not been scanned or marked as not found do nothing
			}
		});

		userDatabase.commitTransaction();
		readTripDetail();
		$("#headerListContent").empty();
		$("#frameListContent").empty();
	}
	catch (e){
		Rho.Log.info("Error: saveFindEquipment(" + e.message + ") - rolled back", "inMotion");
		userDatabase.rollbackTransaction();
	}
	finally {
		Rho.Log.info("End: saveFindEquipment", "inMotion");
	}
}

function saveItem(){
	Rho.Log.info("Start: saveItem()", "inMotion");

	var cstat = $("#cstat").val();
	var department = $("#department").val();
	var description = $("#description").val();
	var employeeInitials = $("#employeeInitials").val();
	var localTransferDetailId = $("#localTransferDetailId").val();
	var localTransferNumber = $("#localTransferNumber").val();
	var transferType = $("#taskHeaderContainer").attr("data-transferType");
	var localUhsPatientId = $("#localUhsPatientId").val();
	var model = $("#model").val();
	var prefix = $("#prefix").val();
	var purchaseOrder = $("#purchaseOrder").val();
	var reasonRefused = $("#reasonRefused").val();
	var refusedFlag = $("#refusedFlag").val();
	var scanOffDate = $("#scanOffDate").val();
	var scanOnDate = $("scanOnDate").val();
	var transferDate = $("#transferDate").val();
	var transferDetailId = $("#transferDetailId").val();
	var transferNumber = $("#transferNumber").val();
	var uhsPatientId = $("#uhsPatientId").val();
	var unit = $("#unit").val();
	var vendor = $("#vendor").val();
	var object = $("#object").val();
	var currentEmployeeId = $("#tripContainer").attr("data-currentEmployeeId");

	var transferDetailInstance = transferDetailModel.make({
		"cstat": cstat,
		"department": department,
		"description": description,
		"employeeInitials": employeeInitials,
		"localTransferDetailId": localTransferDetailId,
		"localTransferNumber": localTransferNumber,
		"localUhsPatientId": localUhsPatientId,
		"model": model,
		"prefix": prefix,
		"purchaseOrder": purchaseOrder,
		"reasonRefused": reasonRefused,
		"refusedFlag": refusedFlag,
		"scanOffDate": scanOffDate,
		"scanOnDate": scanOnDate,
		"transferDate": transferDate,
		"transferDetailId": transferDetailId,
		"transferNumber": transferNumber,
		"uhsPatientId": uhsPatientId,
		"unit": unit,
		"vendor": vendor,
		"employeeId": currentEmployeeId,
		"object": object
	});

	transferDetailInstance.save();
	readTaskDetail(transferType + "~" + localTransferNumber);
	Rho.Log.info("End: saveItem", "inMotion");
}

function savePreferredAccessory(){
	Rho.Log.info("Start: savePreferredAccessory()", "inMotion");

	userDatabase.startTransaction();
	try {
		var accountId = $("#taskHeaderContainer").attr("data-accountId");
		var localTransferNumber = $("#taskHeaderContainer").attr("data-localTransferNumber");
		var transferNumber = $("#taskHeaderContainer").attr("data-transferNumber");
		var transferType = $("#taskHeaderContainer").attr("data-transferType");
		var transferDate = $("#taskHeaderContainer").attr("data-transferDate");
		var hasUnitAccessoryTracking = $("#taskHeaderContainer").attr("data-hasUnitAccessoryTracking");
		var currentEmployeeId = $("#tripContainer").attr("data-currentEmployeeId");
		var prefix = $("#prefix").val();
		var unit = $("#unit").val();

		if (hasUnitAccessoryTracking == "1"){
			//If active write to transferredUnitAccessoriesModel
			var adjTransferType = "";
			if (transferType == "Delivery"){
				adjTransferType = "D";
			}
			else {
				adjTransferType = "R";
			}

			$("#preferredAccessoryTable > tbody > tr").each(function(){
				var preferredQuantity = 0;
				var actualQuantity = 0;
				var stockNumber = "";
				var itemDescription = "";
				var sqlExpression;
				var sql;
				var i;

				preferredQuantity = $(this).find("td:eq(0)").html();
				actualQuantity = $(this).find("td:eq(1) > input").val();
				stockNumber = $(this).find("td:eq(2)").html();
				itemDescription = $(this).find("td:eq(3)").html();

				if (transferType == "Pickup"){
					//delete any surplus records associated with the transferredUnitAccessories records already
					sqlExpression = [];
					sqlExpression[0] = localTransferNumber;
					sqlExpression[1] = prefix;
					sqlExpression[2] = unit;
					sqlExpression[3] = stockNumber;

					sql = "select customerDepartment, ";
					sql += "deliveryAccessoryTransferId, ";
					sql += "localDeliveryAccessoryTransferId, ";
					sql += "localRetrievalAccessoryTransferId, ";
					sql += "localSurplusId, ";
					sql += "matchDate, ";
					sql += "matchUserId, ";
					sql += "retrievalAccessoryTransferId, ";
					sql += "surplusId, ";
					sql += "employeeId, ";
					sql += "object ";
					sql += "from surplusRetrievedAccessories ";
					sql += "where localRetrievalAccessoryTransferId in ";
					sql += "( ";
					sql += "select localAccessoryTransferId " ;
					sql += "from TransferredUnitAccessories ";
					sql += "where localTransferNumber = ? ";
					sql += "and transferType = 'R' ";
					sql += "and prefix = ? ";
					sql += "and unit = ? ";
					sql += "and stockNumber = ? ";
					sql += ") ";
					var surplusRetrievedAccessoriesArray = userDatabase.executeSql(sql, sqlExpression);

					for (i = 0; i < surplusRetrievedAccessoriesArray.length; i++){
						var surplusRetrievedAccessoriesInstance = surplusRetrievedAccessoriesModel.make({
							"customerDepartment": surplusRetrievedAccessoriesArray[i].customerDepartment,
							"deliveryAccessoryTransferId": surplusRetrievedAccessoriesArray[i].deliveryAccessoryTransferId,
							"localDeliveryAccessoryTransferId": surplusRetrievedAccessoriesArray[i].localDeliveryAccessoryTransferId,
							"localRetrievalAccessoryTransferId": surplusRetrievedAccessoriesArray[i].localRetrievalAccessoryTransferId,
							"localSurplusId": surplusRetrievedAccessoriesArray[i].localSurplusId,
							"matchDate": surplusRetrievedAccessoriesArray[i].matchDate,
							"matchUserId": surplusRetrievedAccessoriesArray[i].matchUserId,
							"retrievalAccessoryTransferId": surplusRetrievedAccessoriesArray[i].retrievalAccessoryTransferId,
							"surplusId": surplusRetrievedAccessoriesArray[i].surplusId,
							"employeeId": surplusRetrievedAccessoriesArray[i].employeeId,
							"object": surplusRetrievedAccessoriesArray[i].object,
						});
						surplusRetrievedAccessoriesInstance.destroy();
					}
				}

				//determine how many records have already been written
				sqlExpression = [];
				sqlExpression[0] = localTransferNumber;
				sqlExpression[1] = adjTransferType;
				sqlExpression[2] = prefix;
				sqlExpression[3] = unit;
				sqlExpression[4] = stockNumber;

				sql = "select accessoryIsDamaged, ";
				sql += "accessoryIsLost, ";
				sql += "accessoryTransferId, ";
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
				sql += "employeeId, ";
				sql += "unit, ";
				sql += "object ";
				sql += "from TransferredUnitAccessories ";
				sql += "where localTransferNumber = ? ";
				sql += "and transferType = ? ";
				sql += "and prefix = ? ";
				sql += "and unit = ? ";
				sql += "and stockNumber = ? ";

				var transferredUnitAccessoriesArray = userDatabase.executeSql(sql, sqlExpression);
				var transferredUnitAccessoriesCount = transferredUnitAccessoriesArray.length;
				var transferredUnitAccessoriesInstance;
				var difference;

				if (actualQuantity >= transferredUnitAccessoriesCount){
					difference = actualQuantity - transferredUnitAccessoriesCount;
					for (i = 0; i < difference; i++){
						//create transferredUnitAccessories records for the difference
						transferredUnitAccessoriesInstance = transferredUnitAccessoriesModel.create({
							"accessoryIsDamaged": "0",
							"accessoryIsLost": "0",
							"accessoryTransferId": 0,
							"localAccessoryTransferId": 0,
							"localMatchingAccessoryTransferId": 0,
							"localTransferNumber": localTransferNumber,
							"lostReportUserId": 0,
							"lostStatusDate": '0001-01-01 00:00:00.0',
							"matchingAccessoryTransferId": 0,
							"outOfStock": 0,
							"prefix": prefix,
							"stockNumber": stockNumber,
							"substitutedStockNumber": 0,
							"transferDate": transferDate,
							"transferNumber": transferNumber,
							"transferType": adjTransferType,
							"unit": unit,
							"employeeId": currentEmployeeId
						});

						transferredUnitAccessoriesInstance.updateAttributes({
							"localAccessoryTransferId": transferredUnitAccessoriesInstance.get("object")
						});
					}
				}
				else {
					//delete transferredUnitAccessories records for the difference
					difference = transferredUnitAccessoriesCount - actualQuantity;
					for (i = 0; i < difference; i++){
						transferredUnitAccessoriesInstance = transferredUnitAccessoriesModel.make({
							"accessoryIsDamaged": transferredUnitAccessoriesArray[i].accessoryIsDamaged,
							"accessoryIsLost": transferredUnitAccessoriesArray[i].accessoryIsLost,
							"accessoryTransferId": transferredUnitAccessoriesArray[i].accessoryTransferId,
							"localAccessoryTransferId": transferredUnitAccessoriesArray[i].localAccessoryTransferId,
							"localMatchingAccessoryTransferId": transferredUnitAccessoriesArray[i].localMatchingAccessoryTransferId,
							"localTransferNumber": transferredUnitAccessoriesArray[i].localTransferNumber,
							"lostReportUserId": transferredUnitAccessoriesArray[i].lostReportUserId,
							"lostStatusDate": transferredUnitAccessoriesArray[i].lostStatusDate,
							"matchingAccessoryTransferId": transferredUnitAccessoriesArray[i].matchingAccessoryTransferId,
							"outOfStock": transferredUnitAccessoriesArray[i].outOfStock,
							"prefix": transferredUnitAccessoriesArray[i].prefix,
							"stockNumber": transferredUnitAccessoriesArray[i].stockNumber,
							"substitutedStockNumber": transferredUnitAccessoriesArray[i].substitutedStockNumber,
							"transferDate": transferredUnitAccessoriesArray[i].transferDate,
							"transferNumber": transferredUnitAccessoriesArray[i].transferNumber,
							"transferType": transferredUnitAccessoriesArray[i].transferType,
							"unit": transferredUnitAccessoriesArray[i].unit,
							"employeeId": transferredUnitAccessoriesArray[i].employeeId,
							"object": transferredUnitAccessoriesArray[i].object
						});

						transferredUnitAccessoriesInstance.destroy();
					}
				}
			});

			//if pickup update D record with associated R record
			if (transferType == "Pickup"){
				$("#preferredAccessoryTable > tbody > tr").each(function(){
					var preferredQuantity = 0;
					var actualQuantity = 0;
					var stockNumber = "";
					var itemDescription = "";

					preferredQuantity = $(this).find("td:eq(0)").html();
					actualQuantity = $(this).find("td:eq(1) > input").val();
					stockNumber = $(this).find("td:eq(2)").html();
					itemDescription = $(this).find("td:eq(3)").html();

					//requery transferredUnitAccessories
					var sqlExpression = [];
					sqlExpression[0] = localTransferNumber;
					sqlExpression[1] = adjTransferType;
					sqlExpression[2] = prefix;
					sqlExpression[3] = unit;
					sqlExpression[4] = stockNumber;

					var sql = "select accessoryIsDamaged, ";
					sql += "accessoryIsLost, ";
					sql += "accessoryTransferId, ";
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
					sql += "where localTransferNumber = ? ";
					sql += "and transferType = ? ";
					sql += "and prefix = ? ";
					sql += "and unit = ? ";
					sql += "and stockNumber = ? ";
					var retrievedUnitAccessoriesArray = userDatabase.executeSql(sql, sqlExpression);
					var retrievedCount = retrievedUnitAccessoriesArray.length;

					//query open d records
					sqlExpression = [];
					sqlExpression[0] = accountId;
					sqlExpression[1] = prefix;
					sqlExpression[2] = unit;
					sqlExpression[3] = stockNumber;
					sqlExpression[4] = accountId;
					sqlExpression[5] = prefix;
					sqlExpression[6] = unit;
					sqlExpression[7] = stockNumber;
					sqlExpression[8] = localTransferNumber;
					sqlExpression[9] = prefix;
					sqlExpression[10] = unit;
					sqlExpression[11] = stockNumber;

					sql = "SELECT accessoryIsDamaged, accessoryIsLost, accessoryTransferId, localAccessoryTransferId, ";
					sql += "localMatchingAccessoryTransferId, da.localTransferNumber as transferNumber, lostReportUserId, lostStatusDate, ";
					sql += "matchingAccessoryTransferId, outOfStock, prefix, stockNumber, substitutedStockNumber, ";
					sql += "da.transferDate as transferDate, da.transferNumber as transferNumber, da.transferType as transferType, unit, da.employeeId as employeeId, da.object as object ";
					sql += "FROM transferredunitaccessories da ";
					sql += "inner join transferHeader th ";
					sql += "on da.localTransferNumber = th.localTransferNumber ";
					sql += "inner join account a ";
					sql += "on th.accountId = a.accountId ";
					sql += "where a.accountId = ? ";
					sql += "and da.transferType = 'D' ";
					sql += "and da.prefix = ? ";
					sql += "and da.unit = ? ";
					sql += "and stockNumber = ? ";
					sql += "and localMatchingAccessoryTransferId = 0 ";
					sql += "union ";
					sql += "SELECT accessoryIsDamaged, accessoryIsLost, accessoryTransferId, localAccessoryTransferId, ";
					sql += "localMatchingAccessoryTransferId, da.localTransferNumber, lostReportUserId, lostStatusDate, ";
					sql += "matchingAccessoryTransferId, outOfStock, prefix, stockNumber, substitutedStockNumber, ";
					sql += "da.transferDate, da.transferNumber, da.transferType, unit, da.employeeId, da.object ";
					sql += "FROM transferredunitaccessories da ";
					sql += "inner join transferHeader th ";
					sql += "on da.localTransferNumber = th.localTransferNumber ";
					sql += "inner join account a ";
					sql += "on th.accountId = a.accountId ";
					sql += "where a.accountId = ? ";
					sql += "and da.transferType = 'D' ";
					sql += "and da.prefix = ? ";
					sql += "and da.unit = ? ";
					sql += "and stockNumber = ? ";
					sql += "and localMatchingAccessoryTransferId in ";
					sql += "(select localAccessoryTransferId ";
					sql += "from TransferredUnitAccessories ";
					sql += "where localTransferNumber = ? ";
					sql += "and transferType = 'R' ";
					sql += "and prefix = ? ";
					sql += "and unit = ? ";
					sql += "and stockNumber = ? ";
					sql += ")";
					var deliveredUnitAccessoriesArray = userDatabase.executeSql(sql, sqlExpression);
					var deliveredCount = deliveredUnitAccessoriesArray.length;
					var j;
					var deliveredUnitAccessoriesInstance;

					if (retrievedCount == deliveredCount){
						for (j = 0; j < deliveredUnitAccessoriesArray.length; j++){
							deliveredUnitAccessoriesInstance = transferredUnitAccessoriesModel.make({
								"accessoryIsDamaged": deliveredUnitAccessoriesArray[j].accessoryIsDamaged,
								"accessoryIsLost": deliveredUnitAccessoriesArray[j].accessoryIsLost,
								"accessoryTransferId": deliveredUnitAccessoriesArray[j].accessoryTransferId,
								"localAccessoryTransferId": deliveredUnitAccessoriesArray[j].localAccessoryTransferId,
								"localMatchingAccessoryTransferId": retrievedUnitAccessoriesArray[j].localAccessoryTransferId,
								"localTransferNumber": deliveredUnitAccessoriesArray[j].localTransferNumber,
								"lostReportUserId": deliveredUnitAccessoriesArray[j].lostReportUserId,
								"lostStatusDate": deliveredUnitAccessoriesArray[j].lostStatusDate,
								"matchingAccessoryTransferId": deliveredUnitAccessoriesArray[j].matchingAccessoryTransferId,
								"outOfStock": deliveredUnitAccessoriesArray[j].outOfStock,
								"prefix": deliveredUnitAccessoriesArray[j].prefix,
								"stockNumber": deliveredUnitAccessoriesArray[j].stocknumber,
								"substitutedStockNumber": deliveredUnitAccessoriesArray[j].substitutedStockNumber,
								"transferDate": deliveredUnitAccessoriesArray[j].transferDate,
								"transferNumber": deliveredUnitAccessoriesArray[j].transferNumber,
								"transferType": deliveredUnitAccessoriesArray[j].transferType,
								"unit": deliveredUnitAccessoriesArray[j].unit,
								"employeeId": deliveredUnitAccessoriesArray[j].employeeId,
								"object": deliveredUnitAccessoriesArray[j].object
							});
							deliveredUnitAccessoriesInstance.save();
						}
					}
					else if (retrievedCount > deliveredCount){
						//adjust d records with p records
						for (j = 0; j < retrievedUnitAccessoriesArray.length; j++){
							if ((j + 1) > deliveredCount){
								//create surplus records for extra
								var surplusRetrievedAccessoriesInstance = surplusRetrievedAccessoriesModel.create({
									"customerDepartment": "",
									"deliveryAccessoryTransferId": 0,
									"localDeliveryAccessoryTransferId": 0,
									"localRetrievalAccessoryTransferId": retrievedUnitAccessoriesArray[j].localAccessoryTransferId,
									"localSurplusId": 0,
									"matchDate": "",
									"matchUserId": 0,
									"retrievalAccessoryTransferId": 0,
									"surplusId": 0,
									"employeeId": currentEmployeeId
								});

								surplusRetrievedAccessoriesInstance.updateAttributes({
									"localSurplusId": surplusRetrievedAccessoriesInstance.get("object")
								});
							}
							else {
								deliveredUnitAccessoriesInstance = transferredUnitAccessoriesModel.make({
									"accessoryIsDamaged": deliveredUnitAccessoriesArray[j].accessoryIsDamaged,
									"accessoryIsLost": deliveredUnitAccessoriesArray[j].accessoryIsLost,
									"accessoryTransferId": deliveredUnitAccessoriesArray[j].accessoryTransferId,
									"localAccessoryTransferId": deliveredUnitAccessoriesArray[j].localAccessoryTransferId,
									"localMatchingAccessoryTransferId": retrievedUnitAccessoriesArray[j].localAccessoryTransferId,
									"localTransferNumber": deliveredUnitAccessoriesArray[j].localTransferNumber,
									"lostReportUserId": deliveredUnitAccessoriesArray[j].lostReportUserId,
									"lostStatusDate": deliveredUnitAccessoriesArray[j].lostStatusDate,
									"matchingAccessoryTransferId": deliveredUnitAccessoriesArray[j].matchingAccessoryTransferId,
									"outOfStock": deliveredUnitAccessoriesArray[j].outOfStock,
									"prefix": deliveredUnitAccessoriesArray[j].prefix,
									"stockNumber": deliveredUnitAccessoriesArray[j].stocknumber,
									"substitutedStockNumber": deliveredUnitAccessoriesArray[j].substitutedStockNumber,
									"transferDate": deliveredUnitAccessoriesArray[j].transferDate,
									"transferNumber": deliveredUnitAccessoriesArray[j].transferNumber,
									"transferType": deliveredUnitAccessoriesArray[j].transferType,
									"unit": deliveredUnitAccessoriesArray[j].unit,
									"employeeId": deliveredUnitAccessoriesArray[j].employeeId,
									"object": deliveredUnitAccessoriesArray[j].object
								});

								deliveredUnitAccessoriesInstance.save();
							}
						}
					}
					else {
						//adjust d records with p records
						for (j = 0; j < deliveredUnitAccessoriesArray.length; j++){
							if ((j + 1) > retrievedCount){
								//adjust any additional d records with 0
								deliveredUnitAccessoriesInstance = transferredUnitAccessoriesModel.make({
									"accessoryIsDamaged": deliveredUnitAccessoriesArray[j].accessoryIsDamaged,
									"accessoryIsLost": deliveredUnitAccessoriesArray[j].accessoryIsLost,
									"accessoryTransferId": deliveredUnitAccessoriesArray[j].accessoryTransferId,
									"localAccessoryTransferId": deliveredUnitAccessoriesArray[j].localAccessoryTransferId,
									"localMatchingAccessoryTransferId": 0,
									"localTransferNumber": deliveredUnitAccessoriesArray[j].localTransferNumber,
									"lostReportUserId": deliveredUnitAccessoriesArray[j].lostReportUserId,
									"lostStatusDate": deliveredUnitAccessoriesArray[j].lostStatusDate,
									"matchingAccessoryTransferId": deliveredUnitAccessoriesArray[j].matchingAccessoryTransferId,
									"outOfStock": deliveredUnitAccessoriesArray[j].outOfStock,
									"prefix": deliveredUnitAccessoriesArray[j].prefix,
									"stockNumber": deliveredUnitAccessoriesArray[j].stocknumber,
									"substitutedStockNumber": deliveredUnitAccessoriesArray[j].substitutedStockNumber,
									"transferDate": deliveredUnitAccessoriesArray[j].transferDate,
									"transferNumber": deliveredUnitAccessoriesArray[j].transferNumber,
									"transferType": deliveredUnitAccessoriesArray[j].transferType,
									"unit": deliveredUnitAccessoriesArray[j].unit,
									"employeeId": deliveredUnitAccessoriesArray[j].employeeId,
									"object": deliveredUnitAccessoriesArray[j].object
								});

								deliveredUnitAccessoriesInstance.save();
							}
							else {
								deliveredUnitAccessoriesInstance = transferredUnitAccessoriesModel.make({
									"accessoryIsDamaged": deliveredUnitAccessoriesArray[j].accessoryIsDamaged,
									"accessoryIsLost": deliveredUnitAccessoriesArray[j].accessoryIsLost,
									"accessoryTransferId": deliveredUnitAccessoriesArray[j].accessoryTransferId,
									"localAccessoryTransferId": deliveredUnitAccessoriesArray[j].localAccessoryTransferId,
									"localMatchingAccessoryTransferId": retrievedUnitAccessoriesArray[j].localAccessoryTransferId,
									"localTransferNumber": deliveredUnitAccessoriesArray[j].localTransferNumber,
									"lostReportUserId": deliveredUnitAccessoriesArray[j].lostReportUserId,
									"lostStatusDate": deliveredUnitAccessoriesArray[j].lostStatusDate,
									"matchingAccessoryTransferId": deliveredUnitAccessoriesArray[j].matchingAccessoryTransferId,
									"outOfStock": deliveredUnitAccessoriesArray[j].outOfStock,
									"prefix": deliveredUnitAccessoriesArray[j].prefix,
									"stockNumber": deliveredUnitAccessoriesArray[j].stocknumber,
									"substitutedStockNumber": deliveredUnitAccessoriesArray[j].substitutedStockNumber,
									"transferDate": deliveredUnitAccessoriesArray[j].transferDate,
									"transferNumber": deliveredUnitAccessoriesArray[j].transferNumber,
									"transferType": deliveredUnitAccessoriesArray[j].transferType,
									"unit": deliveredUnitAccessoriesArray[j].unit,
									"employeeId": deliveredUnitAccessoriesArray[j].employeeId,
									"object": deliveredUnitAccessoriesArray[j].object
								});

								deliveredUnitAccessoriesInstance.save();
							}
						}
					}
				});
			}
		}
		else {
			//if not active write to transferredPrefixAccessoriesModel
			if (transferType == "Delivery"){
				$("#preferredAccessoryTable > tbody > tr").each(function(){
					var preferredQuantity = 0;
					var actualQuantity = 0;
					var stockNumber = "";
					var itemDescription = "";

					preferredQuantity = $(this).find("td:eq(0)").html();
					actualQuantity = $(this).find("td:eq(1) > input").val();
					stockNumber = $(this).find("td:eq(2)").html();
					itemDescription = $(this).find("td:eq(3)").html();

					var sqlExpression = [];
					sqlExpression[0] = localTransferNumber;
					sqlExpression[1] = prefix;
					sqlExpression[2] = itemDescription;
					sqlExpression[3] = localTransferNumber;
					sqlExpression[4] = prefix;

					var sql = "select td.localTransferNumber, ";
					sql += "td.prefix, ";
					sql += "count(*) as unitCount, ";
					sql += "accessory, pa.localTransferNumber, ";
					sql += "pa.localTransferPrefixId, ";
					sql += "pa.prefix, ";
					sql += "pa.quantity, ";
					sql += "pa.transferNumber, ";
					sql += "pa.transferPrefixId, ";
					sql += "pa.object ";
					sql += "from TransferDetail td ";
					sql += "left outer join ( ";
					sql += "select accessory, pa.localTransferNumber, ";
					sql += "localTransferPrefixId, ";
					sql += "pa.prefix, ";
					sql += "quantity, ";
					sql += "transferNumber, ";
					sql += "transferPrefixId, ";
					sql += "employeeId, ";
					sql += "object ";
					sql += "from TransferredPrefixAccessories pa ";
					sql += "where localTransferNumber = ? ";
					sql += "and prefix = ? ";
					sql += "and accessory = ? ) pa ";
					sql += "on td.localtransferNumber = pa.localTransferNumber ";
					sql += "and td.prefix = pa.prefix ";
					sql += "where td.localTransferNumber = ? ";
					sql += "and td.prefix = ? ";
					sql += "group by td.localTransferNumber, ";
					sql += "td.prefix ";
					var transferredPrefixAccessoriesArray = userDatabase.executeSql(sql, sqlExpression);
					var transferredPrefixAccessoriesInstance;

					if (transferredPrefixAccessoriesArray[0].object.length > 0){
						//update quantity on existing record
						transferredPrefixAccessoriesInstance = transferredPrefixAccessoriesModel.make({
							"accessory": transferredPrefixAccessoriesArray[0].accessory,
							"localTransferNumber": transferredPrefixAccessoriesArray[0].localTransferNumber,
							"localTransferPrefixId": transferredPrefixAccessoriesArray[0].localTransferPrefixId,
							"prefix": transferredPrefixAccessoriesArray[0].prefix,
							"quantity": actualQuantity * transferredPrefixAccessoriesArray[0].unitCount,
							"transferNumber": transferredPrefixAccessoriesArray[0].transferNumber,
							"transferPrefixId": transferredPrefixAccessoriesArray[0].transferPrefixId,
							"employeeId": transferredPrefixAccessoriesArray[0].employeeId,
							"object": transferredPrefixAccessoriesArray[0].object
						});

						transferredPrefixAccessoriesInstance.save();
					}
					else {
						//create record
						transferredPrefixAccessoriesInstance = transferredPrefixAccessoriesModel.create({
							"accessory": itemDescription,
							"localTransferNumber": localTransferNumber,
							"localTransferPrefixId": 0,
							"prefix": prefix,
							"quantity": actualQuantity * transferredPrefixAccessoriesArray[0].unitCount,
							"transferNumber": transferNumber,
							"transferPrefixId": "",
							"employeeId": currentEmployeeId
						});

						transferredPrefixAccessoriesInstance.updateAttributes({
							"localTransferPrefixId": transferredPrefixAccessoriesInstance.get("object")
						});
					}
				});
			}
		}
		userDatabase.commitTransaction();
	}
	catch(e) {
		Rho.Log.info("Error: savePreferredAccessory rollback=" + e, "inMotion");
		userDatabase.rollbackTransaction();
		alert ("Unable to save preferred accessories");
		return false;
	}
	finally{
		enableScanner();
		Rho.Log.info("End: savePreferredAccessory", "inMotion");
	}
}

function saveSwapout(){
	Rho.Log.info("Start: saveSwapout()", "inMotion");

	if ($(".swapoutList[src='images/uhs/radiobutton-checked.png']").length > 0){
		$(".swapoutList[src='images/uhs/radiobutton-checked.png']").each(function(){
			var localDeliveryTransferNumber = $("#localDeliveryTransferNumber").val();
			var deliveryTransferNumber = $("#deliveryTransferNumber").val();
			var deliveryPrefix = $(this).attr("data-deliveryPrefix");
			var deliveryUnit = $(this).attr("data-deliveryUnit");
			var localPickupTransferNumber = $("#localPickupTransferNumber").val();
			var pickupTransferNumber = $("#pickupTransferNumber").val();
			var pickupPrefix = $("#pickupPrefix").val();
			var pickupUnit = $("#pickupUnit").val();
			var currentTimestamp = getCurrentTimestampString();
			var currentEmployeeId = $("#tripContainer").attr("data-currentEmployeeId");
			var currentEmployeeShortName = $("#tripContainer").attr("data-currentEmployeeShortName");

			//check for existing swapout record
			var sqlExpression = [];
			sqlExpression[0] = localPickupTransferNumber;
			sqlExpression[1] = pickupPrefix;
			sqlExpression[2] = pickupUnit;

			var sql = "select swapoutId, ";
			sql += "localSwapoutId, ";
			sql += "deliveryPrefix, ";
			sql += "deliveryTransferNumber, ";
			sql += "deliveryUnit, ";
			sql += "employeeId, ";
			sql += "enterDate, ";
			sql += "enteredBy, ";
			sql += "entryMethod, ";
			sql += "localDeliveryTransferNumber, ";
			sql += "localPickupTransferNumber, ";
			sql += "pickupPrefix, ";
			sql += "pickupTransferNumber, ";
			sql += "pickupUnit, ";
			sql += "object ";
			sql += "from TransferSwapout ";
			sql += "where localPickupTransferNumber = ? ";
			sql += "and pickupPrefix = ? ";
			sql += "and pickupUnit = ? ";
			var swapoutArray = userDatabase.executeSql(sql, sqlExpression);
			var swapoutInstance;
			
			if (swapoutArray.length === 0){
				//create new swapout record
				swapoutInstance = transferSwapoutModel.create({
					"swapoutId": "",
					"localSwapoutId": "",
					"deliveryPrefix": deliveryPrefix,
					"deliveryTransferNumber": deliveryTransferNumber,
					"deliveryUnit": deliveryUnit,
					"enterDate": currentTimestamp,
					"enteredBy": currentEmployeeShortName,
					"entryMethod": "A",
					"localDeliveryTransferNumber": localDeliveryTransferNumber,
					"localPickupTransferNumber": localPickupTransferNumber,
					"pickupPrefix": pickupPrefix,
					"pickupTransferNumber": pickupTransferNumber,
					"pickupUnit": pickupUnit,
					"employeeId": currentEmployeeId
				});

				swapoutInstance.updateAttributes({
					"localSwapoutId": swapoutInstance.get("object")
				});
			}
			else {
				//update existing swapout record
				swapoutInstance = transferSwapoutModel.make({
					"swapoutId": swapoutArray[0].swapoutId,
					"localSwapoutId": swapoutArray[0].localSwapoutId,
					"deliveryPrefix": deliveryPrefix,
					"deliveryTransferNumber": deliveryTransferNumber,
					"deliveryUnit": deliveryUnit,
					"enterDate": currentTimestamp,
					"enteredBy": currentEmployeeShortName,
					"entryMethod": swapoutArray[0].entryMethod,
					"localDeliveryTransferNumber": swapoutArray[0].localDeliveryTransferNumber,
					"localPickupTransferNumber": swapoutArray[0].localPickupTransferNumber,
					"pickupPrefix": swapoutArray[0].pickupPrefix,
					"pickupTransferNumber": swapoutArray[0].pickupTransferNumber,
					"pickupUnit": swapoutArray[0].pickupUnit,
					"object": swapoutArray[0].object,
					"employeeId": swapoutArray[0].employeeId
				});

				swapoutInstance.save();
			}
			Rho.Log.info("End: saveSwapout", "inMotion");
		});
		enableScanner();
	}
	else {
		alert("No swap out item has been selected");
		return false;
	}
}

function swapout(id){
	Rho.Log.info("Start: swapout()", "inMotion");

	var deliveryTransferNumber = $("#taskHeaderContainer").attr("data-swapoutNumber");
	var localDeliveryTransferNumber = $("#taskHeaderContainer").attr("data-localSwapoutNumber");
	var pickupTransferNumber = $("#taskHeaderContainer").attr("data-transferNumber");
	var localPickupTransferNumber = $("#taskHeaderContainer").attr("data-localTransferNumber");
	var pickupPrefix = id.split("~")[0];
	var pickupUnit = id.split("~")[1];

	//display list of prefix units from associated delivery transfer
	var sqlExpression = [];
	sqlExpression[0] = localDeliveryTransferNumber;

	var sql = "select td.localTransferNumber, ";
	sql += "td.transferNumber, ";
	sql += "td.prefix, ";
	sql += "td.unit, ";
	sql += "td.description, ";
	sql += "ts.pickupPrefix, ";
	sql += "ts.pickupUnit, ";
	sql += "ts.object ";
	sql += "from TransferDetail td ";
	sql += "left outer join TransferSwapout ts ";
	sql += "on td.localTransferNumber = ts.localDeliveryTransferNumber ";
	sql += "and td.prefix = ts.deliveryPrefix ";
	sql += "and td.unit = ts.deliveryUnit ";
	sql += "where localTransferNumber = ? ";
	var transferDetailArray = userDatabase.executeSql(sql, sqlExpression);

	var swapoutList = [];
	var selectedPrefix = "";
	var selectedUnit = "";
	for (var i=0; i < transferDetailArray.length; i++){
		var swapoutObj = {};
		if (id == (transferDetailArray[i].pickupPrefix + "~" + transferDetailArray[i].pickupUnit + "~")){
			selectedPrefix = transferDetailArray[i].prefix;
			selectedUnit = transferDetailArray[i].unit;
		}
		swapoutObj.deliveryPrefix = transferDetailArray[i].prefix;
		swapoutObj.deliveryUnit = transferDetailArray[i].unit;
		swapoutObj.deliveryDescription = transferDetailArray[i].description;
		swapoutList.push(swapoutObj);
	}

	var jsonSwapouts = {};
	jsonSwapouts.swapouts = swapoutList;
	jsonSwapouts.deliveryTransferNumber = deliveryTransferNumber;
	jsonSwapouts.localDeliveryTransferNumber = localDeliveryTransferNumber;
	jsonSwapouts.pickupTransferNumber = pickupTransferNumber;
	jsonSwapouts.localPickupTransferNumber = localPickupTransferNumber;
	jsonSwapouts.pickupPrefix = pickupPrefix;
	jsonSwapouts.pickupUnit = pickupUnit;

	$.get("/public/templates/swapoutList.html", function(data){
		var template = Handlebars.compile(data);
		var templateWithData = template(jsonSwapouts);

		modal.open({
			content: templateWithData,
			fullScreen: true,
			enableScroll: true
		}, saveSwapout);
		//mark the selected item as checked
		$(".swapoutList[data-deliveryPrefix='" + selectedPrefix +  "'][data-deliveryUnit='" + selectedUnit + "']").attr("src", "images/uhs/radiobutton-checked.png");
		$(".swapoutList").off("click");
		$(".swapoutList").on("click", function(){
			var index = $(this).attr("data-index");
			toggleRadioButton("swapoutList" + index, "swapoutList");
		});
		$(".swapoutContainerText1").off("click");
		$(".swapoutContainerText1").on("click", function(){
			var index = $(this).attr("data-index");
			toggleRadioButton("swapoutList" + index, "swapoutList");
		});
		selectedPrefix = null;
		selectedUnit = null;
		jsonSwapouts = null;
	});
	Rho.Log.info("End: swapout", "inMotion");
}

function takeDamagedItemPicture(){
	Rho.Log.info("Start: takeDamagedItemPicture()", "inMotion");
	var continueOn = true;
	var localDamagedItemId = $("#localDamagedItemId").val();
	if(!Rho.System.isEmulator && !Rho.System.isRhoSimulator && Rho.System.hasCamera) {
		if (localDamagedItemId == 0 ) {
			continueOn = false;
			if (saveDamagedItemUpdate()) {
				continueOn = true;
			}
		}
		if (continueOn) {
			Rho.Barcode.disable();
			try {
				Rho.Camera.take_picture(saveDamagedItemURI, {
					camera_type: "main",
					desired_width: 133,
					desired_height : 100,
					format: "jpeg"	
				});
			}
			catch (e) {
				Rho.Log.info("Error: takeDamagedItemPicture(" + e.message + ")", "inMotion");
		        alert("Unable to capture photo, please restart the application or contact inMotion Support.");
		    }
		}
	}
	else if (Rho.System.isRhoSimulator) {
		alert("using fake image...");
		if (localDamagedItemId == 0 ) {
			continueOn = false;
			if (saveDamagedItemUpdate()) {
				continueOn = true;
			}
		}
		if (continueOn) {
			saveDamagedItemPicture({"data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAlgAAAEsCAYAAAAfPc2WAAAABHNCSVQICAgIfAhkiAAABWRJREFUeJzt1sEJACAQwDB1/53PJQqCJBP02T0zswAAyJzXAQAAvzFYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAEDNYAAAxgwUAELtFfAZUNqHyVgAAAABJRU5ErkJggg=="});
		}
	}
	else{
		alert("Your device does not have a camera to take images.");
	}
	Rho.Log.info("End: takeDamagedItemPicture", "inMotion");
}

function saveDamagedItemURI(params) {
	Rho.Log.info("Start: saveDamagedItemURI()", "inMotion");
	getImageDataURL(Rho.Application.expandDatabaseBlobFilePath(params.image_uri), saveDamagedItemPicture);
	Rho.Log.info("End: saveDamagedItemURI", "inMotion");
}

function saveDamagedItemPicture(params){
	Rho.Log.info("Start: saveDamagedItemPicture()", "inMotion");
	var img = params.data.replace(/^data:image\/[^;]+;base64,/,'');
	var damagedItemId = $("#damagedItemId").val();
	var localDamagedItemId = $("#localDamagedItemId").val();
	var currentEmployeeId = $("#tripContainer").attr("data-currentEmployeeId");
	//lookup count of damaged item pictures for this damagedItemId
	var sqlExpression = [];
	sqlExpression[0] = localDamagedItemId;

	var sql = "select dd.base64Image, ";
	sql += "dd.damagedItemDetailId, ";
	sql += "dd.damagedItemId, ";
	sql += "dd.localDamagedItemDetailId, ";
	sql += "dd.localDamagedItemId, ";
	sql += "object ";
	sql += "from DamagedItemDetail dd ";
	sql += "where dd.localDamagedItemId = ? ";

	var resultArray = userDatabase.executeSql(sql, sqlExpression);
	var count = resultArray.length;
	//create damagedItemDetail record
	var damagedItemDetail = damagedItemDetailModel.create({
		"base64Image": img,
		"damagedItemDetailId": 0,
		"damagedItemId": damagedItemId,
		"localDamagedItemDetailId": 0,
		"localDamagedItemId": localDamagedItemId,
		"employeeId": currentEmployeeId
	});

	damagedItemDetail.updateAttributes({
		localDamagedItemDetailId: damagedItemDetail.get("object")
	});

	if (count === 0){
		//populate image 1
		$("#damagedItemPicture1").attr("src", "data:image/jpeg;base64," + damagedItemDetail.get("base64Image"));
		$("#damagedItemPicture1").css({"height":"100", "width":"133"});
	}
	else if (count == 1){
		$("#damagedItemPicture2").attr("src", "data:image/jpeg;base64," + damagedItemDetail.get("base64Image"));
		$("#damagedItemPicture2").css({"height":"100", "width":"133"});
	}
	else if (count == 2){
		$("#damagedItemPicture3").attr("src", "data:image/jpeg;base64," + damagedItemDetail.get("base64Image"));
		$("#damagedItemPicture3").css({"height":"100", "width":"133"});
	}
	else {
		$("#damagedItemPicture4").attr("src", "data:image/jpeg;base64," + damagedItemDetail.get("base64Image"));
		$("#damagedItemPicture4").css({"height":"100", "width":"133"});
		$("#takeDamagedItemPictureButton").hide();
	}
	
	//to refresh page if close is chosen (not save)
	var localTransferNumber = $("#taskHeaderContainer").attr("data-localTransferNumber");
	var transferType = $("#taskHeaderContainer").attr("data-transferType");
	readTaskDetail(transferType + "~" + localTransferNumber);

    Rho.Log.info("End: saveDamagedItemPicture", "inMotion");
}

function toggleNotFound(id){
	Rho.Log.info("Start: toggleNotFound(" + id + ")", "inMotion");

	if ($("img[data-itemId='" + id + "']").attr("src") == "images/uhs/scanOnVehicle.png"){
		var message = confirm("You have scanned this item and are about to mark it as not found. \n\n Continue?");
		if (message === true) {
   			$("img[data-itemId='" + id + "']").attr("src", "images/uhs/notFound.png");
		}
	}
	else if ($("img[data-itemId='" + id + "']").attr("src") == "images/uhs/blank.png"){
		$("img[data-itemId='" + id + "']").attr("src", "images/uhs/notFound.png");
	}
	else {
		$("img[data-itemId='" + id + "']").attr("src", "images/uhs/blank.png");
	}
	Rho.Log.info("End: toggleNotFound", "inMotion");
}